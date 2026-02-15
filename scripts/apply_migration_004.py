import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL:
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
    elif DATABASE_URL.startswith("postgresql://"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

async def apply_migration():
    print(f"Connecting to {DATABASE_URL}")
    engine = create_async_engine(DATABASE_URL, echo=True)
    
    with open("migrations/004_add_channel_to_call_service.sql", "r") as f:
        sql = f.read()

    async with engine.begin() as conn:
        print("Applying migration 004...")
        await conn.execute(text(sql))
        print("Migration applied successfully!")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(apply_migration())
