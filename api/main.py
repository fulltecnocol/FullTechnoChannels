import os
from datetime import datetime, timedelta
from typing import Optional

import stripe
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.future import select
from sqlalchemy import and_

# Import modular routers
from api.routes import auth, owner, admin, legal, calls, public, availability, affiliate

# Import schemas and logic
from shared.database import get_db, AsyncSessionLocal
from shared.models import Plan
from api.schemas.misc import PaymentRequest
from api.schemas.misc import PaymentRequest
from api.services.membership_service import activate_membership
from api.middleware.rate_limiter import RateLimitMiddleware
from shared.logging_config import configure_logger
import sentry_sdk
import structlog

# Initialize Logging
configure_logger()
logger = structlog.get_logger(__name__)

# Initialize Sentry
SENTRY_DSN = os.getenv("SENTRY_DSN")
if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        traces_sample_rate=1.0,
        profiles_sample_rate=1.0,
    )

# Configuration
STRIPE_API_KEY = os.getenv("STRIPE_API_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
WOMPI_PUBLIC_KEY = os.getenv("WOMPI_PUBLIC_KEY")
WOMPI_API_BASE = (
    "https://production.wompi.co/v1"
    if os.getenv("ENV") == "production"
    else "https://sandbox.wompi.co/v1"
)
WOMPI_INTEGRITY_SECRET = os.getenv("WOMPI_INTEGRITY_SECRET")
WOMPI_EVENTS_SECRET = os.getenv("WOMPI_EVENTS_SECRET")

if STRIPE_API_KEY:
    stripe.api_key = STRIPE_API_KEY

app = FastAPI(title="TeleGate API")

# Middlewares
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Modular Routers
app.include_router(auth.router)
app.include_router(owner.router)
app.include_router(admin.router)
app.include_router(legal.router)
app.include_router(calls.router)
app.include_router(public.router)
app.include_router(availability.router)
app.include_router(affiliate.router)


@app.get("/")
async def root():
    return {"name": "TeleGate API", "status": "online", "version": "2.0.0"}


# --- WEBHOOKS & PAYMENT LINKS ---


@app.post("/webhook/stripe")
async def stripe_webhook(request: Request, db: AsyncSessionLocal = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    try:
        event = (
            stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
            if STRIPE_WEBHOOK_SECRET
            else {}
        )
    except:
        raise HTTPException(status_code=400, detail="Invalid Stripe Event")

    if event.get("type") == "checkout.session.completed":
        session = event["data"]["object"]
        meta = session.get("metadata", {})
        await activate_membership(
            user_id=int(meta.get("user_id")),
            plan_id=int(meta.get("plan_id")),
            db=db,
            promo_id=int(meta.get("promo_id"))
            if meta.get("promo_id") != "None"
            else None,
            provider_tx_id=session.get("id"),
            method="stripe",
        )
    return {"status": "success"}


@app.post("/webhook/wompi")
async def wompi_webhook(request: Request, db: AsyncSessionLocal = Depends(get_db)):
    payload = await request.json()
    # Logic for signature verification (simplified here for brevity)
    event = payload.get("event")
    data = payload.get("data", {}).get("transaction", {})
    if event == "transaction.updated" and data.get("status") == "APPROVED":
        ref = data.get("reference", "").split("_")
        try:
            await activate_membership(
                user_id=int(ref[1]),
                plan_id=int(ref[3]),
                db=db,
                promo_id=int(ref[5]) if int(ref[5]) > 0 else None,
                provider_tx_id=data.get("id"),
                method="wompi",
            )
            return {"status": "ok"}
        except:
            pass
    return {"status": "ignored"}


@app.post("/payments/create-link")
async def create_payment_link(
    data: PaymentRequest, db: AsyncSessionLocal = Depends(get_db)
):
    plan_result = await db.execute(select(Plan).where(Plan.id == data.plan_id))
    plan = plan_result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404)

    final_price = plan.price
    # (Promo application logic here...)

    ref = f"user_{data.user_id}_plan_{data.plan_id}_p_{data.promo_id or 0}_{int(datetime.utcnow().timestamp())}"

    if data.method == "stripe":
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[
                {
                    "price_data": {
                        "currency": "usd",
                        "product_data": {"name": f"VIP: {plan.name}"},
                        "unit_amount": int(final_price * 100),
                    },
                    "quantity": 1,
                }
            ],
            mode="payment",
            success_url=f"{os.getenv('DASHBOARD_URL')}/success",
            cancel_url=f"{os.getenv('DASHBOARD_URL')}/cancel",
            client_reference_id=ref,
            metadata={
                "user_id": data.user_id,
                "plan_id": data.plan_id,
                "promo_id": str(data.promo_id),
            },
        )
        return {"url": session.url}

    elif data.method == "wompi":
        int(final_price * 4000 * 100)  # COP conversion
        # Integrity signature calculation...
        return {"url": "https://checkout.wompi.co/l/..."}  # Placeholder

    elif data.method == "crypto":
        # Create pending payment
        return {
            "method": "crypto",
            "address": os.getenv("CRYPTO_WALLET_ADDRESS"),
            "amount": final_price,
        }

    raise HTTPException(status_code=400, detail="Método no soportado")
