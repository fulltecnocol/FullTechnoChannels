import os
import asyncio
from dotenv import load_dotenv
from aiogram import Bot

load_dotenv()

TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
# New Cloud Run URL
NEW_WEBHOOK_URL = "https://membership-backend-1054327025113.us-central1.run.app/bot/webhook"

async def set_webhook():
    if not TOKEN:
        print("❌ No TELEGRAM_BOT_TOKEN found")
        return

    try:
        bot = Bot(token=TOKEN)
        result = await bot.set_webhook(url=NEW_WEBHOOK_URL)
        if result:
            print(f"✅ Webhook updated successfully to: {NEW_WEBHOOK_URL}")
        else:
            print("❌ Failed to update webhook")
        await bot.session.close()
    except Exception as e:
        print(f"❌ Error setting webhook: {e}")

if __name__ == "__main__":
    asyncio.run(set_webhook())
