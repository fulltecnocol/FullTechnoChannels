import asyncio
import sys
import os
import uuid
import uuid
from sqlalchemy.future import select

# Add root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from shared.database import AsyncSessionLocal
from shared.models import User, Channel, Plan

async def seed_data():
    print("🌱 Starting Database Seeding...")
    
    async with AsyncSessionLocal() as session:
        # 1. Ensure Owner Exists
        print("🔍 Checking for existing Owner...")
        # Check for our test user email first
        result = await session.execute(select(User).where(User.email == "admin@telegate.com"))
        owner = result.scalar_one_or_none()
        
        if not owner:
            # Create a new owner if not found
            print("   Creating default Owner (admin@telegate.com)...")
            owner = User(
                email="admin@telegate.com",
                full_name="TeleGate Admin",
                is_owner=True,
                is_admin=True,
                hashed_password="hashed_password_placeholder", # In production this should be properly hashed
                referral_code=str(uuid.uuid4())[:8]
            )
            session.add(owner)
            await session.commit()
            await session.refresh(owner)
            print(f"   ✅ Owner Created: ID {owner.id}")
        else:
            print(f"   ✅ Owner exists: ID {owner.id}")

        # 2. Ensure Channel Exists
        print("🔍 Checking for existing Channel...")
        result = await session.execute(select(Channel).where(Channel.owner_id == owner.id))
        channel = result.scalars().first()
        
        if not channel:
            print("   Creating default Channel...")
            channel = Channel(
                owner_id=owner.id,
                title="TeleGate VIP Channel",
                validation_code=str(uuid.uuid4())[:8],
                is_verified=True, # Auto-verify for testing
                telegram_id=-1001234567890 # Mock ID
            )
            session.add(channel)
            await session.commit()
            await session.refresh(channel)
            print(f"   ✅ Channel Created: ID {channel.id} - {channel.title}")
        else:
            print(f"   ✅ Channel exists: ID {channel.id} - {channel.title}")

        # 3. Ensure Plans Exist
        print("🔍 Checking for Plans...")
        result = await session.execute(select(Plan).where(Plan.channel_id == channel.id))
        existing_plans = result.scalars().all()
        
        if not existing_plans:
            print("   Creating default Plans...")
            new_plans = [
                Plan(
                    channel_id=channel.id,
                    name="Mensual VIP",
                    description="Acceso completo por 1 mes",
                    price=9.99,
                    duration_days=30,
                    is_active=True
                ),
                Plan(
                    channel_id=channel.id,
                    name="Anual VIP (Ahorra 20%)",
                    description="Acceso completo por 1 año",
                    price=99.99,
                    duration_days=365,
                    is_active=True
                ),
                Plan(
                    channel_id=channel.id,
                    name="Trial 7 Días",
                    description="Prueba gratuita",
                    price=0.00,
                    duration_days=7,
                    is_active=True
                )
            ]
            session.add_all(new_plans)
            await session.commit()
            print("   ✅ Created 3 verified plans.")
        else:
            print(f"   ✅ Found {len(existing_plans)} existing plans.")

    print("\n🌱 Seeding Complete!")

if __name__ == "__main__":
    asyncio.run(seed_data())
