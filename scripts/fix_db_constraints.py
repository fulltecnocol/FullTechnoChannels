import os
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()

database_url = os.getenv("DATABASE_URL")
if database_url and database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+asyncpg://")

async def apply_constraints():
    print(f"🔌 Connecting to DB to apply constraints...")
    engine = create_async_engine(database_url)
    async_session = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

    async with async_session() as session:
        # 1. Users Email Constraint
        print("🛠️ Applying UNIQUE constraint on 'users.email'...")
        try:
            # We use a unique index which acts as a constraint
            # Using 'IF NOT EXISTS' to be safe, but Postgres syntax for indexes handles this slightly differently than constraints
            # We'll use the standard idiom.
            await session.execute(text("""
                CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx ON users (email) WHERE email IS NOT NULL;
            """))
            await session.commit()
            print("✅ Successfully created/verified 'users_email_unique_idx'.")
        except Exception as e:
            await session.rollback()
            print(f"❌ Error applying users constraint: {e}")

        # 2. Payments Provider TX ID Constraint
        print("🛠️ Applying UNIQUE constraint on 'payments.provider_tx_id'...")
        try:
            await session.execute(text("""
                CREATE UNIQUE INDEX IF NOT EXISTS payments_provider_tx_id_unique_idx ON payments (provider_tx_id) WHERE provider_tx_id IS NOT NULL;
            """))
            await session.commit()
            print("✅ Successfully created/verified 'payments_provider_tx_id_unique_idx'.")
        except Exception as e:
            await session.rollback()
            print(f"❌ Error applying payments constraint: {e}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(apply_constraints())
