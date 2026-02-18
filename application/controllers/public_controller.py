from datetime import datetime
from fastapi import APIRouter, Depends, Response
from sqlalchemy.future import select
from sqlalchemy import and_
from infrastructure.database.connection import get_db, AsyncSessionLocal
from core.entities import (
    SystemConfig as ConfigItem,
    Promotion,
    Subscription,
    Plan,
)

router = APIRouter(tags=["Public"])


@router.get("/public/config")
async def get_public_config(response: Response, db: AsyncSessionLocal = Depends(get_db)):
    """Fetch system configurations publicly (fees, commissions, etc.)"""
    # Performance: Edge Caching for 1 minute to reduce DB load
    response.headers["Cache-Control"] = "public, max-age=60, s-maxage=60"

    result = await db.execute(select(ConfigItem))
    configs = result.scalars().all()
    # Return as a simple dictionary {key: value}
    return {c.key: c.value for c in configs}


@router.get("/bot/check-promo/{code}", tags=["Bot"])
async def bot_check_promo(code: str, user_id: int, db: AsyncSessionLocal = Depends(get_db)):
    """
    Validación para el Bot: Verifica si un código es válido y si el usuario califica.
    """
    result = await db.execute(
        select(Promotion).where(and_(Promotion.code == code, Promotion.is_active))
    )
    promo = result.scalar_one_or_none()
    if not promo:
        return {"valid": False, "reason": "invalid"}

    if promo.max_uses and promo.current_uses >= promo.max_uses:
        return {"valid": False, "reason": "limit_reached"}

    # Si es trial, verificar que el usuario no haya tenido uno en este canal
    if promo.promo_type == "trial":
        trial_check = await db.execute(
            select(Subscription)
            .join(Plan)
            .where(
                and_(
                    Subscription.user_id == user_id,
                    Plan.channel_id == promo.channel_id,
                    Subscription.is_trial,
                )
            )
        )
        if trial_check.scalar_one_or_none():
            return {"valid": False, "reason": "trial_already_used"}

    return {
        "valid": True,
        "type": promo.promo_type,
        "value": promo.value,
        "channel_id": promo.channel_id,
    }
