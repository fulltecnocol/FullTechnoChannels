import asyncio
import sys
import os
from unittest.mock import AsyncMock, MagicMock

# Add root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from shared.database import AsyncSessionLocal
from shared.models import User as DBUser
from sqlalchemy.future import select
from bot.main import get_or_create_user, send_welcome

# Mock Aiogram types
class MockUser:
    def __init__(self, id, username, full_name):
        self.id = id
        self.username = username
        self.full_name = full_name
        self.is_bot = False

class MockMessage:
    def __init__(self, from_user, text=""):
        self.from_user = from_user
        self.text = text
        self.chat = MagicMock()
        self.chat.id = from_user.id
        self.reply = AsyncMock()
        self.answer = AsyncMock()

class MockCommand:
    def __init__(self, args=None):
        self.args = args

async def test_bot_logic():
    print("Testing Bot Logic...")
    
    # 1. Test get_or_create_user
    print("\n-> Testing get_or_create_user...")
    tg_id = 123456789
    mock_tg_user = MockUser(id=tg_id, username="test_bot_user", full_name="Test Bot User")
    
    async with AsyncSessionLocal() as session:
        # Clean up previous runs
        existing = await session.execute(select(DBUser).where(DBUser.telegram_id == tg_id))
        user_db = existing.scalar_one_or_none()
        if user_db:
            print("   (Cleaning up existing test user)")
            await session.delete(user_db)
            await session.commit()

        user = await get_or_create_user(mock_tg_user, session)
        print(f"OK: User created/retrieved. ID: {user.id}, Telegram ID: {user.telegram_id}")
        assert user.telegram_id == tg_id

    # 2. Test Account Linking (Sync)
    print("\n-> Testing Account Linking (/start sync_CODE)...")
    # First, get a web user (created in backend verification)
    async with AsyncSessionLocal() as session:
        # Find any user with is_owner=True (from backend test)
        result = await session.execute(select(DBUser).where(DBUser.is_owner == True))
        web_user = result.scalars().first()
        
        if not web_user:
            print("SKIPPED: No web user found to link. Run verify_backend.py first.")
        else:
            print(f"   Target Web User: {web_user.email} (Ref Code: {web_user.referral_code})")
            
            # Simulate /start sync_REFCODE from a NEW telegram user
            new_tg_id = 987654321
            new_tg_user = MockUser(id=new_tg_id, username="linker_user", full_name="Linker User")
            message = MockMessage(from_user=new_tg_user)
            command = MockCommand(args=f"sync_{web_user.referral_code}")
            
            # Mock session inside send_welcome? 
            # send_welcome creates its own session: async with AsyncSessionLocal() as session:
            # So we just call it.
            
            try:
                await send_welcome(message, command)
                
                # Verify DB update
                await session.refresh(web_user)
                if web_user.telegram_id == new_tg_id:
                     print(f"SUCCESS: Web user {web_user.email} linked to Telegram ID {new_tg_id}")
                else:
                     print(f"FAILED: Link not updated. Current Telegram ID: {web_user.telegram_id}")
                     
            except Exception as e:
                print(f"ERROR calling send_welcome: {e}")

    print("\nBot Logic Verification Complete!")

if __name__ == "__main__":
    asyncio.run(test_bot_logic())
