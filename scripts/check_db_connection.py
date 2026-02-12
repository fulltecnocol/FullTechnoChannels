import sys
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def check_connection(url):
    print(f"🔍 Testing connection to: {url.split('@')[-1]}") # Hide password in logs
    
    # Correct format for asyncpg if needed
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        
    try:
        engine = create_async_engine(url, connect_args={"ssl": "require"})
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            print("✅ CONNECTION SUCCESSFUL! Your database password is correct.")
            return True
    except Exception as e:
        print(f"❌ CONNECTION FAILED!")
        print(f"Error detail: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python check_db.py 'YOUR_DATABASE_URL'")
        sys.exit(1)
    
    url = sys.argv[1]
    asyncio.run(check_connection(url))
