"""
Unified application entry point that serves both API and Bot
"""

import os
from dotenv import load_dotenv

load_dotenv(override=True)

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from api.main import app as api_app
from bot.main import app as bot_app, on_bot_startup

# Selective service mounting based on SERVICE_TYPE env var
# Options: unified (default), api, bot
SERVICE_TYPE = os.getenv("SERVICE_TYPE", "unified").lower()

# Create main application
app = FastAPI(title=f"TeleGate {SERVICE_TYPE.upper()} Service")

# 1. Trusted Host Middleware (Security Hardening)
# Broadened for Cloud Run internal health checks and domains
# 1. Trusted Host Middleware (Security Hardening)
# Broadened for Cloud Run internal health checks and domains
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])

# 2. CORS Middleware (Required for Dashboard)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, replace with specific Firebase domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 2. Custom Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Strict-Transport-Security"] = (
        "max-age=31536000; includeSubDomains"
    )
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    # Allow Google Auth frames, scripts and API connections
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; connect-src 'self' https://membership-backend-dhtw77aq7a-uc.a.run.app; script-src 'self' 'unsafe-inline' https://accounts.google.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-src https://accounts.google.com"
    )
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


# 3. Global Routes (Defined BEFORE mounts)
@app.get("/health")
async def health_check():
    """
    Comprehensive health check for Cloud Monitoring uptime checks
    Returns 200 if healthy, 503 if unhealthy
    """
    from shared.database import AsyncSessionLocal
    from sqlalchemy import text
    from shared.logger import get_logger

    logger = get_logger("health_check")
    health_status = {
        "service": "TeleGate",
        "status": "healthy",
        "timestamp": os.popen("date -u +%Y-%m-%dT%H:%M:%SZ").read().strip(),
        "components": {},
    }

    # Check database connectivity
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
            health_status["components"]["database"] = {"status": "healthy"}
            logger.info("Health check: database healthy")
    except Exception as e:
        health_status["status"] = "unhealthy"
        health_status["components"]["database"] = {
            "status": "unhealthy",
            "error": str(e),
        }
        logger.error("Health check: database unhealthy", error=str(e))
        return Response(
            content=str(health_status), status_code=503, media_type="application/json"
        )

    # All checks passed
    return health_status


@app.get("/")
async def root_path():
    return {
        "service": "TeleGate",
        "status": "running",
        "endpoints": {"api": "/api/docs", "bot_webhook": "/bot/webhook/..."},
    }


# 4. Bot Mount (Must be BEFORE the root fallback)
if SERVICE_TYPE in ["unified", "bot"]:
    app.mount("/bot", bot_app)

# 5. API Mounts
if SERVICE_TYPE in ["unified", "api"]:
    app.mount("/api", api_app)
    # Root fallback last
    app.mount("/", api_app)

    @app.on_event("startup")
    async def startup():
        await on_bot_startup()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8080)))
