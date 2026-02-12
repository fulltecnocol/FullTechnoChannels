"""
Unified application entry point that serves both API and Bot
"""
import os
from dotenv import load_dotenv
load_dotenv(override=True)

from fastapi import FastAPI
from api.main import app as api_app
from bot.main import app as bot_app, on_startup

# Selective service mounting based on SERVICE_TYPE env var
# Options: unified (default), api, bot
SERVICE_TYPE = os.getenv("SERVICE_TYPE", "unified").lower()

# Create main application
app = FastAPI(title=f"TeleGate {SERVICE_TYPE.upper()} Service")

# Mount API
if SERVICE_TYPE in ["unified", "api"]:
    app.mount("/api", api_app)
    # Also mount at root for api-only mode convenience
    if SERVICE_TYPE == "api":
        app.mount("/", api_app)

# Mount Bot
if SERVICE_TYPE in ["unified", "bot"]:
    app.mount("/bot", bot_app)
    @app.on_event("startup")
    async def startup():
        await on_startup()

@app.get("/")
async def root():
    return {
        "service": "TeleGate",
        "status": "running",
        "endpoints": {
            "api": "/api/docs",
            "bot_webhook": f"/bot/webhook/{os.getenv('TELEGRAM_BOT_TOKEN', '[token]')}",
            "health": "/health"
        }
    }

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
        "components": {}
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
            "error": str(e)
        }
        logger.error("Health check: database unhealthy", error=str(e))
        from fastapi import Response
        return Response(
            content=str(health_status),
            status_code=503,
            media_type="application/json"
        )
    
    # All checks passed
    return health_status


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8080)))
