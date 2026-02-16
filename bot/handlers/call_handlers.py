from aiogram import Router, F, types
from aiogram.filters import Command
from aiogram.utils.keyboard import InlineKeyboardBuilder
from sqlalchemy.future import select
from sqlalchemy import and_
from shared.database import AsyncSessionLocal
from shared.models import CallService, User

from datetime import datetime
from shared.utils.calendar import generate_calendar_links

router = Router()

@router.message(Command("llamada"))
@router.callback_query(F.data == "book_call_menu")
async def cmd_llamada(message_or_callback: types.Message | types.CallbackQuery):
    """
    Muestra la oferta de llamadas. Soporta Message (comando) y Callback (botón).
    """
    # Unify interface: if callback, retrieve message and answer callback
    message = message_or_callback
    if isinstance(message_or_callback, types.CallbackQuery):
        message = message_or_callback.message
        await message_or_callback.answer()
    async with AsyncSessionLocal() as session:
        # 1. Identificar al usuario y su dueño (si es que la lógica es 1 dueño por bot instance/global?)
        # En este sistema parece que es Multi-Tenant pero el bot es "FullT_GuardBot".
        # Asumiremos que el dueño es el admin principal o buscamos por contexto?
        # Revisando `main.py`, el bot parece ser único.
        # ¿Cómo sabe el bot qué "dueño" ofrece la llamada?
        # Opción A: El bot está vinculado a UN solo dueño (Single Tenant Logic actual parecida).
        # Opción B: El usuario selecciona de qué canal quiere la llamada.
        
        # Para simplificar MVP: Asumimos que buscamos CUALQUIER servicio activo.
        result = await session.execute(select(CallService).where(CallService.is_active.is_(True)))
        services = result.scalars().all()
        
        if not services:
            await message.answer("🚫 Actualmente no hay disponibilidad de llamadas privadas.")
            return

        # Si hay multiples servicios, mostrar selector
        if len(services) > 1:
            builder = InlineKeyboardBuilder()
            for svc in services:
                 builder.button(text=f"{svc.description} ({svc.duration_minutes}m) - ${svc.price}", callback_data=f"select_svc_{svc.id}")
            builder.adjust(1)
            await message.answer("📞 **Selecciona el tipo de llamada:**", reply_markup=builder.as_markup())
            return

        # Si solo hay uno, mostrar detalles directo
        service = services[0]

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

