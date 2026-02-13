import os
from dotenv import load_dotenv
load_dotenv(override=True)
import logging
import asyncio

# Forzar el uso del Loop por defecto (Asyncio) en lugar de uvloop si está instalado
# Esto es crítico para evitar problemas de SSL/DNS con Supabase en algunos entornos
asyncio.set_event_loop_policy(asyncio.DefaultEventLoopPolicy())

import httpx
from fastapi import FastAPI, Request
from aiogram import Bot, Dispatcher, Router, types, F
from aiogram.filters import Command, CommandObject
from aiogram.types import ChatJoinRequest, ContentType, Update
from aiogram.utils.keyboard import InlineKeyboardBuilder

from shared.database import AsyncSessionLocal
from shared.models import Plan, User as DBUser, Channel, Subscription, Promotion
from sqlalchemy.future import select
from sqlalchemy import and_
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(level=logging.INFO)

API_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
WEBHOOK_URL = os.getenv("WEBHOOK_URL")
WEBHOOK_PATH = f"/webhook/{API_TOKEN}"

router = Router()
bot: Bot = None
dp: Dispatcher = None

# --- Lógica de Negocio (Mantenida) ---

async def get_or_create_user(tg_user: types.User, session):
    result = await session.execute(select(DBUser).where(DBUser.telegram_id == tg_user.id))
    user = result.scalar_one_or_none()
    if not user:
        user = DBUser(telegram_id=tg_user.id, username=tg_user.username, full_name=tg_user.full_name)
        session.add(user)
        await session.commit()
        await session.refresh(user)
    return user

@router.message(Command("start"))
async def send_welcome(message: types.Message, command: CommandObject):
    async with AsyncSessionLocal() as session:
        args = command.args
        
        # 🟢 CASO A: Sincronización de Cuenta de Dueño/Afiliado
        if args and args.startswith("sync_"):
            sync_code = args.replace("sync_", "")
            # Buscar al usuario por su código de referido (que usamos como sync_code temporalmente o un UUID)
            # Para simplificar, usaremos el referral_code como código de sincronización
            result = await session.execute(select(DBUser).where(DBUser.referral_code == sync_code))
            user = result.scalar_one_or_none()
            
            if user:
                user.telegram_id = message.from_user.id
                await session.commit()
                await message.reply(
                    f"✅ **¡Cuenta TeleGate Vinculada!**\n\n"
                    f"Hola **{user.full_name}**, ahora recibirás notificaciones inmediatas de tus comisiones y ventas. Una solución de **Full Techno HUB**."
                )
                return
            else:
                await message.reply("❌ El código de sincronización no es válido o ha expirado.")
                return

        # 🟠 CASO C: Registro de Referido (Red de 10 niveles)
        if args and args.startswith("ref_"):
            ref_code = args.replace("ref_", "")
            # Buscar al usuario que refiere
            ref_result = await session.execute(select(DBUser).where(DBUser.referral_code == ref_code))
            referrer = ref_result.scalar_one_or_none()
            
            user = await get_or_create_user(message.from_user, session)
            if referrer and not user.referred_by_id and user.id != referrer.id:
                user.referred_by_id = referrer.id
                await session.commit()
                await message.reply(f"🎯 **¡Te has unido a la red TeleGate de {referrer.full_name}!**")
            
            # Continuar como un inicio normal después de vincular el referido
            args = None 

        # 🔵 CASO D: Registro de Suscriptor normal
        user = await get_or_create_user(message.from_user, session)
        if args:
            # Primero intentar buscar como promoción o trial (CASO C)
            promo_res = await session.execute(select(Promotion).where(and_(Promotion.code == args, Promotion.is_active == True)))
            promo = promo_res.scalar_one_or_none()
            if promo:
                if promo.max_uses and promo.current_uses >= promo.max_uses:
                    await message.reply("❌ Esta oferta ya no está disponible.")
                    return
                await handle_promotion_link(message, promo, user, session)
                return

            # Si no es promo, buscar como vinculación de canal (CASO B)
            result = await session.execute(select(Channel).where(Channel.validation_code == args))
            channel = result.scalar_one_or_none()
            if channel:
                if not channel.is_verified:
                    await message.reply(f"📍 Intento de vinculación: **{channel.title}**.", 
                                       reply_markup=InlineKeyboardBuilder().row(
                                           types.InlineKeyboardButton(text="✅ Confirmar Vinculación", callback_data=f"verify_{channel.id}_{message.chat.id}")
                                       ).as_markup())
                    return
                else:
                    await show_channel_plans(message, channel.id)
                    return
        
        await message.reply("¡Hola! Soy tu bot de membresía multi-canal. Usa un link de invitación para empezar.")

