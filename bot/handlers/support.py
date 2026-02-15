from aiogram import Router, types, F
from aiogram.filters import Command, CommandObject
from aiogram.utils.keyboard import InlineKeyboardBuilder
from shared.database import AsyncSessionLocal
from shared.models import SupportTicket, TicketMessage
from bot.handlers.initial import get_or_create_user

router = Router()

@router.message(Command("soporte"))
async def cmd_support(message: types.Message, command: CommandObject):
    args = command.args
    if not args:
        await message.answer(
            "🛠 **Centro de Soporte**\n\n"
            "Para abrir un ticket de soporte, usa el comando seguido de tu mensaje:\n"
            "Ej: `/soporte No he recibido mi link de acceso`",
            parse_mode="Markdown",
        )
        return

    builder = InlineKeyboardBuilder()
    builder.row(
        types.InlineKeyboardButton(
            text="✅ Confirmar Envío", callback_data="ticket_confirm"
        ),
        types.InlineKeyboardButton(text="❌ Cancelar", callback_data="ticket_cancel"),
    )

    await message.answer(
        "📝 **Resumen del Ticket**\n\n"
        f"**Contenido**: {args}\n\n"
        "¿Deseas enviar este mensaje a nuestro equipo técnico?",
        reply_markup=builder.as_markup(),
        parse_mode="Markdown",
    )

@router.callback_query(F.data == "support_help")
async def support_help_callback(callback: types.CallbackQuery):
    await callback.message.edit_text(
        "🛠 **Centro de Soporte**\n\n"
        "Para abrir un ticket de soporte, usa el comando `/soporte` seguido de tu mensaje:\n"
        "Ej: `/soporte No puedo ver mi canal`",
        parse_mode="Markdown"
    )

@router.callback_query(F.data == "ticket_confirm")
async def handle_confirm_ticket(callback: types.CallbackQuery):
    try:
        content = callback.message.text.split("**Contenido**: ")[1].split("\n\n")[0]
    except IndexError:
        await callback.message.edit_text("❌ Error al procesar el ticket. Intenta de nuevo.")
        return

    async with AsyncSessionLocal() as session:
        user = await get_or_create_user(callback.from_user, session)

        new_ticket = SupportTicket(
            user_id=user.id, subject="Ticket desde Bot", priority="normal"
        )
        session.add(new_ticket)
        await session.flush()

        initial_msg = TicketMessage(
            ticket_id=new_ticket.id, sender_id=user.id, content=content
        )
        session.add(initial_msg)
        await session.commit()

        await callback.message.edit_text(
            f"✅ **Ticket #{new_ticket.id} Creado**\n\n"
            "Nuestro equipo revisará tu solicitud y te responderemos por este mismo chat en breve.",
            parse_mode="Markdown",
        )

@router.callback_query(F.data == "ticket_cancel")
async def handle_cancel_ticket(callback: types.CallbackQuery):
    await callback.message.edit_text("❌ Envío cancelado.")
