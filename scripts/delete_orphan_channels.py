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

async def delete_orphan_channels():
    engine = create_async_engine(DATABASE_URL)
    
    # Cascade delete plans first then channels
    delete_plans = "DELETE FROM plans WHERE channel_id IN (SELECT id FROM channels WHERE owner_id IS NULL);"
    delete_channels = "DELETE FROM channels WHERE owner_id IS NULL;"
    
    async with engine.begin() as conn:
        print("\n--- Deleting Plans of Orphan Channels ---")
        result_plans = await conn.execute(text(delete_plans))
        print(f"✅ Deleted {result_plans.rowcount} orphan plans.")
        
        print("\n--- Deleting Orphan Channels ---")
        result_channels = await conn.execute(text(delete_channels))
        print(f"✅ Deleted {result_channels.rowcount} orphan channels.")
                
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(delete_orphan_channels())