@router.callback_query(F.data.startswith("verify_"))
async def handle_verify_callback(callback: types.CallbackQuery):
    # verify_CHANNELID_CHATID
    parts = callback.data.split("_")
    channel_id = int(parts[1])
    tg_chat_id = int(parts[2])
    
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Channel).where(Channel.id == channel_id))
        channel = result.scalar_one_or_none()
        if channel:
            channel.is_verified = True
            channel.telegram_id = tg_chat_id
            
            # Intentar generar link de invitación si el bot es admin
            try:
                invite = await bot.create_chat_invite_link(chat_id=tg_chat_id, creates_join_request=True)
                channel.invite_link = invite.invite_link
            except Exception as e:
                logging.error(f"Error creando invite link: {e}")

            await session.commit()
            await callback.message.edit_text(
                f"✅ **¡VINCULACIÓN EXITOSA!**\n\n"
                f"El canal **{channel.title}** ha sido vinculado a este chat de Telegram.\n\n"
                f"🚀 Ya puedes empezar a vender membresías desde el Dashboard."
            )
        else:
            await callback.answer("Error: Canal no encontrado.", show_alert=True)

async def handle_promotion_link(message: types.Message, promo, user, session):
    if promo.promo_type == "trial":
        # Verificar si ya usó trial en este canal
        trial_check = await session.execute(
            select(Subscription)
            .select_from(Subscription)
            .join(Plan, Subscription.plan_id == Plan.id)
            .where(
                and_(Subscription.user_id == user.id, Plan.channel_id == promo.channel_id, Subscription.is_trial == True)
            )
        )
        if trial_check.scalar_one_or_none():
            await message.reply("❌ Ya has disfrutado de un periodo de prueba en este canal.")
            return

        # Buscar el primer plan activo para asociar (aunque sea trial)
        plan_res = await session.execute(select(Plan).where(and_(Plan.channel_id == promo.channel_id, Plan.is_active == True)))
        plan = plan_res.scalars().first()
        if not plan:
            await message.reply("❌ Este canal no tiene suscriptores activos configurados.")
            return

        new_sub = Subscription(
            user_id=user.id,
            plan_id=plan.id,
            start_date=datetime.utcnow(),
            end_date=datetime.utcnow() + timedelta(days=int(promo.value)),
            is_active=True,
            is_trial=True
        )
        promo.current_uses += 1
        session.add(new_sub)
        await session.commit()
        
        chan_res = await session.execute(select(Channel).where(Channel.id == promo.channel_id))
        channel = chan_res.scalar_one_or_none()
        
        await message.reply(
            f"🎁 **¡Bienvenido VIP!**\n\n"
            f"Has activado **{int(promo.value)} días de acceso gratis** al canal: **{channel.title}**.\n\n"
            "Únete ahora y no te pierdas nada. Te avisaremos antes de que expire."
        )
    elif promo.promo_type == "discount":
        await show_channel_plans(message, promo.channel_id, promo=promo)

@router.message(Command("me"))
async def cmd_profile(message: types.Message):
    async with AsyncSessionLocal() as session:
        user = await get_or_create_user(message.from_user, session)
        
        # 1. Obtener Suscripciones Activas
        sub_res = await session.execute(
            select(Subscription, Plan, Channel)
            .select_from(Subscription)
            .join(Plan, Subscription.plan_id == Plan.id)
            .join(Channel, Plan.channel_id == Channel.id)
            .where(
                and_(Subscription.user_id == user.id, Subscription.is_active == True, Subscription.end_date > datetime.utcnow())
            )
        )
        subs = sub_res.all()
        
        # 2. Obtener Info de Afiliados
        from shared.accounting import get_affiliate_tier_info
        tier_info = await get_affiliate_tier_info(session, user.id)
        
        profile_text = (
            f"👤 **PERFIL TELEGATE: {message.from_user.full_name}**\n"
            f"━━━━━━━━━━━━━━━━━━\n\n"
            f"🆔 **ID**: `{user.id}`\n"
            f"🏆 **Rango**: {tier_info['tier']}\n"
            f"💰 **Balance**: `${user.balance:.2f} USD`\n"
            f"🤝 **Invitados**: `{tier_info['count']}`\n\n"
            f"🔗 **Tu Link de Referido**:\n"
            f"`https://t.me/{(await bot.get_me()).username}?start=ref_{user.referral_code}`\n\n"
            f"📅 **Tus Membresías Activas**:\n"
        )
        
        if subs:
            for sub, plan, chan in subs:
                days_left = (sub.end_date - datetime.utcnow()).days
                profile_text += f"• **{chan.title}**: {plan.name} ({days_left} días restantes)\n"
        else:
            profile_text += "_No tienes membresías activas._\n"
            
        profile_text += "\n\n_Powered by Full Techno HUB_"
        await message.answer(profile_text, parse_mode="Markdown")

