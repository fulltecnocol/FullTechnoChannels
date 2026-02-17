import asyncio
import os
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

# Using the DATABASE_URL from .env (the one I saw earlier)
# Hardcoding it here for the script execution since I'm running locally 
# but targeting the Supabase DB mentioned in the .env file.
DATABASE_URL = "postgresql+asyncpg://postgres:KJvNk1AF1LmxHhtK@db.oavgufpxufhwcznucbaf.supabase.co:5432/postgres"

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
