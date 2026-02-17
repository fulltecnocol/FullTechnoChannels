import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

DATABASE_URL = "postgresql+asyncpg://postgres:KJvNk1AF1LmxHhtK@db.oavgufpxufhwcznucbaf.supabase.co:5432/postgres"

async def list_users():
    engine = create_async_engine(DATABASE_URL)
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT id, email, is_owner, is_admin, hashed_password IS NOT NULL as has_pass FROM users;"))
        print(f"{'ID':<5} | {'Email':<30} | {'Owner':<6} | {'Admin':<6} | {'Pass':<5}")
        print("-" * 65)
        for row in result:
            print(f"{row[0]:<5} | {str(row[1]):<30} | {row[2]:<6} | {row[3]:<6} | {row[4]:<5}")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(list_users())
