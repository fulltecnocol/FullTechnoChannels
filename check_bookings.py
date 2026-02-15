
import asyncio
from shared.database import AsyncSessionLocal
from shared.models import CallBooking
from sqlalchemy import select

async def check_bookings():
    async with AsyncSessionLocal() as session:
        res = await session.execute(select(CallBooking))
        bookings = res.scalars().all()
        for b in bookings:
            print(f"ID: {b.id}, SVC_ID: {b.service_id}, Start: {b.start_time}, Status: {b.status}, Link: {b.meeting_link}")

if __name__ == "__main__":
    asyncio.run(check_bookings())
