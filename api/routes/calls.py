from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from shared.database import get_db, AsyncSessionLocal
from shared.models import User, CallService, CallSlot
from api.deps import get_current_user
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/calls", tags=["calls"])

# --- SCHEMAS ---
class CallConfigIn(BaseModel):
    channel_id: Optional[int] = None
    price: float
    duration_minutes: int
    description: Optional[str] = None
    is_active: bool = True

class CallSlotIn(BaseModel):
    start_time: datetime

class CallSlotOut(BaseModel):
    id: int
    start_time: datetime
    is_booked: bool
    jitsi_link: Optional[str] = None

    class Config:
        from_attributes = True

class CallConfigOut(CallConfigIn):
    id: int
    slots: List[CallSlotOut] = []

    class Config:
        from_attributes = True

# --- ENDPOINTS ---

@router.get("/config", response_model=CallConfigOut)
async def get_call_config(
    channel_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSessionLocal = Depends(get_db)
):
    """Get the current user's call service configuration"""
    query = select(CallService).where(CallService.owner_id == current_user.id)
    
    if channel_id:
        query = query.where(CallService.channel_id == channel_id)

    # If no channel_id, we might get multiple. Return first for now.
    result = await db.execute(query.options(selectinload(CallService.slots)))
    service = result.scalars().first()
    
    if not service:
        # Return empty default config if not set
        return CallConfigOut(
            id=0,
            channel_id=channel_id,
            price=0, 
            duration_minutes=30, 
            description="", 
            is_active=False,
            slots=[]
        )
    
    return service

@router.post("/config", response_model=CallConfigOut)
async def update_call_config(
    config: CallConfigIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSessionLocal = Depends(get_db)
):
    """Update or create call service configuration"""
    query = select(CallService).where(CallService.owner_id == current_user.id)
    if config.channel_id:
        query = query.where(CallService.channel_id == config.channel_id)

    result = await db.execute(query)
    service = result.scalars().first()
    
    if service:
        service.price = config.price
        service.duration_minutes = config.duration_minutes
        service.description = config.description
        service.is_active = config.is_active
        # service.channel_id = config.channel_id # usually fixed
    else:
        service = CallService(
            owner_id=current_user.id,
            channel_id=config.channel_id,
            price=config.price,
            duration_minutes=config.duration_minutes,
            description=config.description,
            is_active=config.is_active
        )
        db.add(service)
    
    await db.commit()
    await db.refresh(service)
    return service

@router.post("/slots", response_model=List[CallSlotOut])
async def add_slots(
    slots: List[CallSlotIn],
    current_user: User = Depends(get_current_user),
    db: AsyncSessionLocal = Depends(get_db)
):
    """Add availability slots"""
    # 1. Get Service
    result = await db.execute(
        select(CallService).where(CallService.owner_id == current_user.id)
    )
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=400, detail="Must configure service first")

    new_slots = []
    for slot_in in slots:
        slot = CallSlot(
            service_id=service.id,
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
    channel_id: Optional[int] = None
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
    query = select(CallService).where(CallService.owner_id == current_user.id)
    if data.channel_id:
        query = query.where(CallService.channel_id == data.channel_id)

    result = await db.execute(query)
    service = result.scalars().first()
    
    if not service:
        raise HTTPException(status_code=400, detail="Must configure service first for this channel")
    
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
