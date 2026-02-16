import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import logging

logging.basicConfig(level=logging.INFO)


@pytest.mark.asyncio
async def test_connection_methods():
    """Test different Supabase connection methods"""

    password = "NNjrJRDdbcoQNDoI"
    project_ref = "oavgufpxufhwcznucbaf"

    # Different connection methods to test
    methods = {
        "Direct (5432)": f"postgresql+asyncpg://postgres:{password}@db.{project_ref}.supabase.co:5432/postgres",
        "Session Pooler (5432 via pooler)": f"postgresql+asyncpg://postgres.{project_ref}:{password}@aws-0-us-east-2.pooler.supabase.com:5432/postgres",
        "Transaction Pooler (6543)": f"postgresql+asyncpg://postgres.{project_ref}:{password}@aws-0-us-east-2.pooler.supabase.com:6543/postgres",
    }

    for name, url in methods.items():
        print(f"\n🔍 Testing: {name}")
        print(f"   URL: {url[:50]}...")

        try:
            # Try without SSL first
            engine = create_async_engine(url, echo=False)
            async with engine.begin() as conn:
                result = await conn.execute(text("SELECT version()"))
                version = result.scalar()
                print(f"   ✅ SUCCESS! PostgreSQL version: {version[:50]}...")
                await engine.dispose()
                return name, url
        except Exception as e:
            print(f"   ❌ Failed: {str(e)[:100]}")

        try:
            # Try with SSL
            engine_ssl = create_async_engine(
                url, echo=False, connect_args={"ssl": "require"}
            )
            async with engine_ssl.begin() as conn:
                result = await conn.execute(text("SELECT version()"))
                version = result.scalar()
                print(f"   ✅ SUCCESS WITH SSL! PostgreSQL version: {version[:50]}...")
                await engine_ssl.dispose()
                return name, url
        except Exception as e:
            print(f"   ❌ Also failed with SSL: {str(e)[:100]}")

    print("\n⚠️  All connection methods failed!")
    return None, None


if __name__ == "__main__":
    print("=" * 60)
    print("Supabase Connection Method Tester")
    print("=" * 60)
    name, url = asyncio.run(test_connection_methods())

    if url:
        print(f"\n{'=' * 60}")
        print(f"✅ WORKING METHOD: {name}")
        print("Use this connection string:")
        print(f"{url}")
        print(f"{'=' * 60}")
