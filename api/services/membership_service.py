from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from shared.models import User, Plan, Subscription, Payment, Channel, Promotion
from shared.accounting import distribute_payment_funds
from shared.database import redis_client

async def activate_membership(
    user_id: int,
    plan_id: int,
    db: AsyncSession,
    promo_id: Optional[int] = None,
    provider_tx_id: Optional[str] = None,
    method: str = "stripe",
):
    plan_result = await db.execute(select(Plan).where(Plan.id == plan_id))
    plan = plan_result.scalar_one_or_none()
    if not plan:
        return None

    # Idempotency check with Redis + DB backup
    if provider_tx_id:
        # Check Redis first for speed
        cache_key = f"processed_tx:{provider_tx_id}"
        if await redis_client.get(cache_key):
             # Already processed
             # We can return the existing subscription if we want, or just None/True
             # For now, let's query the sub to return it as expected
             pass
        
        pay_check = await db.execute(
            select(Payment).where(Payment.provider_tx_id == provider_tx_id)
        )
        if pay_check.scalar_one_or_none():
            # Set cache for future
            await redis_client.setex(cache_key, 86400 * 7, "1") # 7 days cache
            
            sub_check = await db.execute(
                select(Subscription).where(
                    and_(
                        Subscription.user_id == user_id, Subscription.plan_id == plan_id
                    )
                )
            )
            return sub_check.scalars().first()

    # Calculate final price
    final_price = plan.price
    if promo_id:
        promo_res = await db.execute(select(Promotion).where(Promotion.id == promo_id))
        promo = promo_res.scalar_one_or_none()
        if promo and promo.promo_type == "discount":
            final_price = round(plan.price * (1 - promo.value), 2)
            promo.current_uses += 1

    # Distribute funds
    await distribute_payment_funds(
        db, user_id, plan_id, final_price, method, provider_tx_id
    )

    # Activate/Extend Subscription
    existing_sub = await db.execute(
        select(Subscription).where(
            and_(
                Subscription.user_id == user_id,
                Subscription.plan_id == plan_id,
                Subscription.is_active,
            )
        )
    )
    sub = existing_sub.scalar_one_or_none()

    now = datetime.utcnow()
    if sub and sub.end_date > now:
        sub.end_date += timedelta(days=plan.duration_days)
    else:
        sub = Subscription(
            user_id=user_id,
            plan_id=plan_id,
            start_date=now,
            end_date=now + timedelta(days=plan.duration_days),
            is_active=True,
        )
        db.add(sub)

    if provider_tx_id:
        await redis_client.setex(f"processed_tx:{provider_tx_id}", 86400 * 7, "1")

    await db.commit()

    # Notify (Avoid circular imports by using a local functional approach if needed, or shared service)
    # TODO: Refactor notification to a proper event bus or queue
    try:
        from shared.notifications import send_telegram_notification

        chan_res = await db.execute(
            select(Channel).where(Channel.id == plan.channel_id)
        )
        channel = chan_res.scalar_one_or_none()
        usr_res = await db.execute(select(User).where(User.id == user_id))
        user = usr_res.scalar_one_or_none()
        if user and user.telegram_id and channel:
            msg = (
                channel.welcome_message
                or f"✅ **¡Acceso Activado!**\n\nYa puedes disfrutar de: *{channel.title}*."
            )
            await send_telegram_notification(user.telegram_id, msg)
    except Exception as e:
        # Log error instead of silent pass
        print(f"Notification error: {e}")
        pass

    return sub
