import os
import asyncio
from dotenv import load_dotenv
from aiogram import Bot

load_dotenv()

TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

async def check_webhook():
    if not TOKEN:
        print("❌ No TELEGRAM_BOT_TOKEN found in environment")
        return

    try:
        bot = Bot(token=TOKEN)
        info = await bot.get_webhook_info()
        print(f"✅ Webhook Info:")
        print(f"   URL: {info.url}")
        print(f"   Pending Updates: {info.pending_update_count}")
        print(f"   Last Error Date: {info.last_error_date}")
        print(f"   Last Error Message: {info.last_error_message}")
        print(f"   Has Custom Certificate: {info.has_custom_certificate}")
        await bot.session.close()
    except Exception as e:
        print(f"❌ Error getting webhook info: {e}")

if __name__ == "__main__":
    asyncio.run(check_webhook())
