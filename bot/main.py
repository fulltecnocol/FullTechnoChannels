import os
import logging
import asyncio
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from aiogram import Bot, Dispatcher, types
from aiogram.types import Update

# load_dotenv(override=True)  # Disabled for production to use Cloud Run env vars

# Forzar el uso del Loop por defecto (Asyncio) en lugar de uvloop si está instalado
# Esto es crítico para evitar problemas de SSL/DNS con Supabase en algunos entornos
asyncio.set_event_loop_policy(asyncio.DefaultEventLoopPolicy())

# Configure logging
logging.basicConfig(level=logging.INFO)

API_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN") or os.getenv("BOT_TOKEN")
WEBHOOK_URL = os.getenv("WEBHOOK_URL")
WEBHOOK_PATH = f"/webhook/{API_TOKEN}"

if not API_TOKEN:
    logging.warning("No TELEGRAM_BOT_TOKEN found. Bot functionality will be disabled.")
    bot = None
else:
    try:
        bot = Bot(token=API_TOKEN)
    except Exception as e:
        logging.error(f"Failed to initialize Bot: {e}")
        bot = None

dp = None

# --- Configuración para Despliegue (Webhook vs Polling) ---

app = FastAPI()

@app.post(WEBHOOK_PATH)
async def bot_webhook(request: Request):
    payload = await request.json()
    logging.info(f"RECIBIDO WEBHOOK: {payload}")
    try:
        update = Update.model_validate(payload, context={"bot": bot})
        logging.info(
            f"Update validado. ID={update.update_id}, Type={update.event_type}"
        )
        await dp.feed_update(bot, update)
        return {"ok": True}
    except Exception as e:
        logging.error(f"Error procesando update: {e}")
        return {"ok": False, "error": str(e)}

@app.get("/health")
async def bot_health_check():
    """Bot service health check"""
    health_status = {
        "service": "FGate Bot",
        "status": "healthy",
        "components": {
            "bot": {"status": "configured" if bot else "not_initialized"},
            "dispatcher": {"status": "configured" if dp else "not_initialized"},
            "telegram_token": {"status": "configured" if API_TOKEN else "missing"},
        },
    }

    if not bot or not dp or not API_TOKEN:
        health_status["status"] = "unhealthy"
        from fastapi import Response

        return Response(content=str(health_status), status_code=503)

    return health_status

@app.on_event("startup")
async def on_bot_startup():
    global dp
    if dp is None:
        dp = Dispatcher()

    # Registrar routers modulares
    from bot.handlers import (
        initial,
        menu,
        support,
        call_handlers,
        signature_handlers,
    )

    # Orden de registro importa (handlers más específicos primero)
    routers = [
        initial.router,
        menu.router,
        support.router,
        call_handlers.router,
        signature_handlers.signature_router,
    ]

    for router in routers:
        if router not in dp.sub_routers:
            dp.include_router(router)

    # Configurar Menú de Comandos
    await bot.set_my_commands(
        [
            types.BotCommand(command="start", description="Iniciar Bot"),
            types.BotCommand(command="menu", description="Menú Principal"),
            types.BotCommand(command="me", description="Mi Perfil"),
            types.BotCommand(command="soporte", description="Contactar Soporte"),
            types.BotCommand(command="ayuda", description="Ayuda"),
        ]
    )

    if WEBHOOK_URL:
        # Forzar el prefijo /bot si no está presente en la URL base
        base_url = WEBHOOK_URL.rstrip("/")
        if not base_url.endswith("/bot"):
            final_webhook_url = f"{base_url}/bot{WEBHOOK_PATH}"
        else:
            final_webhook_url = f"{base_url}{WEBHOOK_PATH}"

        logging.info(f"Intentando configurar webhook en: {final_webhook_url}")

        try:
            await bot.set_webhook(
                url=final_webhook_url,
                drop_pending_updates=True,
                allowed_updates=["message", "callback_query", "chat_join_request"],
            )
            logging.info(f"Webhook set to {final_webhook_url}")
        except Exception as e:
            logging.warning(f"Failed to set webhook (will retry later): {e}")
    else:
        logging.info("Starting in POLLING mode (Background Task)")
        asyncio.create_task(run_polling())

async def run_polling():
    global dp
    if dp is None:
        dp = Dispatcher()

    # Registrar routers (mismo set que arriba)
    from bot.handlers import (
        initial,
        menu,
        support,
        call_handlers,
        signature_handlers,
    )

    routers = [
        initial.router,
        menu.router,
        support.router,
        call_handlers.router,
        signature_handlers.signature_router,
    ]

    for router in routers:
        if router not in dp.sub_routers:
            dp.include_router(router)

    logging.info("Deleting webhook to start polling...")
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)

if __name__ == "__main__":
    if WEBHOOK_URL:
        import uvicorn
        port = int(os.environ.get("PORT", 8080))
        uvicorn.run(app, host="0.0.0.0", port=port)
    else:
        asyncio.run(run_polling())
