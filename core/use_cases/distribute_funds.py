from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from core.entities import User, Payment, Channel, Plan, SystemConfig, AffiliateEarning, AffiliateRank
from infrastructure.external_apis.telegram import send_telegram_notification
from datetime import datetime


async def get_config_value(db: AsyncSession, key: str, default: float) -> float:
    result = await db.execute(select(SystemConfig).where(SystemConfig.key == key))
    config = result.scalar_one_or_none()
    return config.value if config else default


async def convert_to_usd(db: AsyncSession, amount: float, from_currency: str) -> float:
    """
    Convierte un monto a USD usando la tasa configurada.
    """
    if from_currency.lower() == "usd":
        return amount
    
    if from_currency.lower() == "cop":
        # Tasa por defecto 4000 si no existe en config
        usd_cop_rate = await get_config_value(db, "usd_cop_rate", 4000.0)
        return amount / usd_cop_rate
    
    # Agregar más monedas aquí si es necesario
    return amount


async def distribute_payment_funds(
    db: AsyncSession,
    user_id: int,
    plan_id: int,
    total_amount: float,
    payment_method: str,
    provider_tx_id: str,
):
    """
    Lógica MULTINIVEL (10 niveles) para repartir fondos.
    Las comisiones salen de la plataforma.
    """
    # 1. Obtener Info del Plan y Canal
    plan_result = await db.execute(select(Plan).where(Plan.id == plan_id))
    plan = plan_result.scalar_one_or_none()
    if not plan:
        return None

    # Normalizar monto a USD para consistencia en balances internos
    # Si el pago viene en otra moneda (ej: COP de Wompi), lo convertimos.
    # Nota: total_amount es lo que reporta la pasarela en su moneda original.
    amount_usd = await convert_to_usd(db, total_amount, "usd" if payment_method == "stripe" else "cop")

    channel_result = await db.execute(
        select(Channel).where(Channel.id == plan.channel_id)
    )
    channel = channel_result.scalar_one_or_none()
    if not channel:
        return None

    owner_id = channel.owner_id
    owner_result = await db.execute(select(User).where(User.id == owner_id))
    owner = owner_result.scalar_one_or_none()

    # 2. Obtener Comisión del Sitio (Total Pool)
    platform_fee_percent = await get_config_value(db, "platform_fee", 0.10)
    total_commission_pool = amount_usd * platform_fee_percent

    # El dueño del canal siempre recibe el resto (Total - Comisión Total del Sitio)
    owner_amount = amount_usd - total_commission_pool

    # Nombres de los niveles para branding
    LEVEL_NAMES = {
        1: "Directo",
        2: "Generación II",
        3: "Generación III",
        4: "Círculo Interno",
        5: "Liderazgo",
        6: "Elite",
        7: "Embajador",
        8: "Maestro",
        9: "Leyenda",
        10: "Infinitum",
    }

    # 3. Calcular Reparto Multinivel (hasta 10 niveles)
    affiliate_earnings_list = []
    total_affiliate_distributed = 0.0

    current_referrer_id = owner.referred_by_id if owner else None

    for level in range(1, 11):
        if not current_referrer_id:
            break

        # Obtener porcentaje para este nivel
        default_fees = {
            1: 0.03,
            2: 0.01,
            3: 0.005,
            4: 0.003,
            5: 0.002,
            6: 0.001,
            7: 0.001,
            8: 0.001,
            9: 0.001,
            10: 0.001,
        }
        fee_key = f"affiliate_level_{level}_fee"
        level_fee_percent = await get_config_value(
            db, fee_key, default_fees.get(level, 0.0)
        )

        level_amount = amount_usd * level_fee_percent
        total_affiliate_distributed += level_amount

        # Guardar ganancia del nivel
        affiliate_earnings_list.append(
            {
                "affiliate_id": current_referrer_id,
                "level": level,
                "level_name": LEVEL_NAMES.get(level, f"Nivel {level}"),
                "amount": level_amount,
            }
        )

        # Subir un nivel en la cadena
        ref_result = await db.execute(
            select(User).where(User.id == current_referrer_id)
        )
        referrer_user = ref_result.scalar_one_or_none()

        if referrer_user:
            # Sumar al balance del afiliado inmediatamente (siempre en USD)
            referrer_user.affiliate_balance += level_amount

            # Notificar vía Telegram si tiene telegram_id vinculado
            if referrer_user.telegram_id:
                level_name = LEVEL_NAMES.get(level, f"Nivel {level}")
                notif_msg = (
                    f"💰 *¡Comisión de Red Recibida!*\n\n"
                    f"Has ganado **${level_amount:.2f} USD** por una compra en tu **{level_name}**.\n"
                    f"Tu balance de afiliado ha sido actualizado."
                )
                await send_telegram_notification(referrer_user.telegram_id, notif_msg)

            current_referrer_id = referrer_user.referred_by_id
        else:
            current_referrer_id = None

    # Lo que le queda neto a la plataforma (Plataforma - Total Afiliados)
    platform_net_amount = total_commission_pool - total_affiliate_distributed
    if platform_net_amount < 0:
        platform_net_amount = 0  # Seguridad anti-quiebra

    # 4. Registrar el Pago Principal (Normalizado a USD)
    payment = Payment(
        user_id=user_id,
        plan_id=plan_id,
        amount=amount_usd,
        currency="usd",
        payment_method=payment_method,
        provider_tx_id=provider_tx_id,
        status="completed",
        platform_amount=platform_net_amount,
        owner_amount=owner_amount,
        affiliate_amount=total_affiliate_distributed,
        created_at=datetime.utcnow(),
    )
    db.add(payment)
    await db.flush()  # Para obtener el payment.id

    # 5. Registrar cada ganancia individual de los niveles
    for earn_data in affiliate_earnings_list:
        db.add(
            AffiliateEarning(
                payment_id=payment.id,
                affiliate_id=earn_data["affiliate_id"],
                level=earn_data["level"],
                amount=earn_data["amount"],
            )
        )

    # 6. Actualizar Balance del Dueño
    if owner:
        owner.balance += owner_amount

    await db.commit()
    return payment


async def get_affiliate_tier_info(db: AsyncSession, user_id: int):
    # Nota: Esta función podría quedarse para el "Rango Visual" del usuario,
    # aunque ahora la lógica sea multinivel de profundidad.
    result = await db.execute(
        select(func.count(User.id)).where(User.referred_by_id == user_id)
    )
    referral_count = result.scalar() or 0

    # Dynamic Rank Logic
    # from .models import AffiliateRank -> core imports
    
    # Get all ranks sorted by difficulty (descending)
    ranks_res = await db.execute(select(AffiliateRank).order_by(AffiliateRank.min_referrals.desc()))
    ranks = ranks_res.scalars().all()
    
    current_tier = "Bronce" # Default fallback
    next_goal = None
    
    # Find current rank
    for rank in ranks:
        if referral_count >= rank.min_referrals:
            current_tier = rank.name
            break
            
    # Find next goal (first rank required > current count)
    # We iterate reversed (Ascending) to find the next immediate step
    for rank in reversed(ranks):
        if rank.min_referrals > referral_count:
            next_goal = rank.min_referrals
            break
            
    return {"tier": current_tier, "count": referral_count, "next_min": next_goal}