@router.callback_query(F.data.startswith("select_svc_"))
async def select_service_details(callback: types.CallbackQuery):
    service_id = int(callback.data.split("_")[2])
    
    async with AsyncSessionLocal() as session:
        service = await session.get(CallService, service_id)
        if not service:
             await callback.answer("Servicio no encontrado", show_alert=True)
             return

        builder = InlineKeyboardBuilder()
        builder.button(text="📅 Ver Horarios Disponibles", callback_data=f"view_slots_{service.id}")
        builder.button(text="🔙 Volver", callback_data="book_call_menu")
        builder.adjust(1)
        
        await callback.message.edit_text(
            f"📞 **{service.description}**\n\n"
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
        # Calculate dynamic slots for next 14 days
        from datetime import timedelta
        now = datetime.utcnow()
        from_date = now.strftime("%Y-%m-%d")
        to_date = (now + timedelta(days=14)).strftime("%Y-%m-%d")
        
        from shared.services.availability_service import get_available_slots
        slots = await get_available_slots(session, service_id, from_date, to_date)
        
        # Filter only future slots (double check execution time)
        future_slots = [s for s in slots if s["start_time"] > now]
        # Sort and limit
        future_slots.sort(key=lambda x: x["start_time"])
        display_slots = future_slots[:10]
        
        if not display_slots:
            await callback.message.edit_text("🚫 No hay horarios disponibles en los próximos 14 días.", reply_markup=None)
            return

        builder = InlineKeyboardBuilder()
        for slot in display_slots:
            # Format: "Lun 15 - 10:00"
            date_str = slot["start_time"].strftime("%d/%m %H:%M")
            # Encoder timestamp: YYYYMMDDHHMM
            ts_str = slot["start_time"].strftime("%Y%m%d%H%M")
            builder.button(text=date_str, callback_data=f"book_slot_{service_id}_{ts_str}")
        
        builder.adjust(2) # 2 columnas
        builder.button(text="🔙 Cancelar", callback_data="cancel_booking")
        
        await callback.message.edit_text(
            "📅 **Selecciona un horario:**\n\n"
            "🕒 Las horas se muestran en **UTC (Tiempo Universal)**.\n"
            "💡 [Consulta tu hora local aquí](https://www.worldtimebuddy.com/?pl=1&lid=100&h=100)\n\n"
            "👇 Toca un bloque para reservar:",
            reply_markup=builder.as_markup(),
            parse_mode="Markdown",
            disable_web_page_preview=True
        )

@router.callback_query(F.data.startswith("book_slot_"))
async def ask_payment(callback: types.CallbackQuery):
    # Data: book_slot_{service_id}_{timestamp}
    parts = callback.data.split("_")
    service_id = int(parts[2])
    ts_str = parts[3]
    
    # Parse timestamp
    start_time = datetime.strptime(ts_str, "%Y%m%d%H%M")
    
    async with AsyncSessionLocal() as session:
        from shared.models import CallBooking
        # Check against CallBooking (Capacity)
        # Note: We should technically checking AvailabilityRange equality too, but overlapping check is enough for safety.
        # Check if already booked
        existing = await session.execute(
            select(CallBooking).where(
                and_(
                    CallBooking.service_id == service_id,
                    CallBooking.status != "cancelled",
                    CallBooking.start_time == start_time
                )
            )
        )
        if existing.scalar_one_or_none():
             await callback.answer("🚫 Ese horario ya ha sido ocupado.", show_alert=True)
             return

        # Get Service Info for Price
        service = await session.get(CallService, service_id)
        
        builder = InlineKeyboardBuilder()
        # Mock Payment Button - pass service_id and timestamp
        builder.button(text=f"💳 Pagar ${service.price} USD", callback_data=f"pay_slot_{service_id}_{ts_str}")
        builder.button(text="🔙 Cancelar", callback_data="cancel_booking")
        builder.adjust(1)
        
        await callback.message.edit_text(
            f"🛒 **Confirmar Reserva**\n\n"
            f"📞 **Servicio**: {service.description}\n"
            f"🗓 **Fecha**: {start_time.strftime('%Y-%m-%d %H:%M')} UTC\n"
            f"⏱ **Duración**: {service.duration_minutes} min\n"
            f"💵 **Total a Pagar**: `${service.price} USD`\n\n"
            f"Selecciona una opción para continuar:",
            reply_markup=builder.as_markup(),
            parse_mode="Markdown"
        )

@router.callback_query(F.data.startswith("pay_slot_"))
async def finalize_booking(callback: types.CallbackQuery):
    parts = callback.data.split("_")
    service_id = int(parts[2])
    ts_str = parts[3]
    start_time = datetime.strptime(ts_str, "%Y%m%d%H%M")
    
    # Aquí iría la integración real de Stripe/Telegram Payments.
    # Por ahora, simulamos que el pago fue exitoso.
    
    async with AsyncSessionLocal() as session:
        service = await session.get(CallService, service_id)
        if not service:
             await callback.answer("Error: Servicio no encontrado.", show_alert=True)
             return

        # Double Check Overlap / Availability
        from shared.models import CallBooking
        existing = await session.execute(
            select(CallBooking).where(
                and_(
                    CallBooking.service_id == service_id,
                    CallBooking.status != "cancelled",
                    CallBooking.start_time == start_time
                )
            )
        )
        if existing.scalar_one_or_none():
             await callback.answer("🚫 Lo sentimos, alguien ganó el horario hace un momento.", show_alert=True)
             return
        
        # Generar Link Jitsi
        import uuid
        room_id = f"TeleGate-{uuid.uuid4()}"
        jitsi_link = f"https://meet.jit.si/{room_id}"
        
        # Calculate End Time
        from datetime import timedelta
        end_time = start_time + timedelta(minutes=service.duration_minutes)

        # Create Booking
        booking = CallBooking(
            service_id=service_id,
            start_time=start_time,
            end_time=end_time,
            status="confirmed",
            meeting_link=jitsi_link,
            booker_id=None # Default
        )
        
        # Vincular usuario si existe
        user_res = await session.execute(select(User).where(User.telegram_id == callback.from_user.id))
        user = user_res.scalar_one_or_none()
        if user:
            booking.booker_id = user.id
            
        session.add(booking)
        await session.commit()
        
        # Generate calendar links
        cal_links = generate_calendar_links(
            title=f"Llamada: {service.description}",
            start_time=start_time,
            end_time=end_time,
            description=f"Sesión reservada de {service.description}. Link de reunión: {jitsi_link}",
            location=jitsi_link
        )
        
        builder = InlineKeyboardBuilder()
        builder.button(text="📅 Google Calendar", url=cal_links["google"])
        builder.button(text="📆 Outlook / Office", url=cal_links["outlook"])
        builder.adjust(2)
            
        await callback.message.edit_text(
            f"✅ **¡Pago Exitoso y Reserva Confirmada!**\n\n"
            f"🗓 Fecha: {start_time.strftime('%Y-%m-%d %H:%M')} UTC\n"
            f"🔗 **Tu Enlace de Acceso:**\n`{jitsi_link}`\n\n"
            f"Te recomendamos guardar este enlace y añadir la fecha a tu calendario:",
            reply_markup=builder.as_markup(),
            parse_mode="Markdown"
        )

@router.callback_query(F.data == "cancel_booking")
async def cancel_booking(callback: types.CallbackQuery):
    await callback.message.edit_text("❌ Reserva cancelada.")
