import os
import asyncio
from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

# Load environment variables
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("❌ DATABASE_URL not found. Please create a .env file with DATABASE_URL")

async def list_users_full():
    engine = create_async_engine(DATABASE_URL)
    async with engine.connect() as conn:
        print(f"{'ID':<5} | {'Email':<30} | {'Owner':<6} | {'Admin':<6} | {'Google ID':<15} | {'Channels':<8}")
        print("-" * 90)
        
        users_res = await conn.execute(text("SELECT id, email, is_owner, is_admin, google_id FROM users;"))
        users = users_res.fetchall()
        
        for u in users:
            uid, email, owner, admin, gid = u
            channels_res = await conn.execute(text(f"SELECT COUNT(*) FROM channels WHERE owner_id = {uid}"))
            count = channels_res.scalar()
            
            print(f"{uid:<5} | {str(email):<30} | {str(owner):<6} | {str(admin):<6} | {str(gid):<15} | {count:<8}")
            
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(list_users_full())
