import asyncio
from infrastructure.database.connection import AsyncSessionLocal, init_db
from core.entities import Plan
from sqlalchemy.future import select


async def seed_plans():
    await init_db()
    async with AsyncSessionLocal() as session:
        # Check if plans exist
        result = await session.execute(select(Plan))
        if result.scalars().first():
            print("Plans already seeded.")
            return

        plans = [
            Plan(
                name="Plan Mensual",
                description="Acceso por 30 días",
                price=9.99,
                duration_days=30,
                stripe_price_id="price_monthly_id",
            ),
            Plan(
                name="Plan Trimestral",
                description="Acceso por 90 días",
                price=24.99,
                duration_days=90,
                stripe_price_id="price_quarterly_id",
            ),
            Plan(
                name="Plan Vitalicio",
                description="Acceso para siempre",
                price=99.99,
                duration_days=36500,
                stripe_price_id="price_lifetime_id",
            ),
        ]
        session.add_all(plans)
        await session.commit()
        print("Plans seeded successfully.")


if __name__ == "__main__":
    asyncio.run(seed_plans())
