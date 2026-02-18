from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy.future import select
from sqlalchemy import and_
from sqlalchemy.ext.asyncio import AsyncSession

import json
from core.entities.call_service import CallService, AvailabilityRange, CallBooking
from infrastructure.database.connection import redis_client

async def invalidate_service_cache(service_id: int):
    """Invalidate all availability caches for a specific service"""
    # Pattern match is slow, simpler to just rely on TTL or precise keys if possible.
    # For now, we will perform a scan (safe for medium load) or just rely on short TTL for general browsing.
    # But for robustness, let's use a tag-like approach or just simple SCAN for this service prefix.
    try:
        cursor = b"0"
        while cursor:
             cursor, keys = await redis_client.scan(cursor, match=f"avail:{service_id}:*", count=100)
             if keys:
                 await redis_client.delete(*keys)
    except Exception as e:
        print(f"Cache invalidation error: {e}")

async def invalidate_user_cache(user_id: int):
    """Invalidate all availability caches for a specific user (all their services)"""
    # This is expensive without a map of User -> Services.
    # But since we use 'avail:service_id:...', we can't easily match by user_id unless we know service IDs.
    # For MVP/Option B, we will rely on TTL for 'set_availability' or we can fetch services and invalidate.
    # Let's fetch services to be robust.
    # We require db session for that, which this function doesn't have.
    # Alternative: Use a pattern if we stored owner_id in key? No.
    # We will pass DB to this function or just accept 60s inconsistency for general settings change.
    # BETTER: The caller (route) has DB, so the ROUTE should fetch services and call invalidate_service_cache loop.
    pass

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
    cache_key = f"avail:{service_id}:{from_date}:{to_date}"

    # Try Cache
    try:
        cached = await redis_client.get(cache_key)
        if cached:
            data = json.loads(cached)
            # Reparse ISO strings back to datetime objects
            for slot in data:
                if isinstance(slot.get("start_time"), str):
                    slot["start_time"] = datetime.fromisoformat(slot["start_time"])
                if isinstance(slot.get("end_time"), str):
                    slot["end_time"] = datetime.fromisoformat(slot["end_time"])
            return data
    except Exception as e:
        print(f"Cache read error: {e}")
        pass # Fallback to DB

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

    # Cache Result (TTL 60s)
    try:
        await redis_client.setex(
            cache_key,
            60,
            json.dumps(available_slots, default=str) # default=str handles datetime serialization
        )
    except Exception:
        pass

    return available_slots