@router.message(Command("soporte"))
async def cmd_support(message: types.Message, command: CommandObject):
    args = command.args
    if not args:
        await message.answer(
            "🛠 **Centro de Soporte**\n\n"
            "Para abrir un ticket de soporte, usa el comando seguido de tu mensaje:\n"
            "Ej: `/soporte No he recibido mi link de acceso`",
            parse_mode="Markdown"
        )
        return
    
    builder = InlineKeyboardBuilder()
    builder.row(
        types.InlineKeyboardButton(text="✅ Confirmar Envío", callback_data="ticket_confirm"),
        types.InlineKeyboardButton(text="❌ Cancelar", callback_data="ticket_cancel")
    )
    
    await message.answer(
        "📝 **Resumen del Ticket**\n\n"
        f"**Contenido**: {args}\n\n"
        "¿Deseas enviar este mensaje a nuestro equipo técnico?",
        reply_markup=builder.as_markup(),
        parse_mode="Markdown"
    )

@router.callback_query(F.data == "ticket_confirm")
async def handle_confirm_ticket(callback: types.CallbackQuery):
    content = callback.message.text.split("**Contenido**: ")[1].split("\n\n")[0]
    
    async with AsyncSessionLocal() as session:
        user = await get_or_create_user(callback.from_user, session)
        
        # Llamar a la API para crear el ticket (o hacerlo directo por DB)
        from shared.models import SupportTicket, TicketMessage
        new_ticket = SupportTicket(user_id=user.id, subject="Ticket desde Bot", priority="normal")
        session.add(new_ticket)
        await session.flush()
        
        initial_msg = TicketMessage(ticket_id=new_ticket.id, sender_id=user.id, content=content)
        session.add(initial_msg)
        await session.commit()
        
        await callback.message.edit_text(
            f"✅ **Ticket #{new_ticket.id} Creado**\n\n"
            "Nuestro equipo revisará tu solicitud y te responderemos por este mismo chat en breve.",
            parse_mode="Markdown"
        )

@router.callback_query(F.data == "ticket_cancel")
async def handle_cancel_ticket(callback: types.CallbackQuery):
    await callback.message.edit_text("❌ Envío cancelado.")

    await callback.message.edit_text("❌ Envío cancelado.")

@router.message(Command("recuperar"))
async def cmd_recover(message: types.Message):
    """
    Permite al usuario recuperar acceso a su Dashboard.
    """
    async with AsyncSessionLocal() as session:
        # 1. Verificar si el usuario está registrado y vinculado
        user = await get_or_create_user(message.from_user, session)
        
        if not user.is_owner:
             await message.reply(
                "❌ **Acceso Denegado**\n\n"
                "Esta función es solo para **Creadores de Contenido** registrados en el Dashboard.",
                parse_mode="Markdown"
            )
             return

        # 2. Solicitar Token Mágico a la API
        port = os.getenv("PORT", "8080")
        api_url = os.getenv("API_URL", f"http://127.0.0.1:{port}/api")
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.post(f"{api_url}/auth/magic-link-token", json={
                    "telegram_id": message.from_user.id
                })
                
                if resp.status_code == 200:
                    data = resp.json()
                    token = data["token"]
                    # DOMINIO CORRECTO
                    token = data["token"]
                    # DOMINIO CORRECTO: Enlace Mágico para Producción
                    magic_link_prod = f"https://telegate.fulltechnohub.com/login?magic_token={token}"
                    
                    await message.reply(
                        f"🔐 **Enlace de Acceso Seguro**\n\n"
                        f"Haz clic en el botón de abajo para entrar a tu Dashboard sin contraseña.\n"
                        f"⚠️ _Este enlace expira en 5 minutos._",
                        reply_markup=InlineKeyboardBuilder()
                        .row(types.InlineKeyboardButton(text="🚀 Entrar al Dashboard", url=magic_link_prod))
                        .as_markup(),
                        parse_mode="Markdown"
                    )
                else:
                    logging.error(f"Error API Magic Link: {resp.text}")
                    await message.reply("❌ Hubo un error generando tu enlace. Intenta más tarde.")
            
            except Exception as e:
                logging.error(f"Excepción API Magic Link: {e}")
                await message.reply("❌ Error de conexión con el servidor.")

