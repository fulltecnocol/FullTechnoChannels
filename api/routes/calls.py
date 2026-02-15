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
    current_user: User = Depends(get_current_user),
    db: AsyncSessionLocal = Depends(get_db)
):
    """Get the current user's call service configuration"""
    result = await db.execute(
        select(CallService)
        .where(CallService.owner_id == current_user.id)
        .options(selectinload(CallService.slots))
    )
    service = result.scalar_one_or_none()
    
    if not service:
        # Return empty default config if not set
        return CallConfigOut(
            id=0, 
            price=0, 
            duration_minutes=30, 
            description="", 
            is_active=False,
            slots=[]
        )
    
    # Filter only future slots for display if needed, but for owner we show all? 
    # Let's show all for now.
    return service

@router.post("/config", response_model=CallConfigOut)
async def update_call_config(
    config: CallConfigIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSessionLocal = Depends(get_db)
):
    """Update or create call service configuration"""
    result = await db.execute(
        select(CallService).where(CallService.owner_id == current_user.id)
    )
    service = result.scalar_one_or_none()
    
    if service:
        service.price = config.price
        service.duration_minutes = config.duration_minutes
        service.description = config.description
        service.is_active = config.is_active
    else:
        service = CallService(
            owner_id=current_user.id,
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
