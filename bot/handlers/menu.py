from aiogram import Router, types, F
from aiogram.filters import Command
from aiogram.utils.keyboard import InlineKeyboardBuilder
from sqlalchemy.future import select
from sqlalchemy import and_
from shared.database import AsyncSessionLocal
from shared.models import Subscription, Plan, Channel
from bot.handlers.initial import get_or_create_user
from datetime import datetime

router = Router()

@router.message(Command("menu"))
async def cmd_menu(message: types.Message):
    builder = InlineKeyboardBuilder()
    builder.row(
        types.InlineKeyboardButton(text="👤 Mi Perfil", callback_data="profile"),
        types.InlineKeyboardButton(text="📺 Canales", callback_data="channels"),
    )
    builder.row(
        types.InlineKeyboardButton(text="🔐 Registrarme", callback_data="start_registration"),
        types.InlineKeyboardButton(text="📞 Agendar Llamada", callback_data="book_call_menu"),
    )
    builder.row(
        types.InlineKeyboardButton(text="🆘 Soporte", callback_data="support_help"),
    )
    await message.answer(
        "👋 **Menú Principal de FGate**\n\n"
        "Selecciona una opción para continuar:",
        reply_markup=builder.as_markup(),
        parse_mode="Markdown",
    )

@router.callback_query(F.data == "profile")
async def handle_profile_callback(callback: types.CallbackQuery):
    await show_profile(callback.message, callback.from_user)
    await callback.answer()

@router.message(Command("me"))
async def cmd_profile(message: types.Message):
    await show_profile(message, message.from_user)

async def show_profile(message: types.Message, tg_user: types.User):
    # Check Cache First
    from shared.cache import memory_cache
    cache_key = f"profile_msg_{tg_user.id}"
    cached_text = await memory_cache.get(cache_key)
    
    if cached_text:
        await message.answer(cached_text, parse_mode="Markdown")
        return

    async with AsyncSessionLocal() as session:
        user = await get_or_create_user(tg_user, session)
        
        # 1. Obtener Suscripciones Activas
        sub_res = await session.execute(
            select(Subscription, Plan, Channel)
            .select_from(Subscription)
            .join(Plan, Subscription.plan_id == Plan.id)
            .join(Channel, Plan.channel_id == Channel.id)
            .where(
                and_(
                    Subscription.user_id == user.id,
                    Subscription.is_active,
                    Subscription.end_date > datetime.utcnow(),
                )
            )
        )
        subs = sub_res.all()

        # 2. Obtener Info de Afiliados
        from shared.accounting import get_affiliate_tier_info

        tier_info = await get_affiliate_tier_info(session, user.id)
        
        bot_info = await message.bot.get_me()

        profile_text = (
            f"👤 **PERFIL FGATE: {tg_user.full_name}**\n"
            f"━━━━━━━━━━━━━━━━━━\n\n"
            f"🆔 **ID**: `{user.id}`\n"
            f"🏆 **Rango**: {tier_info['tier']}\n"
            f"💰 **Balance**: `${user.balance:.2f} USD`\n"
            f"🤝 **Invitados**: `{tier_info['count']}`\n\n"
            f"🔗 **Tu Link de Referido**:\n"
            f"`https://t.me/{bot_info.username}?start=ref_{user.referral_code}`\n\n"
            f"📅 **Tus Membresías Activas**:\n"
        )

        if subs:
            for sub, plan, chan in subs:
                days_left = (sub.end_date - datetime.utcnow()).days
                profile_text += (
                    f"• **{chan.title}**: {plan.name} ({days_left} días restantes)\n"
                )
        else:
            profile_text += "_No tienes membresías activas._\n"

        profile_text += "\n\n_Powered by FGate_"
        
        # Cache message for 60 seconds
        await memory_cache.set(cache_key, profile_text, ttl_seconds=60)
        
        await message.answer(profile_text, parse_mode="Markdown")

@router.callback_query(F.data == "channels")
async def handle_channels_callback(callback: types.CallbackQuery):
    # This logic assumes we want to show available channels or user's channels
    # For now, let's just show a placeholder or basic list
    async with AsyncSessionLocal() as session:
         result = await session.execute(select(Channel).where(Channel.is_verified.is_(True)))
         channels = result.scalars().all()
         
         if not channels:
             await callback.message.edit_text("📺 No hay canales públicos disponibles por ahora.")
             return

         text = "📺 **Canales Disponibles**\n\n"
         builder = InlineKeyboardBuilder()
         
         for channel in channels:
             builder.row(types.InlineKeyboardButton(text=channel.title, callback_data=f"channel_view_{channel.id}"))
        
         await callback.message.edit_text(text, reply_markup=builder.as_markup(), parse_mode="Markdown")

@router.callback_query(F.data.startswith("channel_view_"))
async def view_channel_plans(callback: types.CallbackQuery):
    channel_id = int(callback.data.split("_")[2])
    
    async with AsyncSessionLocal() as session:
        # Get Channel Info
        channel = await session.get(Channel, channel_id)
        if not channel:
            await callback.answer("❌ Canal no encontrado.")
            return

        # Get Plans
        result = await session.execute(
            select(Plan).where(Plan.channel_id == channel_id, Plan.is_active.is_(True))
        )
        plans = result.scalars().all()

        if not plans:
            await callback.message.edit_text(
                f"📺 **{channel.title}**\n\n"
                f"🚫 No hay planes de suscripción disponibles en este momento.",
                reply_markup=InlineKeyboardBuilder().button(text="🔙 Volver", callback_data="channels").as_markup(),
                parse_mode="Markdown"
            )
            return

        text = (
            f"📺 **{channel.title}**\n"
            f"_{channel.description or 'Sin descripción'}_ \n\n"
            f"👇 **Elige un Plan de Suscripción:**"
        )

        builder = InlineKeyboardBuilder()
        for plan in plans:
            # Emulamos link de pago o acción
            builder.row(types.InlineKeyboardButton(
                text=f"{plan.name} - ${plan.price} USD", 
                callback_data=f"select_plan_{plan.id}"
            ))
        
        builder.row(types.InlineKeyboardButton(text="🔙 Volver", callback_data="channels"))

        await callback.message.edit_text(
            text,
            reply_markup=builder.as_markup(),
            parse_mode="Markdown"
        )

@router.callback_query(F.data.startswith("select_plan_"))
async def select_plan_callback(callback: types.CallbackQuery):
    # For now, just a placeholder for payment integration
    plan_id = int(callback.data.split("_")[2])
    await callback.answer(f"✅ Has seleccionado el plan ID: {plan_id}. Integración de pagos pendiente.")