@router.message(Command("ayuda"))
async def cmd_help(message: types.Message):
    help_text = (
        "❓ **¿Cómo puedo ayudarte con TeleGate?**\n\n"
        "/me - Ver mi perfil, saldo y membresías.\n"
        "/legal - ✍️ **Activar Pagos** (Firmar Contrato).\n"
        "/ayuda - Mostrar este menú.\n"
        "/soporte [mensaje] - Contactar con el soporte.\n\n"
        "🚀 **Para unirse a un canal**: Usa el link de invitación que te proporcionó el dueño del canal.\n\n"
        "_Designed & Powered by Full Techno HUB_"
    )
    await message.answer(help_text, parse_mode="Markdown")

async def show_channel_plans(message: types.Message, channel_id: int, promo=None):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Plan).where(and_(Plan.channel_id == channel_id, Plan.is_active == True)))
        plans = result.scalars().all()
    if not plans:
        await message.reply("No hay planes activos.")
        return
    builder = InlineKeyboardBuilder()
    
    promo_text = ""
    if promo:
        promo_text = f"\n\n🔥 **OFERTA ACTIVA**: {int(promo.value * 100)}% de descuento en tu primer pago."

    for plan in plans:
        price = plan.price
        btn_text = f"{plan.name} - ${price}"
        if promo and promo.promo_type == "discount":
            discounted_price = round(price * (1 - promo.value), 2)
            btn_text = f"🔥 {plan.name} - ${discounted_price} (Antes ${price})"
        
        builder.row(types.InlineKeyboardButton(text=btn_text, callback_data=f"buy_{plan.id}_{promo.id if promo else 0}"))
    
    await message.answer(f"Selecciona un plan para unirte:{promo_text}", reply_markup=builder.as_markup())

@router.callback_query(F.data.startswith("buy_"))
async def handle_buy_callback(callback: types.CallbackQuery):
    # buy_PLANID_PROMOID
    parts = callback.data.split("_")
    plan_id = int(parts[1])
    promo_id = int(parts[2])
    
    builder = InlineKeyboardBuilder()
    builder.row(types.InlineKeyboardButton(text="💳 Tarjeta (Global/Stripe)", callback_data=f"pay_stripe_{plan_id}_{promo_id}"))
    builder.row(types.InlineKeyboardButton(text="🇨🇴 Wompi (Colombia/Nequi/PSE)", callback_data=f"pay_wompi_{plan_id}_{promo_id}"))
    builder.row(types.InlineKeyboardButton(text="⚡ USDT / Cripto (Global)", callback_data=f"pay_crypto_{plan_id}_{promo_id}"))
    
    await callback.message.edit_text("Selecciona tu método de pago preferido:", reply_markup=builder.as_markup())

@router.callback_query(F.data.startswith("pay_"))
async def handle_pay_callback(callback: types.CallbackQuery):
    # pay_METHOD_PLANID_PROMOID
    parts = callback.data.split("_")
    method = parts[1]
    plan_id = int(parts[2])
    promo_id = int(parts[3])
    
    async with AsyncSessionLocal() as session:
        user = await get_or_create_user(callback.from_user, session)
        
        # Llamar a la API interna para generar el link
        port = os.getenv("PORT", "8080")
        api_url = os.getenv("API_URL", f"http://127.0.0.1:{port}/api")
        async with httpx.AsyncClient() as client:
            resp = await client.post(f"{api_url}/payments/create-link", json={
                "plan_id": plan_id,
                "user_id": user.id,
                "method": method,
                "promo_id": promo_id if promo_id > 0 else None
            })
            
            if resp.status_code == 200:
                data = resp.json()
                if method == "crypto":
                    await callback.message.edit_text(
                        f"⚡ **PAGO CON CRIPTO (USDT)**\n\n"
                        f"Por favor envía el pago a la siguiente dirección:\n\n"
                        f"📌 **Red**: `{data['network']}`\n"
                        f"💰 **Monto**: `${data['amount']} USDT`\n"
                        f"🏦 **Wallet**: `{data['address']}`\n\n"
                        f"⚠️ `{data['instructions']}`\n\n"
                        f"Usa el comando `/soporte [HASH]` para enviarnos el comprobante.",
                        parse_mode="Markdown"
                    )
                else:
                    payment_url = data.get("url")
                    builder = InlineKeyboardBuilder()
                    builder.row(types.InlineKeyboardButton(text="🚀 Pagar Ahora", url=payment_url))
                    
                    await callback.message.edit_text(
                        f"✅ **Link Generado ({method.upper()})**\n\n"
                        "Haz clic en el botón de abajo para completar tu pago de forma segura. "
                        "Una vez aprobado, serás aceptado automáticamente en el canal.",
                        reply_markup=builder.as_markup()
                    )
            else:
                await callback.answer("❌ Error al generar el link de pago. Intenta más tarde.", show_alert=True)

