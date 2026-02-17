import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

DATABASE_URL = "postgresql+asyncpg://postgres:KJvNk1AF1LmxHhtK@db.oavgufpxufhwcznucbaf.supabase.co:5432/postgres"

async def list_users():
    engine = create_async_engine(DATABASE_URL)
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT email, is_owner, hashed_password IS NOT NULL as has_pass FROM users WHERE email NOT LIKE '%@test.com' AND email IS NOT NULL;"))
        for row in result:
            print(row)
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(list_users())
