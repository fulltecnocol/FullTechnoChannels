import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def quick_test():
    # Test with CORRECT password
    url = "postgresql+asyncpg://postgres:DiUtFs5IRxls7G0F@db.oavgufpxufhwcznucbaf.supabase.co:5432/postgres"
    
    print("🔍 Testing connection with CORRECT password...")
    print(f"URL: {url[:60]}...")
    
    try:
        engine = create_async_engine(url, echo=False, connect_args={"ssl": "require"})
        async with engine.begin() as conn:
            result = await conn.execute(text("SELECT version()"))
            version = result.scalar()
            print(f"\n✅ SUCCESS! Connected to PostgreSQL")
            print(f"Version: {version[:80]}...")
            
            # List tables
            tables = await conn.execute(text("SELECT tablename FROM pg_tables WHERE schemaname = 'public'"))
            table_list = [row[0] for row in tables]
            print(f"\n📋 Tables in database: {table_list}")
            
        await engine.dispose()
        return True
    except Exception as e:
        print(f"\n❌ Failed: {str(e)}")
        return False

if __name__ == "__main__":
    success = asyncio.run(quick_test())
    if success:
        print("\n" + "="*60)
        print("✅ CONNECTION SUCCESSFUL!")
        print("="*60)
    else:
        print("\n" + "="*60)
        print("❌ CONNECTION FAILED - Check password")
        print("="*60)
