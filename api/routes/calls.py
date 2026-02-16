from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import and_
from shared.database import get_db, AsyncSessionLocal
from shared.models import User, CallService, CallSlot, CallBooking
from api.deps import get_current_user
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
from shared.utils.calendar import generate_calendar_links
from shared.services.availability_service import invalidate_service_cache
import logging

# Configurar logging para facilitar depuración en Cloud Run
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/calls", tags=["calls"])

# --- SCHEMAS ---
class CallServiceSchema(BaseModel):
    channel_id: Optional[int] = None
    price: float
    duration_minutes: int
    description: str # Mandatorio ahora si es el nombre
    is_active: bool = True

class CallSlotIn(BaseModel):
    start_time: datetime
    service_id: int # REQUIRED NOW

class CallSlotOut(BaseModel):
    id: int
    service_id: int
    start_time: datetime
    is_booked: bool
    jitsi_link: Optional[str] = None
    booked_by_name: Optional[str] = None # Helper for UI
    calendar_links: Optional[dict] = None # New: Links for Google, Outlook, Yahoo

    class Config:
        from_attributes = True

class CallServiceOut(CallServiceSchema):
    id: int
    slots: List[CallSlotOut] = []

    class Config:
        from_attributes = True

# --- ENDPOINTS ---

@router.get("/services", response_model=List[CallServiceOut])
async def get_services(
    channel_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSessionLocal = Depends(get_db)
):
    """Get all call services for the user/channel"""
    try:
        query = select(CallService).where(CallService.owner_id == current_user.id)
        if channel_id:
            query = query.where(CallService.channel_id == channel_id)

        # Load slots AND the booked_by user for those slots
        result = await db.execute(
            query.options(
                selectinload(CallService.slots).selectinload(CallSlot.booked_by)
            )
        )
        services = result.scalars().all()
        
        # 1. Fetch confirmed bookings (modern system)
        service_ids = [s.id for s in services]
        all_bookings = []
        if service_ids:
            bookings_res = await db.execute(
                select(CallBooking).where(
                    and_(
                        CallBooking.service_id.in_(service_ids),
                        CallBooking.status == "confirmed"
                    )
                ).options(selectinload(CallBooking.booker))
            )
            all_bookings = bookings_res.scalars().all()

        final_services = []
        for svc in services:
            current_slots = []
            
            # 1.1 Process legacy slots (CallSlot)
            for slot in svc.slots:
                slot_data = {
                    "id": slot.id,
                    "service_id": slot.service_id,
                    "start_time": slot.start_time,
                    "is_booked": slot.is_booked,
                    "jitsi_link": slot.jitsi_link,
                    "booked_by_name": slot.booked_by.full_name if slot.booked_by else None,
                    "calendar_links": None
                }
                
                if slot.is_booked:
                    end_time = slot.start_time + timedelta(minutes=svc.duration_minutes)
                    slot_data["calendar_links"] = generate_calendar_links(
                        title=f"Llamada: {svc.description}",
                        start_time=slot.start_time,
                        end_time=end_time,
                        description=f"Sesión reservada de {svc.description}. Link de reunión: {slot.jitsi_link}",
                        location=slot.jitsi_link or "Online"
                    )
                current_slots.append(slot_data)
            
            # 1.2 Process modern bookings (CallBooking) as pseudo-slots
            svc_bookings = [b for b in all_bookings if b.service_id == svc.id]
            for b in svc_bookings:
                # Evitar duplicados si ya existe un slot para este mismo tiempo
                if any(s["start_time"] == b.start_time for s in current_slots):
                    continue

                actual_end = b.end_time or (b.start_time + timedelta(minutes=svc.duration_minutes))
                current_slots.append({
                    "id": 1000000 + b.id,
                    "service_id": svc.id,
                    "start_time": b.start_time,
                    "is_booked": True,
                    "jitsi_link": b.meeting_link,
                    "booked_by_name": b.booker.full_name if b.booker else "Usuario Telegram",
                    "calendar_links": generate_calendar_links(
                        title=f"Llamada: {svc.description}",
                        start_time=b.start_time,
                        end_time=actual_end,
                        description=f"Sesión reservada de {svc.description}. Link de reunión: {b.meeting_link}",
                        location=b.meeting_link or "Online"
                    )
                })

            final_services.append({
                "id": svc.id,
                "channel_id": svc.channel_id,
                "price": float(svc.price),
                "duration_minutes": svc.duration_minutes,
                "description": svc.description,
                "is_active": svc.is_active,
                "slots": current_slots
            })

        return final_services
    except Exception as e:
        logger.error(f"FATAL Error in get_services: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/services", response_model=CallServiceOut)
async def create_service(
    service_in: CallServiceSchema,
    current_user: User = Depends(get_current_user),
    db: AsyncSessionLocal = Depends(get_db)
):
    """Create a new call service"""
    service = CallService(
        owner_id=current_user.id,
        channel_id=service_in.channel_id,
        price=service_in.price,
        duration_minutes=service_in.duration_minutes,
        description=service_in.description,
        is_active=service_in.is_active
    )
    db.add(service)
    await db.commit()
    # Reload with slots eagerly loaded to avoid MissingGreenlet
    result = await db.execute(
        select(CallService)
        .where(CallService.id == service.id)
        .options(selectinload(CallService.slots))
    )
    service = result.scalar_one()
    
    return service

