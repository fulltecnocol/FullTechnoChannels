"""
Unified application entry point that serves both API and Bot
"""
import os
from dotenv import load_dotenv
load_dotenv(override=True)

from fastapi import FastAPI
from api.main import app as api_app
from bot.main import app as bot_app, on_startup

# Create main application
app = FastAPI(title="TeleGate Unified API")

# Mount API routes at /api
app.mount("/api", api_app)

# Mount Bot routes at /bot  
app.mount("/bot", bot_app)

# Register startup handlers
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
            "bot_webhook": f"/bot/webhook/{os.getenv('TELEGRAM_BOT_TOKEN', '[token]')}"
        }
    }

if __main__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8080)))
