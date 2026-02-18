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

async def run_integrity_checks():
    engine = create_async_engine(DATABASE_URL)
    
    queries = {
        "Duplicate Emails": "SELECT email, COUNT(*) as cnt FROM users WHERE email IS NOT NULL GROUP BY email HAVING COUNT(*) > 1;",
        "Duplicate Telegram IDs": "SELECT telegram_id, COUNT(*) as cnt FROM users WHERE telegram_id IS NOT NULL GROUP BY telegram_id HAVING COUNT(*) > 1;",
        "Orphan Subscriptions": "SELECT s.id, s.user_id, s.plan_id FROM subscriptions s LEFT JOIN users u ON s.user_id = u.id LEFT JOIN plans p ON s.plan_id = p.id WHERE u.id IS NULL OR p.id IS NULL;",
        "Orphan Channels": "SELECT c.id, c.title, c.owner_id FROM channels c LEFT JOIN users u ON c.owner_id = u.id WHERE u.id IS NULL;"
    }
    
    async with engine.connect() as conn:
        for name, query in queries.items():
            print(f"\n--- {name} ---")
            result = await conn.execute(text(query))
            rows = result.fetchall()
            if not rows:
                print("✅ No issues found.")
            for row in rows:
                print(f"⚠️ {row}")
                
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run_integrity_checks())
