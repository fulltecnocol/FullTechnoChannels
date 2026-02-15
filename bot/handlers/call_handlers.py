from aiogram import Router, F, types
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.utils.keyboard import InlineKeyboardBuilder
from sqlalchemy.future import select
from sqlalchemy import and_
from shared.database import AsyncSessionLocal
from shared.models import CallService, CallSlot, User

import logging
from datetime import datetime

router = Router()

@router.message(Command("llamada"))
async def cmd_llamada(message: types.Message):
    """
    Muestra la oferta de llamadas del dueño del canal (si existe).
    """
    async with AsyncSessionLocal() as session:
        # 1. Identificar al usuario y su dueño (si es que la lógica es 1 dueño por bot instance/global?)
        # En este sistema parece que es Multi-Tenant pero el bot es "FullT_GuardBot".
        # Asumiremos que el dueño es el admin principal o buscamos por contexto?
        # Revisando `main.py`, el bot parece ser único.
        # ¿Cómo sabe el bot qué "dueño" ofrece la llamada?
        # Opción A: El bot está vinculado a UN solo dueño (Single Tenant Logic actual parecida).
        # Opción B: El usuario selecciona de qué canal quiere la llamada.
        
        # Para simplificar MVP: Asumimos que buscamos CUALQUIER servicio activo (o el primero).
        result = await session.execute(select(CallService).where(CallService.is_active == True))
        service = result.scalars().first()
        
        if not service:
            await message.answer("🚫 Actualmente no hay disponibilidad de llamadas privadas.")
            return

        # Mostrar Info
        builder = InlineKeyboardBuilder()
        builder.button(text="📅 Ver Horarios Disponibles", callback_data=f"view_slots_{service.id}")
        
        await message.answer(
            f"📞 **Sesión Privada 1 a 1**\n\n"
            f"💬 {service.description}\n"
            f"⏱ Duración: {service.duration_minutes} min\n"
            f"💲 Inversión: ${service.price} USD\n\n"
            f"👇 Toca abajo para ver disponibilidad:",
            reply_markup=builder.as_markup(),
            parse_mode="Markdown"
        )

@router.callback_query(F.data.startswith("view_slots_"))
async def show_slots(callback: types.CallbackQuery):
    service_id = int(callback.data.split("_")[2])
    
    async with AsyncSessionLocal() as session:
        # Buscar slots futuros y libres
        result = await session.execute(
            select(CallSlot)
            .where(
                CallSlot.service_id == service_id,
                CallSlot.is_booked == False,
                CallSlot.start_time > datetime.utcnow()
            )
            .order_by(CallSlot.start_time)
            .limit(10)
        )
        slots = result.scalars().all()
        
        if not slots:
            await callback.message.edit_text("🚫 No hay horarios disponibles por el momento.", reply_markup=None)
            return

        builder = InlineKeyboardBuilder()
        for slot in slots:
            # Format: "Lun 15 - 10:00"
            date_str = slot.start_time.strftime("%d/%m %H:%M")
            builder.button(text=date_str, callback_data=f"book_slot_{slot.id}")
        
        builder.adjust(2) # 2 columnas
        builder.button(text="🔙 Cancelar", callback_data="cancel_booking")
        
        await callback.message.edit_text(
            "📅 **Selecciona un horario:**\n\n"
            "Los horarios están en UTC (Hora Universal).",
            reply_markup=builder.as_markup(),
            parse_mode="Markdown"
        )

@router.callback_query(F.data.startswith("book_slot_"))
async def init_booking(callback: types.CallbackQuery):
    slot_id = int(callback.data.split("_")[2])
    
    # Aquí iría la integración de pagos real.
    # Para MVP: Simulamos que genera un link de pago o instrucción.
    
    # Marcamos como "Reservado/Pendiente" o pedimos confirmar?
    # Vamos a SIMULAR el pago exitoso directo para probar el flujo Jitsi.
    
    async with AsyncSessionLocal() as session:
        slot = await session.get(CallSlot, slot_id)
        if not slot or slot.is_booked:
            await callback.answer("🚫 Ese horario ya fue ocupado.", show_alert=True)
            return
        
        # --- MOCK PAYMENT ---
        # En prod: Enviar Invoice de Telegram Payments o Link Stripe
        
        # Generar Link Jitsi
        import uuid
        room_id = f"TeleGate-{uuid.uuid4()}"
        jitsi_link = f"https://meet.jit.si/{room_id}"
        
        slot.is_booked = True
        slot.booked_by_id = None # Tendríamos que buscar el User por Telegram ID
        slot.jitsi_link = jitsi_link
        
        # Vincular usuario si existe
        user_res = await session.execute(select(User).where(User.telegram_id == callback.from_user.id))
        user = user_res.scalar_one_or_none()
        if user:
            slot.booked_by_id = user.id
            
        await session.commit()
        
        await callback.message.edit_text(
            f"✅ **¡Reserva Confirmada!**\n\n"
            f"🗓 Fecha: {slot.start_time.strftime('%Y-%m-%d %H:%M')} UTC\n"
            f"🔗 **Tu Enlace de Acceso:**\n{jitsi_link}\n\n"
            f"Guarda este mensaje.",
            parse_mode="Markdown"
        )
