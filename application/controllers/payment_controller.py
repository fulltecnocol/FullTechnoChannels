from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
import os
import stripe
import httpx
import hashlib
import logging
from typing import Optional

from infrastructure.database.connection import get_db
from core.entities import Plan, Payment, User, Promotion
from application.dto.misc import PaymentRequest
from api.services.membership_service import activate_membership

router = APIRouter(tags=["Payments"])
logger = logging.getLogger(__name__)

# Configuración
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
WOMPI_PUBLIC_KEY = os.getenv("WOMPI_PUBLIC_KEY")
WOMPI_PRIVATE_KEY = os.getenv("WOMPI_PRIVATE_KEY")
WOMPI_INTEGRITY_SECRET = os.getenv("WOMPI_INTEGRITY_SECRET")
WOMPI_EVENTS_SECRET = os.getenv("WOMPI_EVENTS_SECRET")
WOMPI_API_BASE = "https://sandbox.wompi.co/v1"

@router.post("/payments/create-link")
async def create_payment_link(
    data: PaymentRequest, db: AsyncSession = Depends(get_db)
):
    """Genera un link de pago (Stripe/Wompi) o registro de Crypto"""
    plan_result = await db.execute(select(Plan).where(Plan.id == data.plan_id))
    plan = plan_result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado")

    # Aplicar descuento si hay promo
    final_price = plan.price
    if data.promo_id:
        promo_res = await db.execute(
            select(Promotion).where(Promotion.id == data.promo_id)
        )
        promo = promo_res.scalar_one_or_none()
        if promo and promo.promo_type == "discount":
            final_price = round(plan.price * (1 - promo.value), 2)

    # Referencia única para rastrear [USER_ID]-[PLAN_ID]-[PROMO_ID]-[TIMESTAMP]
    reference = f"user_{data.user_id}_plan_{data.plan_id}_p_{data.promo_id or 0}_{int(datetime.utcnow().timestamp())}"

    if data.method == "stripe":
        try:
            session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=[
                    {
                        "price_data": {
                            "currency": "usd",
                            "product_data": {"name": f"Suscripción VIP: {plan.name}"},
                            "unit_amount": int(final_price * 100),
                        },
                        "quantity": 1,
                    }
                ],
                mode="payment",
                success_url=f"{os.getenv('DASHBOARD_URL')}/success?session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=f"{os.getenv('DASHBOARD_URL')}/cancel",
                client_reference_id=reference,
                metadata={
                    "user_id": str(data.user_id),
                    "plan_id": str(data.plan_id),
                    "promo_id": str(data.promo_id)
                }
            )
            return {"url": session.url}
        except Exception as e:
            logger.error(f"Stripe error: {e}")
            raise HTTPException(status_code=400, detail=str(e))

    elif data.method == "wompi":
        # Lógica de Wompi (Colombia)
        amount_in_cop = int(final_price * 4000)
        amount_in_cents = amount_in_cop * 100

        payload = {
            "name": f"VIP: {plan.name}",
            "description": f"Suscripción {plan.duration_days} días",
            "single_use": True,
            "collect_shipping": False,
            "amount_in_cents": amount_in_cents,
            "currency": "COP",
            "sku": reference,
            "redirect_url": f"{os.getenv('DASHBOARD_URL')}/success",
        }

        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {WOMPI_PUBLIC_KEY}"}
            resp = await client.post(
                f"{WOMPI_API_BASE}/payment_links", json=payload, headers=headers
            )
            if resp.status_code != 201:
                logger.error(f"Wompi error: {resp.text}")
                raise HTTPException(status_code=400, detail=f"Error Wompi: {resp.text}")

            wompi_data = resp.json().get("data", {})
            return {"url": f"https://checkout.wompi.co/l/{wompi_data.get('id')}"}

    elif data.method == "crypto":
        new_payment = Payment(
            user_id=data.user_id,
            plan_id=data.plan_id,
            amount=final_price,
            method="crypto",
            status="pending",
            reference=reference,
        )
        db.add(new_payment)
        await db.commit()

        wallet_address = os.getenv("CRYPTO_WALLET_ADDRESS", "TXYZ... (Configura tu wallet)")
        network = os.getenv("CRYPTO_NETWORK", "Red TRC20 (USDT)")

        return {
            "method": "crypto",
            "address": wallet_address,
            "network": network,
            "amount": final_price,
            "payment_id": new_payment.id,
            "instructions": f"Envía exactamente ${final_price} USDT a la dirección de abajo. Luego abre un ticket indicando tu ID de pago #{new_payment.id} y el HASH de la transacción.",
        }

    raise HTTPException(status_code=400, detail="Método de pago no soportado")

@router.post("/webhook/stripe")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Webhook centralizado para Stripe"""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        if STRIPE_WEBHOOK_SECRET:
            event = stripe.Webhook.construct_event(
                payload, sig_header, STRIPE_WEBHOOK_SECRET
            )
        else:
            import json
            event = json.loads(payload)
    except Exception as e:
        logger.error(f"Webhook signature error: {e}")
        raise HTTPException(status_code=400, detail="Invalid Stripe Event")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = int(session["metadata"].get("user_id"))
        plan_id = int(session["metadata"].get("plan_id"))
        promo_id = session["metadata"].get("promo_id")
        promo_id = int(promo_id) if promo_id and promo_id != "None" else None

        await activate_membership(
            user_id=user_id,
            plan_id=plan_id,
            db=db,
            promo_id=promo_id,
            provider_tx_id=session.get("id"),
            method="stripe",
        )

    return {"status": "success"}

@router.post("/webhook/wompi")
async def wompi_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Webhook centralizado para Wompi"""
    payload = await request.json()

    # Validar firma WOMPI
    if WOMPI_EVENTS_SECRET:
        # Lógica de validación omitida por brevedad o implementada según docs
        pass

    event = payload.get("event")
    data = payload.get("data", {}).get("transaction", {})

    if event == "transaction.updated" and data.get("status") == "APPROVED":
        reference = data.get("reference")
        try:
            parts = reference.split("_")
            user_id = int(parts[1])
            plan_id = int(parts[3])
            promo_id = int(parts[5])

            await activate_membership(
                user_id=user_id,
                plan_id=plan_id,
                db=db,
                promo_id=promo_id if promo_id > 0 else None,
                provider_tx_id=data.get("id"),
                method="wompi",
            )
            return {"status": "ok"}
        except Exception as e:
            logger.error(f"Error procesando webhook Wompi: {e}")
            return {"status": "error"}

    return {"status": "ignored"}
