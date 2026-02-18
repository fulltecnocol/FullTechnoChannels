
import asyncio
from sqlalchemy import select
from infrastructure.database.connection import AsyncSessionLocal
from core.entities import User
from core.use_cases.auth import AuthService

async def seed_users():
    async with AsyncSessionLocal() as session:
        users_to_seed = [
            {"email": "admin@fgate.co", "password": "admin123", "role": "admin"},
            {"email": "fulltecnocol@gmail.com", "password": "Agosto12??", "role": "owner"}
        ]

        for u_data in users_to_seed:
            email = u_data["email"]
            raw_password = u_data["password"]
            hashed_password = AuthService.get_password_hash(raw_password)

            print(f"Checking for user {email}...")
            result = await session.execute(select(User).where(User.email == email))
            user = result.scalar_one_or_none()

            if user:
                print(f"User {email} found. Updating password and permissions...")
                user.hashed_password = hashed_password
                user.is_admin = True
                user.is_owner = True
                if not user.referral_code:
                    user.referral_code = email.split("@")[0]
            else:
                print(f"User {email} not found. Creating new user...")
                from datetime import datetime
                user = User(
                    email=email,
                    hashed_password=hashed_password,
                    is_admin=True,
                    is_owner=True,
                    full_name="Felipe Gomez",
                    referral_code=email.split("@")[0],
                    created_at=datetime.utcnow()
                )
                session.add(user)
        
        await session.commit()
        print("Successfully seeded users.")

if __name__ == "__main__":
    asyncio.run(seed_users())
