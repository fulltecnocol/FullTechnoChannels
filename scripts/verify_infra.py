import asyncio
import os
import sys
from sqlalchemy import text
from dotenv import load_dotenv

# Ensure we can import shared modules
sys.path.append(os.getcwd())

load_dotenv()

from shared.database import get_redis, get_db

async def verify_infra():
    print("🔍 Verifying Infrastructure...")
    
    # 1. Check Redis
    try:
        redis_client = await get_redis()
        # Ping
        await redis_client.ping()
        print("✅ Redis: Connected successfully")
        
        # Write/Read test
        await redis_client.set("infra_test", "ok", ex=10)
        val = await redis_client.get("infra_test")
        if val == "ok":
            print("✅ Redis: Read/Write working")
        else:
            print("❌ Redis: Read/Write failed")
            
    except Exception as e:
        print(f"❌ Redis: Connection failed - {e}")

    # 2. Check Database
    try:
        async for session in get_db():
            # Simple query
            await session.execute(text("SELECT 1"))
            print("✅ Database: Connected successfully")
            break
    except Exception as e:
        print(f"❌ Database: Connection failed - {e}")

if __name__ == "__main__":
    asyncio.run(verify_infra())