@router.chat_join_request()
async def handle_join_request(update: ChatJoinRequest):
    async with AsyncSessionLocal() as session:
        user_result = await session.execute(select(DBUser).where(DBUser.telegram_id == update.from_user.id))
        user = user_result.scalar_one_or_none()
        channel_result = await session.execute(select(Channel).where(Channel.telegram_id == update.chat.id))
        channel = channel_result.scalar_one_or_none()
        
        if user and channel:
            sub_result = await session.execute(
                select(Subscription)
                .select_from(Subscription)
                .join(Plan, Subscription.plan_id == Plan.id)
                .where(
                    and_(Subscription.user_id == user.id, Plan.channel_id == channel.id, Subscription.is_active == True, Subscription.end_date > datetime.utcnow())
                )
            )
            if sub_result.scalar_one_or_none():
                await update.approve()
                return
        await update.decline()

# --- Configuración para Despliegue (Webhook vs Polling) ---

app = FastAPI()

@app.post(WEBHOOK_PATH)
async def bot_webhook(request: Request):
    update = Update.model_validate(await request.json(), context={"bot": bot})
    await dp.feed_update(bot, update)
    return {"ok": True}

@app.get("/health")
async def bot_health_check():
    """Bot service health check"""
    health_status = {
        "service": "TeleGate Bot",
        "status": "healthy",
        "components": {
            "bot": {"status": "configured" if bot else "not_initialized"},
            "dispatcher": {"status": "configured" if dp else "not_initialized"},
            "telegram_token": {"status": "configured" if API_TOKEN else "missing"}
        }
    }
    
    if not bot or not dp or not API_TOKEN:
        health_status["status"] = "unhealthy"
        from fastapi import Response
        return Response(content=str(health_status), status_code=503)
    
    return health_status



@app.on_event("startup")
async def on_startup():
    global bot, dp
    bot = Bot(token=API_TOKEN)
    dp = Dispatcher()
    
    # Importar y registrar rutas
    from bot.handlers.signature_handlers import signature_router
    dp.include_router(signature_router)
    
    dp.include_router(router)
    

    
    # Configurar Menú de Comandos
    await bot.set_my_commands([
        types.BotCommand(command="me", description="Mi Perfil & Membresías"),
        types.BotCommand(command="ayuda", description="Centro de Ayuda"),
        types.BotCommand(command="me", description="Mi Perfil & Membresías"),
        types.BotCommand(command="ayuda", description="Centro de Ayuda"),
        types.BotCommand(command="soporte", description="Contactar Soporte"),
        types.BotCommand(command="recuperar", description="Acceso al Dashboard")
    ])

    if WEBHOOK_URL:
        try:
            await bot.set_webhook(url=WEBHOOK_URL + WEBHOOK_PATH)
            logging.info(f"Webhook set to {WEBHOOK_URL + WEBHOOK_PATH}")
        except Exception as e:
            logging.warning(f"Failed to set webhook (will retry later): {e}")
    else:
        logging.info("Starting in POLLING mode")

async def run_polling():
    global bot, dp
    bot = Bot(token=API_TOKEN)
    dp = Dispatcher()
    
    # Importar y registrar rutas
    from bot.handlers.signature_handlers import signature_router
    dp.include_router(signature_router)
    
    dp.include_router(router)
    await dp.start_polling(bot)

if __name__ == "__main__":
    if WEBHOOK_URL:
        import uvicorn
        port = int(os.environ.get("PORT", 8080))
        uvicorn.run(app, host="0.0.0.0", port=port)
    else:
        asyncio.run(run_polling())
