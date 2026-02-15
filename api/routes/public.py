from fastapi import APIRouter, Depends
from sqlalchemy.future import select
from shared.database import get_db, AsyncSessionLocal
from shared.models import SystemConfig as ConfigItem

router = APIRouter(tags=["Public"])

@router.get("/public/config")
async def get_public_config(db: AsyncSessionLocal = Depends(get_db)):
    """Fetch system configurations publicly (fees, commissions, etc.)"""
    result = await db.execute(select(ConfigItem))
    configs = result.scalars().all()
    # Return as a simple dictionary {key: value}
    return {c.key: c.value for c in configs}
