import asyncio
from shared.database import AsyncSessionLocal
from shared.models import User
from sqlalchemy.future import select

async def check_users():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User))
        users = result.scalars().all()
        print(f"{'ID':<4} | {'Email':<30} | {'Is Owner':<8} | {'Is Admin':<8} | {'Full Name'}")
        print("-" * 80)
        for user in users:
            print(f"{user.id:<4} | {user.email:<30} | {str(user.is_owner):<8} | {str(user.is_admin):<8} | {user.full_name}")

if __name__ == "__main__":
    asyncio.run(check_users())