@router.put("/services/{service_id}", response_model=CallServiceOut)
async def update_service(
    service_id: int,
    service_in: CallServiceSchema,
    current_user: User = Depends(get_current_user),
    db: AsyncSessionLocal = Depends(get_db)
):
    """Update a service"""
    result = await db.execute(select(CallService).where(CallService.id == service_id, CallService.owner_id == current_user.id))
    service = result.scalar_one_or_none()
    
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    service.price = service_in.price
    service.duration_minutes = service_in.duration_minutes
    service.description = service_in.description
    service.is_active = service_in.is_active
    # channel_id usually doesn't change, but ok

    await db.commit()
    await db.refresh(service)
    return service

@router.delete("/services/{service_id}")
async def delete_service(
    service_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSessionLocal = Depends(get_db)
):
    """Delete a service"""
    result = await db.execute(select(CallService).where(CallService.id == service_id, CallService.owner_id == current_user.id))
    service = result.scalar_one_or_none()
    
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    await db.delete(service)
    await db.commit()
    return {"status": "deleted"}

# Backward compatibility (optional) -> Redirect to First Service or Empty
@router.get("/config")
async def get_config_deprecated():
    raise HTTPException(status_code=410, detail="Use /services endpoints")


@router.post("/slots", response_model=List[CallSlotOut])
async def add_slots(
    slots: List[CallSlotIn],
    current_user: User = Depends(get_current_user),
    db: AsyncSessionLocal = Depends(get_db)
):
    """Add availability slots"""
    new_slots = []
    
    # Pre-fetch services to validate ownership efficiently
    service_ids = list(set([s.service_id for s in slots]))
    services_res = await db.execute(select(CallService).where(CallService.id.in_(service_ids), CallService.owner_id == current_user.id))
    valid_services = {s.id for s in services_res.scalars().all()}

    for slot_in in slots:
        if slot_in.service_id not in valid_services:
            raise HTTPException(status_code=400, detail=f"Invalid service ID: {slot_in.service_id}")

        slot = CallSlot(
            service_id=slot_in.service_id,
            start_time=slot_in.start_time,
            is_booked=False
        )
        db.add(slot)
        new_slots.append(slot)
    
    await db.commit()
    for s in new_slots:
        await db.refresh(s)
        
    return new_slots

@router.delete("/slots/{slot_id}")
async def delete_slot(
    slot_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSessionLocal = Depends(get_db)
):
    """Delete a slot if it is not booked"""
    # Verify ownership via join
    result = await db.execute(
        select(CallSlot)
        .join(CallService)
        .where(
            CallSlot.id == slot_id,
            CallService.owner_id == current_user.id
        )
    )
    slot = result.scalar_one_or_none()
    
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
        
    if slot.is_booked:
        raise HTTPException(status_code=400, detail="Cannot delete a booked slot")
        
    await db.delete(slot)
    await db.commit()
    return {"status": "deleted"}


# --- RECURRING ENDPOINT ---

class GenerateSlotsIn(BaseModel):
    service_id: int # REQUIRED
    days_of_week: List[int]  # 0=Mon, 6=Sun
    start_time: str  # HH:MM
    end_time: str    # HH:MM
    start_date: datetime 
    end_date: datetime

@router.post("/availability/generate", response_model=List[CallSlotOut])
async def generate_slots(
    data: GenerateSlotsIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSessionLocal = Depends(get_db)
):
    """Generate slots for a date range based on recurring rules"""
    # 1. Get Service
    result = await db.execute(select(CallService).where(CallService.id == data.service_id, CallService.owner_id == current_user.id))
    service = result.scalar_one_or_none()
    
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    duration = service.duration_minutes
    if duration < 5:
        raise HTTPException(status_code=400, detail="Duration too short")

    # Parse times
    try:
        start_h, start_m = map(int, data.start_time.split(':'))
        end_h, end_m = map(int, data.end_time.split(':'))
    except:
        raise HTTPException(status_code=400, detail="Invalid time format (HH:MM)")

    new_slots = []
    
    # Iterate through days
    from datetime import timedelta
    
    # Ensure we use date objects for iteration
    current_date = data.start_date.date()
    end_date_obj = data.end_date.date()
    
    while current_date <= end_date_obj:
        # Check if day match
        if current_date.weekday() in data.days_of_week:
            # Generate slots for this day
            slot_start = datetime.combine(current_date, datetime.min.time()).replace(hour=start_h, minute=start_m)
            day_end = datetime.combine(current_date, datetime.min.time()).replace(hour=end_h, minute=end_m)
            
            # Use strict comparison for start_time to avoid infinite loops if duration is 0 (handled above)
            current_slot = slot_start
            while current_slot + timedelta(minutes=duration) <= day_end:
                # Create slot
                slot = CallSlot(
                    service_id=service.id,
                    start_time=current_slot,
                    is_booked=False
                )
                db.add(slot)
                new_slots.append(slot)
                
                current_slot += timedelta(minutes=duration)
        
        current_date += timedelta(days=1)
    
    await db.commit()
    for s in new_slots:
        await db.refresh(s)
        
    return new_slots
