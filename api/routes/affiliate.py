import logging
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func, desc

from shared.database import get_db
from shared.models import User, Payment, AffiliateEarning, SystemConfig
from api.deps import get_current_user

router = APIRouter(prefix="/affiliate", tags=["Affiliate"])

logger = logging.getLogger(__name__)

# --- Helper Functions ---

async def get_recursive_downline(db: AsyncSession, user_id: int, current_level: int = 1, max_depth: int = 10) -> List[Dict[str, Any]]:
    """
    Fetches the downline tree recursively up to max_depth.
    Note: For very large networks, a CTE (Common Table Expression) would be more performant,
    but for this scale, a recursive python approach with eager loading is acceptable and easier to maintain.
    """
    if current_level > max_depth:
        return []

    # Fetch direct referrals
    result = await db.execute(
        select(User)
        .where(User.referred_by_id == user_id)
        .options(selectinload(User.subscriptions)) # Optional: load subs to check status
    )
    referrals = result.scalars().all()

    downline = []
    for referer in referrals:
        # Recursive call for children
        children = await get_recursive_downline(db, referer.id, current_level + 1, max_depth)
        
        # Calculate localized volume or validation status if needed
        # For visualization:
        node = {
            "id": referer.id,
            "name": referer.full_name or referer.username or "Usuario",
            "level": current_level,
            "avatar_url": referer.avatar_url,
            "total_referrals": len(children), # This is only visual depth, not total total
            "join_date": referer.created_at.isoformat() if referer.created_at else None,
            "children": children
        }
        downline.append(node)
    
    return downline

async def get_network_stats_raw(db: AsyncSession, user_id: int):
    # Get total earnings from AffiliateEarning table
    result = await db.execute(
        select(func.sum(AffiliateEarning.amount))
        .where(AffiliateEarning.affiliate_id == user_id)
    )
    total_earnings = result.scalar() or 0.0

    # Get earnings by level
    result = await db.execute(
        select(AffiliateEarning.level, func.sum(AffiliateEarning.amount))
        .where(AffiliateEarning.affiliate_id == user_id)
        .group_by(AffiliateEarning.level)
        .order_by(AffiliateEarning.level)
    )
    earnings_by_level = [{"level": row[0], "amount": row[1]} for row in result.all()]

    return total_earnings, earnings_by_level

# --- Endpoints ---

@router.get("/network")
async def get_affiliate_network(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """
    Returns the hierarchical structure of the user's referral network (up to 10 levels).
    """
    network_tree = await get_recursive_downline(db, current_user.id, max_depth=10)
    
    return {
        "user_id": current_user.id,
        "root_name": current_user.full_name,
        "children": network_tree
    }

@router.get("/stats")
async def get_affiliate_stats(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """
    Returns KPIs for the dashboard: Total Earnings, Level Distribution, Recent History.
    """
    total_earnings, earnings_by_level = await get_network_stats_raw(db, current_user.id)
    
    # Get recent commission history
    history_result = await db.execute(
        select(AffiliateEarning)
        .where(AffiliateEarning.affiliate_id == current_user.id)
        .order_by(desc(AffiliateEarning.created_at))
        .limit(20)
        .options(selectinload(AffiliateEarning.payment).selectinload(Payment.user)) # To show who generated it
    )
    history = history_result.scalars().all()
    
    history_data = []
    for earn in history:
        source_user = earn.payment.user if earn.payment else None
        history_data.append({
            "id": earn.id,
            "amount": earn.amount,
            "level": earn.level,
            "date": earn.created_at.isoformat(),
            "source_user": source_user.username if source_user else "Usuario Eliminado"
        })

    # Count total network size (simple count query is faster than tree traversal for just a number)
    # This is a bit complex in SQL for infinite depth without CTE, 
    # so we might just use the `referrals` count from User table if we only track direct, 
    # OR unimplemented for now if we want full network size. 
    # For now, let's return direct referrals count.
    direct_referrals = await db.execute(
        select(func.count(User.id)).where(User.referred_by_id == current_user.id)
    )
    promoters_count = direct_referrals.scalar() or 0

    return {
        "total_earnings": total_earnings,
        "earnings_by_level": earnings_by_level,
        "recent_history": history_data,
        "direct_referrals": promoters_count,
        "referral_code": current_user.referral_code
    }
