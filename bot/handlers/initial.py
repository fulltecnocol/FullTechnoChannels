from aiogram import Router, types
from aiogram.filters import Command, CommandObject
from sqlalchemy.future import select
from shared.database import AsyncSessionLocal
from shared.models import User as DBUser, Promotion

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
                # After successful deep link processing, show the main menu
                await cmd_menu(message)
                return
        
        await get_or_create_user(message.from_user, session)
        await message.reply(
            "¡Hola! Soy tu bot de membresía multi-canal. Usa un link de invitación o envía tu código de vinculación para empezar."
        )
        await cmd_menu(message)

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
                    from aiogram import Bot
                    import os
                    bot = Bot(token=os.getenv("TELEGRAM_BOT_TOKEN") or os.getenv("BOT_TOKEN"))
                    if referrer.telegram_id:
                        await bot.send_message(
                            referrer.telegram_id,
                            f"👥 **¡Nuevo Afiliado en tu Red!**\n\n"
                            f"{current_user.full_name} se ha unido usando tu enlace."
                        )
                    await bot.session.close() # Close session for this one-off
                except Exception:
                    pass
                
                await message.reply(f"✅ Has sido referido exitosamente por **{referrer.full_name}**.")
            else:
                await message.reply("⚠️ Ya tienes un referido asignado.")
        else:
            await message.reply("❌ Enlace de referido inválido o propio.")
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
        
    return False
