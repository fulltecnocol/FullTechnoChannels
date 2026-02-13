import os
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()

database_url = os.getenv("DATABASE_URL")
# Ensure async driver
if database_url and database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+asyncpg://")

async def check_duplicates():
    print(f"🔌 Connecting to DB...")
    engine = create_async_engine(database_url)
    async_session = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

    async with async_session() as session:
        # --- USERS CHECK ---
        print("\n🔍 Checking for duplicate USERS (email)...")
        result = await session.execute(text("""
            SELECT email, COUNT(*) as count 
            FROM users 
            GROUP BY email 
            HAVING COUNT(*) > 1
        """))
        duplicates = result.fetchall()
        
        if duplicates:
            print(f"⚠️ FOUND {len(duplicates)} DUPLICATE EMAILS:")
            for email, count in duplicates:
                print(f"   - {email}: {count} records")
        else:
            print("✅ No duplicate emails found.")

        print("🔍 Checking for UNIQUE constraint on 'users.email'...")
        try:
            constraint_query = text("""
                SELECT conname 
                FROM pg_constraint 
                WHERE conrelid = 'users'::regclass 
                AND contype = 'u'
            """)
            constraints = await session.execute(constraint_query)
            found = False
            for row in constraints:
                print(f"   - Constraint found: {row.conname}")
                if 'email' in row.conname or 'users_email_key' in row.conname:
                    found = True
            
            if found:
                print("✅ Unique constraint on 'users.email' appears to exist.")
            else:
                print("❌ WARNING: No obvious unique constraint found for users table!")
        except Exception as e:
            print(f"   Could not query constraints: {e}")

        # --- PAYMENTS CHECK ---
        print("\n🔍 Checking for duplicate PAYMENTS (provider_tx_id)...")
        result = await session.execute(text("""
            SELECT provider_tx_id, COUNT(*) as count 
            FROM payments 
            WHERE provider_tx_id IS NOT NULL
            GROUP BY provider_tx_id 
            HAVING COUNT(*) > 1
        """))
        dupes = result.fetchall()
        if dupes:
            print(f"⚠️ FOUND {len(dupes)} DUPLICATE PAYMENTS:")
            for tx_id, count in dupes:
                print(f"   - {tx_id}: {count} records")
        else:
            print("✅ No duplicate payments found.")

        print("🔍 Checking for UNIQUE constraint on 'payments.provider_tx_id'...")
        try:
            constraint_query = text("""
                SELECT conname 
                FROM pg_constraint 
                WHERE conrelid = 'payments'::regclass 
                AND contype = 'u'
            """)
            constraints = await session.execute(constraint_query)
            found = False
            for row in constraints:
                print(f"   - Constraint found: {row.conname}")
                if 'provider_tx_id' in row.conname:
                    found = True
            
            if found:
                print("✅ Unique constraint on 'payments.provider_tx_id' appears to exist.")
            else:
                print("❌ WARNING: No obvious unique constraint found for payments table!")
        except Exception as e:
            print(f"   Could not query constraints: {e}")

if __name__ == "__main__":
    asyncio.run(check_duplicates())
