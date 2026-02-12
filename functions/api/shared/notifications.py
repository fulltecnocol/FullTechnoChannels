import os
import aiohttp
import logging

API_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

async def send_telegram_notification(telegram_id: int, message: str):
    """
    Envía una notificación de Telegram a un usuario específico.
    """
    if not API_TOKEN or not telegram_id:
        return

    url = f"https://api.telegram.org/bot{API_TOKEN}/sendMessage"
    payload = {
        "chat_id": telegram_id,
        "text": message,
        "parse_mode": "Markdown"
    }

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload) as response:
                if response.status != 200:
                    logging.error(f"Error enviando notificación TG: {await response.text()}")
    except Exception as e:
        logging.error(f"Excepción al enviar notificación TG: {str(e)}")
