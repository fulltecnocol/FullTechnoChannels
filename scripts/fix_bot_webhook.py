import os
import asyncio
from aiogram import Bot
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv(override=True)

API_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN") or os.getenv("BOT_TOKEN")
# La URL de producción según deployment_urls.txt
PRODUCTION_URL = "https://membership-backend-dhtw77aq7a-uc.a.run.app"
WEBHOOK_PATH = f"/bot/webhook/{API_TOKEN}"
WEBHOOK_URL = PRODUCTION_URL + WEBHOOK_PATH


async def set_webhook():
    if not API_TOKEN:
        print("Error: TELEGRAM_BOT_TOKEN no encontrado en .env")
        return

    bot = Bot(token=API_TOKEN)

    print(f"Configurando webhook para: {WEBHOOK_URL}")

    # Eliminar webhook actual
    await bot.delete_webhook()

    # Configurar nuevo webhook
    success = await bot.set_webhook(
        url=WEBHOOK_URL,
        drop_pending_updates=True,
        allowed_updates=["message", "callback_query", "chat_join_request"],
    )

    if success:
        print("✅ Webhook configurado exitosamente.")
    else:
        print("❌ Error al configurar el webhook.")

    info = await bot.get_webhook_info()
    print(f"Información actual: {info}")

    await bot.session.close()


if __name__ == "__main__":
    asyncio.run(set_webhook())
