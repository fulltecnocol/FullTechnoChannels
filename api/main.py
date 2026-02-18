import os
from datetime import datetime

import stripe
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.future import select

# Import modular routers
from api.routes import (
    auth,
    owner,
    admin,
    legal,
    payments,
    calls,
    public,
    availability,
    affiliate,
    profiles,
)

# Import schemas and logic
from infrastructure.database.connection import get_db, AsyncSessionLocal
import logging
import sentry_sdk
import structlog

# Initialize Logging
logging.basicConfig(level=logging.INFO)
logger = structlog.get_logger(__name__)

# Initialize Sentry
SENTRY_DSN = os.getenv("SENTRY_DSN")
ENV = os.getenv("ENV", "development")

if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        environment=ENV,
        traces_sample_rate=0.1 if ENV == "production" else 1.0,
        profiles_sample_rate=0.1 if ENV == "production" else 1.0,
        send_default_pii=True,
    )

# Configuration
STRIPE_API_KEY = os.getenv("STRIPE_API_KEY")

if STRIPE_API_KEY:
    stripe.api_key = STRIPE_API_KEY

app = FastAPI(title="FGate API")

# Middlewares
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "https://app.fgate.co",
        "https://fgate-dashboard.web.app",
        "https://fgate.co",
        "https://full-techno-channels.web.app",
        "https://full-techno-channels--full-techno-channels.us-central1.hosted.app",
        "https://full-techno-channels.firebaseapp.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Modular Routers
# Include Modular Routers
app.include_router(auth.router)
app.include_router(owner.router)
app.include_router(admin.router)
app.include_router(legal.router)
app.include_router(payments.router)  # Routes for payments, webhooks, and links
app.include_router(calls.router)
app.include_router(public.router)
app.include_router(availability.router)
app.include_router(affiliate.router)
app.include_router(profiles.router)


# --- DEBUG ENDPOINTS (TEMPORARY) ---
@app.get("/debug/users")
async def debug_users(secret: str, db: AsyncSessionLocal = Depends(get_db)):
    if ENV == "production":
        raise HTTPException(status_code=404)
    if secret != "super_secret_debug_key_2026":
        raise HTTPException(status_code=403)

    from core.entities import User

    result = await db.execute(select(User))
    users = result.scalars().all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "is_owner": u.is_owner,
            "is_admin": u.is_admin,
        }
        for u in users
    ]


@app.post("/debug/promote")
async def debug_promote(
    secret: str, email: str, db: AsyncSessionLocal = Depends(get_db)
):
    if ENV == "production":
        raise HTTPException(status_code=404)
    if secret != "super_secret_debug_key_2026":
        raise HTTPException(status_code=403)

    from core.entities import User

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_owner = True
    user.is_admin = True
    await db.commit()
    return {"status": "promoted", "email": email}


@app.get("/debug/channels")
async def debug_channels(
    secret: str, owner_id: int, db: AsyncSessionLocal = Depends(get_db)
):
    if ENV == "production":
        raise HTTPException(status_code=404)
    if secret != "super_secret_debug_key_2026":
        raise HTTPException(status_code=403)

    from core.entities import Channel

    result = await db.execute(select(Channel).where(Channel.owner_id == owner_id))
    channels = result.scalars().all()
    return [
        {"id": c.id, "title": c.title, "is_verified": c.is_verified} for c in channels
    ]


# -----------------------------------


@app.get("/")
async def root():
    return {"name": "FGate API", "status": "online", "version": "2.0.0"}
