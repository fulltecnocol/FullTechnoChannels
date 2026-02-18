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

async def list_users():
    engine = create_async_engine(DATABASE_URL)
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT id, email, full_name, is_owner FROM users LIMIT 10;"))
        for row in result:
            print(row)
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(list_users())
