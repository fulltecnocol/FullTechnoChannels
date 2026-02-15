from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy.future import select
from sqlalchemy import and_
from sqlalchemy.ext.asyncio import AsyncSession

from shared.models import CallService, AvailabilityRange, CallBooking

async def get_available_slots(
    db: AsyncSession,
    service_id: int,
    from_date: str, # YYYY-MM-DD
    to_date: str    # YYYY-MM-DD
) -> List[Dict[str, Any]]:
    """
    Calculates available slots dynamically based on:
    1. Service Duration
    2. User's Availability Ranges (General hours)
    3. Existing Bookings (Capacity)
    """
    # 1. Fetch Service
    service = await db.get(CallService, service_id)
    if not service or not service.is_active:
        return []

    duration = timedelta(minutes=service.duration_minutes)
    owner_id = service.owner_id

    # 2. Parse Dates
    try:
        start_dt = datetime.strptime(from_date, "%Y-%m-%d")
        end_dt = datetime.strptime(to_date, "%Y-%m-%d") + timedelta(days=1) # Include full last day
    except ValueError:
        return []

    # 3. Fetch Availability Ranges
    avail_res = await db.execute(
        select(AvailabilityRange).where(AvailabilityRange.owner_id == owner_id)
    )
    avail_ranges = avail_res.scalars().all()

    if not avail_ranges:
        return []

    # 4. Fetch Existing Bookings in Date Range
    bookings_res = await db.execute(
        select(CallBooking)
        .join(CallService)
        .where(
            and_(
                CallService.owner_id == owner_id,
                CallBooking.start_time < end_dt, # Overlap check
                CallBooking.end_time > start_dt,
                CallBooking.status != "cancelled"
            )
        )
    )
    bookings = bookings_res.scalars().all()

    # 5. Calculate Slots
    available_slots = []
    
    current_day = start_dt

    while current_day < end_dt:
        weekday = current_day.weekday() # 0=Mon
        
        # Get ranges for this weekday
        day_ranges = [r for r in avail_ranges if r.day_of_week == weekday and r.is_recurring]
        
        for r in day_ranges:
            try:
                h_start, m_start = map(int, r.start_time.split(":"))
                h_end, m_end = map(int, r.end_time.split(":"))
            except ValueError:
                continue
            
            range_start = current_day.replace(hour=h_start, minute=m_start, second=0, microsecond=0)
            range_end = current_day.replace(hour=h_end, minute=m_end, second=0, microsecond=0)
            
            if range_end <= range_start:
                 continue

            slot_time = range_start
            while slot_time + duration <= range_end:
                slot_end = slot_time + duration
                
                # CHECK OVERLAPS
                is_clashing = False
                for b in bookings:
                    if (slot_time < b.end_time) and (slot_end > b.start_time):
                        is_clashing = True
                        break
                
                # Check if slot is in the past (Generic Check)
                if slot_time < datetime.utcnow():
                    is_clashing = True

                if not is_clashing:
                    available_slots.append({
                        "start_time": slot_time, # Keep as datetime object for internal use? No, convert to ISO or keep structure consistent.
                        # API returns ISO strings, Bot might need datetime objects.
                        # Let's return objects/dicts with datetime and convert if needed.
                        "end_time": slot_end,
                        "available": True
                    })
                
                slot_time += duration

        current_day += timedelta(days=1)

    return available_slots
