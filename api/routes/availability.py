from datetime import datetime, timedelta, time
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.future import select
from sqlalchemy import and_, or_
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, Field

from shared.database import get_db, AsyncSessionLocal
from shared.models import User, CallService, AvailabilityRange, CallBooking
from api.deps import get_current_user
from shared.services.availability_service import invalidate_service_cache

router = APIRouter(prefix="/availability", tags=["Availability"])

# --- SCHEMAS ---

class AvailabilityRangeBase(BaseModel):
    day_of_week: int = Field(..., ge=0, le=6, description="0=Monday, 6=Sunday")
    start_time: str = Field(..., pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")
    end_time: str = Field(..., pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")
    is_recurring: bool = True

class AvailabilityRangeCreate(AvailabilityRangeBase):
    pass

class AvailabilityRangeOut(AvailabilityRangeBase):
    id: int
    owner_id: int

    class Config:
        orm_mode = True

class TimeSlot(BaseModel):
    start: datetime
    end: datetime
    available: bool

# --- ENDPOINTS ---

@router.post("/", response_model=List[AvailabilityRangeOut])
async def set_availability(
    ranges: List[AvailabilityRangeCreate],
    current_user: User = Depends(get_current_user),
    db: AsyncSessionLocal = Depends(get_db)
):
    """
    Overwrite all availability ranges for the user (Recurring only for MVP).
    Deletes existing recurring ranges and saves new ones.
    """
    # 1. Delete existing recurring ranges
    await db.execute(
        select(AvailabilityRange)
        .where(AvailabilityRange.owner_id == current_user.id)
        .where(AvailabilityRange.is_recurring == True)
        .execution_options(synchronize_session=False)
    )
    # Note: efficient deletion might require delete(AvailabilityRange)... but this select logic is flawed for deletion.
    # Let's use loop for safety or specific delete query.
    # Safe way:
    existing = await db.execute(
        select(AvailabilityRange).where(
            and_(AvailabilityRange.owner_id == current_user.id, AvailabilityRange.is_recurring == True)
        )
    )
    for row in existing.scalars():
        await db.delete(row)

    # 2. Add new ranges
    new_ranges = []
    for r in ranges:
        # Basic validation: Start < End
        if r.start_time >= r.end_time:
            raise HTTPException(400, f"Start time {r.start_time} must be before end time {r.end_time}")

        db_range = AvailabilityRange(
            owner_id=current_user.id,
            day_of_week=r.day_of_week,
            start_time=r.start_time,
            end_time=r.end_time,
            is_recurring=True
        )
        db.add(db_range)
        new_ranges.append(db_range)

    await db.commit()
    
    # Refresh to return IDs
    # (Optional, usually we just return success or re-query)
    # Let's re-query to be safe
    result = await db.execute(
        select(AvailabilityRange).where(AvailabilityRange.owner_id == current_user.id)
    )
    return result.scalars().all()


@router.get("/", response_model=List[AvailabilityRangeOut])
async def get_availability(
    current_user: User = Depends(get_current_user),
    db: AsyncSessionLocal = Depends(get_db)
):
    result = await db.execute(
        select(AvailabilityRange).where(AvailabilityRange.owner_id == current_user.id)
    )
    return result.scalars().all()


class BlockSlotIn(BaseModel):
    service_id: int
    start_time: datetime
    end_time: datetime

@router.post("/block")
async def block_availability(
    data: BlockSlotIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSessionLocal = Depends(get_db)
):
    """
    Blocks a specific time range by creating a CallBooking with status 'blocked'.
    """
    # Verify service ownership
    result = await db.execute(
        select(CallService).where(CallService.id == data.service_id, CallService.owner_id == current_user.id)
    )
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    # Create blocked booking
    booking = CallBooking(
        service_id=data.service_id,
        start_time=data.start_time,
        end_time=data.end_time,
        status="blocked"
    )
    db.add(booking)
    db.add(booking)
    await db.commit()
    await invalidate_service_cache(data.service_id)
    return {"status": "blocked", "start_time": data.start_time}


@router.get("/slots")
async def get_dynamic_slots(
    service_id: int,
    from_date: str, # YYYY-MM-DD
    to_date: str,   # YYYY-MM-DD
    db: AsyncSessionLocal = Depends(get_db)
):
    """
    Calculates available slots dynamically based on:
    1. Service Duration
    2. User's Availability Ranges (General hours)
    3. Existing Bookings (Capacity)
    """
    # Use shared logic
    from shared.services.availability_service import get_available_slots
    
    slots = await get_available_slots(db, service_id, from_date, to_date)
    
    # Format for API response
    return [
        {
            "start_time": s["start_time"].isoformat(),
            "end_time": s["end_time"].isoformat(),
            "available": s["available"]
        }
        for s in slots
    ]
