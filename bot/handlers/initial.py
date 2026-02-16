from aiogram import Router, types, F
from aiogram.filters import Command, CommandObject
from sqlalchemy.future import select
from shared.database import AsyncSessionLocal
from shared.models import User as DBUser, Promotion, RegistrationToken
from datetime import datetime, timedelta
import random

router = Router()

async def get_or_create_user(tg_user: types.User, session):
    result = await session.execute(
        select(DBUser).where(DBUser.telegram_id == tg_user.id)
    )
    user = result.scalar_one_or_none()
    if not user:
        user = DBUser(
            telegram_id=tg_user.id,
            username=tg_user.username,
            full_name=tg_user.full_name,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
    return user

@router.message(Command("start"))
async def send_welcome(message: types.Message, command: CommandObject):
    from .menu import cmd_menu
    async with AsyncSessionLocal() as session:
        args = command.args
        if args:
            processed = await process_code(message, args, session)
            if processed:
                # If it was a deep link, we don't necessarily want the menu immediately
                # especially for 'registro' which has its own flow
                if args == "registro":
                    return 
                
                await cmd_menu(message)
                return
        
        await get_or_create_user(message.from_user, session)
        
        # Welcome message with buttons
        from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="🚀 Registrarme en la Web", callback_data="start_registration")],
            [InlineKeyboardButton(text="📱 Abrir Menú", callback_data="main_menu")]
        ])

        await message.reply(
            "¡Hola! Soy tu bot de membresía **TeleGate**.\n\n"
            "Usa un link de invitación para unirte a un canal, o regístrate para empezar a gestionar tus propias suscripciones.",
            reply_markup=keyboard,
            parse_mode="Markdown"
        )

async def handle_registration_request(message: types.Message, session):
    """Common logic for registration code generation"""
    from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
    import os
    
    # 1. Verificar si ya está registrado
    existing_user = await get_or_create_user(message.from_user, session)
    if existing_user.email: # Ya tiene cuenta vinculada
        await message.reply(
            "✅ **Ya estás registrado**\n\n"
            "Tu cuenta de Telegram ya está vinculada a un usuario. Puedes iniciar sesión directamente en la web."
        )
        return True

    # 2. Generar Token
    token = str(random.randint(100000, 999999))
    
    # 3. Guardar en DB (Upsert)
    new_token = RegistrationToken(
        token=token,
        telegram_id=message.from_user.id,
        username=message.from_user.username,
        full_name=message.from_user.full_name,
        expires_at=datetime.utcnow() + timedelta(minutes=15)
    )
    session.add(new_token)
    await session.commit()
    
    # Create Inline Keyboard
    dashboard_url = os.getenv("DASHBOARD_URL", "https://telegate.fulltechnohub.com")
    
    # Construct URL with params
    final_url = f"{dashboard_url}/register?token={token}"
    
    # Check if user has a referrer to include in the link
    if existing_user.referred_by_id:
        try:
            referrer_result = await session.execute(
                select(DBUser.referral_code).where(DBUser.id == existing_user.referred_by_id)
            )
            referrer_code = referrer_result.scalar_one_or_none()
            if referrer_code:
                final_url += f"&ref={referrer_code}"
        except Exception:
            pass

    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🔐 Copiar Código (Tap)", callback_data=f"copy_{token}")],
        [InlineKeyboardButton(text="🌐 Ir al Registro en la Web", url=final_url)]
    ])

    await message.reply(
        f"🔐 **Tu Código de Registro**\n\n"
        f"Tu código es: `{token}`\n\n"
        f"⚠️ _Válido por 15 minutos. El enlace ya incluye tu código y referido._",
        reply_markup=keyboard,
        parse_mode="Markdown"
    )
    return True

async def process_code(message: types.Message, code: str, session):
    # 🟢 CASO A: Sincronización de Cuenta de Dueño/Afiliado
    if code.startswith("sync_"):
        sync_code = code.replace("sync_", "")
        result = await session.execute(
            select(DBUser).where(DBUser.referral_code == sync_code)
        )
        user = result.scalar_one_or_none()

        if user:
            user.telegram_id = message.from_user.id
            await session.commit()
            await message.reply(
                f"✅ **¡Cuenta TeleGate Vinculada!**\n\n"
                f"Hola **{user.full_name}**, ahora recibirás notificaciones inmediatas de tus comisiones y ventas. Una solución de **Full Techno HUB**."
            )
            return True
        else:
            await message.reply(
                "❌ El código de sincronización no es válido o ha expirado."
            )
            return True

    # 🟠 CASO C: Registro de Referido (Red de 10 niveles)
    if code.startswith("ref_"):
        ref_code = code.replace("ref_", "")
        result = await session.execute(
            select(DBUser).where(DBUser.referral_code == ref_code)
        )
        referrer = result.scalar_one_or_none()
        
        # Ensure user exists
        current_user = await get_or_create_user(message.from_user, session)
        
        if referrer and referrer.id != current_user.id:
            if not current_user.referred_by_id:
                current_user.referred_by_id = referrer.id
                await session.commit()
                # Notify referrer
                try:
                    if referrer.telegram_id:
                        # Use the bot instance from the message context
                        await message.bot.send_message(
                            referrer.telegram_id,
                            f"👥 **¡Nuevo Afiliado en tu Red!**\n\n"
                            f"{current_user.full_name} se ha unido usando tu enlace."
                        )
                except Exception as e:
                    # Log error silently or similar
                    print(f"Error notifying referrer: {e}")
                
                await message.answer(f"✅ Referido por **{referrer.full_name}** exitosamente.")
            
            # Whether new or existing, we proceed to registration flow
            pass 
        else:
            await message.reply("❌ Enlace de referido inválido o propio.")
            # If invalid, stop to avoid confusion or proceed? Let's stop as it might be a malformed link.
            return True

        # Continuar al flujo de registro automático con el referido ya asignado
        await handle_registration_request(message, session)
        return True

    # 🔵 CASO B: Promociones / Checkout Deep Links (promo_CODE)
    if code.startswith("promo_"):
        promo_code = code.replace("promo_", "")
        result = await session.execute(
            select(Promotion).where(Promotion.code == promo_code)
        )
        promo = result.scalar_one_or_none()
        
        if promo and promo.is_active:
             # Logic to show promo info would go here, for now just acknowledge
             await message.reply(f"🎟️ **Promoción Detectada:** {promo.code}")
             # In future refactor: route to payment handler
        else:
            await message.reply("❌ Código de promoción inválido.")
        return True

    # 🟣 CASO D: Solicitud de Código de Registro
    if code == "registro":
        return await handle_registration_request(message, session)
        
    return False

@router.callback_query(F.data == "start_registration")
async def cb_start_registration(callback: types.CallbackQuery):
    async with AsyncSessionLocal() as session:
        await handle_registration_request(callback.message, session)
        await callback.answer()

@router.callback_query(F.data == "main_menu")
async def cb_main_menu(callback: types.CallbackQuery):
    from .menu import cmd_menu
    await cmd_menu(callback.message)
    await callback.answer()


@router.callback_query(lambda c: c.data and c.data.startswith("copy_"))
async def handle_copy_code(callback: types.CallbackQuery):
    code = callback.data.split("_")[1]
    # We can't actually copy to clipboard via bot API, but we can send it as a clean message
    # or just answer the callback.
    # Best UX: Answer with "Copiado" (illusion) and send just the code in a new message
    
    await callback.message.answer(f"`{code}`", parse_mode="Markdown")
    await callback.answer("✅ Código listo para copiar", show_alert=False)

