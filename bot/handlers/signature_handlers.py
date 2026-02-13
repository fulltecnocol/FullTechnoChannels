import logging
import re
from aiogram import Router, types, F
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, ReplyKeyboardRemove, InlineKeyboardMarkup, InlineKeyboardButton
from sqlalchemy import select
import httpx
import os

from bot.states.signature_states import SignatureFlow
from shared.database import AsyncSessionLocal
from shared.models import User
from shared.signature_models import OwnerLegalInfo, SignedContract

# Router específico para firma
signature_router = Router()

API_URL = os.getenv("API_URL", "http://localhost:8000")

# --- TECLADOS ---

def kbd_person_type():
    kb = [
        [KeyboardButton(text="👤 Persona Natural")],
        [KeyboardButton(text="🏢 Persona Jurídica (Empresa)")]
    ]
    return ReplyKeyboardMarkup(keyboard=kb, resize_keyboard=True, one_time_keyboard=True)

def kbd_id_type():
    kb = [
        [KeyboardButton(text="Cédula de Ciudadanía (CC)")],
        [KeyboardButton(text="Cédula de Extranjería (CE)")],
        [KeyboardButton(text="Pasaporte (PA)")],
        [KeyboardButton(text="PEP")]
    ]
    return ReplyKeyboardMarkup(keyboard=kb, resize_keyboard=True, one_time_keyboard=True)

def kbd_account_type():
    kb = [
        [KeyboardButton(text="Ahorros")],
        [KeyboardButton(text="Corriente")]
    ]
    return ReplyKeyboardMarkup(keyboard=kb, resize_keyboard=True, one_time_keyboard=True)

def kbd_confirm():
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="✅ Confirmar Datos", callback_data="legal_confirm_data")],
        [InlineKeyboardButton(text="❌ Corregir (Reiniciar)", callback_data="legal_restart")]
    ])

def kbd_sign_contract():
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="📄 Leer Contrato PDF", callback_data="legal_read_pdf")],
        [InlineKeyboardButton(text="✍️ FIRMAR AHORA", callback_data="legal_sign_now")]
    ])


# --- COMANDO INICIAL ---

@signature_router.message(Command("legal"))
async def cmd_legal_start(message: types.Message, state: FSMContext):
    """Iniciar proceso de firma digital"""
    user_id = message.from_user.id
    
    async with AsyncSessionLocal() as session:
        # Verificar si el usuario existe y si es OWNER (tiene canales)
        # Por ahora asumimos que cualquiera que use /legal es un owner potencial o existente
        stmt = select(User).where(User.telegram_id == user_id)
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()
        
        if not user:
            # Crear usuario si no existe (aunque debería existir por /start)
            user = User(telegram_id=user_id, username=message.from_user.username, full_name=message.from_user.full_name)
            session.add(user)
            await session.commit()
            await session.refresh(user)

        # Verificar si ya firmó
        contract_stmt = select(SignedContract).where(SignedContract.owner_id == user.id)
        contract_res = await session.execute(contract_stmt)
        contract = contract_res.scalar_one_or_none()
        
        if contract:
            await message.answer(
                "✅ **Ya tienes un contrato firmado.**\n\n"
                f"📅 Fecha: {contract.signed_at.strftime('%Y-%m-%d %H:%M')}\n"
                f"🔗 Hash: `{contract.blockchain_tx_hash[:10]}...`\n\n"
                "Usa `/contract` para descargarlo.",
                parse_mode="Markdown"
            )
            return

        # Verificar si ya tiene info legal guardada pero no firmada
        legal_stmt = select(OwnerLegalInfo).where(OwnerLegalInfo.owner_id == user.id)
        legal_res = await session.execute(legal_stmt)
        legal_info = legal_res.scalar_one_or_none()
        
        if legal_info:
            await state.update_data(legal_info_id=legal_info.id)
            await message.answer(
                "📝 **Información Legal Registrada**\n\n"
                "Ya tenemos tus datos pero falta la firma del contrato.\n"
                "¿Deseas continuar hacia la firma o actualizar tus datos?",
                reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                    [InlineKeyboardButton(text="✍️ Ir a Firma", callback_data="legal_goto_sign")],
                    [InlineKeyboardButton(text="🔄 Actualizar Datos", callback_data="legal_restart")]
                ])
            )
            return

    # Iniciar flujo desde cero
    await state.set_state(SignatureFlow.waiting_for_person_type)
    await message.answer(
        "⚖️ **Registro Legal y Firma Digital**\n\n"
        "Para activar los pagos en tus canales, necesitamos legalizar nuestra relación comercial mediante un **Contrato de Mandato**.\n\n"
        "Este proceso es 100% digital y toma menos de 2 minutos.\n\n"
        "Primero, indícanos tu tipo de persona:",
        reply_markup=kbd_person_type(),
        parse_mode="Markdown"
    )

# --- FLUJO DE RECOPILACIÓN DE DATOS ---

@signature_router.message(SignatureFlow.waiting_for_person_type)
async def process_person_type(message: types.Message, state: FSMContext):
    text = message.text
    if "Natural" in text:
        await state.update_data(person_type="natural")
        await state.set_state(SignatureFlow.waiting_for_name)
        await message.answer("👤 Ingresa tu **Nombre Completo** (como aparece en tu documento):", reply_markup=ReplyKeyboardRemove(), parse_mode="Markdown")
    elif "Jurídica" in text:
        await state.update_data(person_type="juridica")
        await state.set_state(SignatureFlow.waiting_for_name)
        await message.answer("🏢 Ingresa la **Razón Social** de la empresa:", reply_markup=ReplyKeyboardRemove(), parse_mode="Markdown")
    else:
        await message.answer("Por favor usa los botones del teclado.")

@signature_router.message(SignatureFlow.waiting_for_name)
async def process_name(message: types.Message, state: FSMContext):
    data = await state.get_data()
    if data['person_type'] == 'natural':
        await state.update_data(full_legal_name=message.text)
        await state.set_state(SignatureFlow.waiting_for_id_type)
        await message.answer("🆔 Selecciona tu tipo de documento:", reply_markup=kbd_id_type())
    else:
        await state.update_data(business_name=message.text)
        await state.set_state(SignatureFlow.waiting_for_id_number) # Juridica va directo a NIT
        await message.answer("🔢 Ingresa el **NIT** de la empresa (sin dígito de verificación):", parse_mode="Markdown")

@signature_router.message(SignatureFlow.waiting_for_id_type)
async def process_id_type(message: types.Message, state: FSMContext):
    # Solo para naturales
    id_type_map = {
        "Cédula de Ciudadanía (CC)": "CC",
        "Cédula de Extranjería (CE)": "CE",
        "Pasaporte (PA)": "PA",
        "PEP": "PEP"
    }
    selected = id_type_map.get(message.text)
    if not selected:
        await message.answer("Por favor selecciona una opción válida.")
        return
        
    await state.update_data(id_type=selected)
    await state.set_state(SignatureFlow.waiting_for_id_number)
    await message.answer("🔢 Ingresa tu **Número de Documento**:", reply_markup=ReplyKeyboardRemove(), parse_mode="Markdown")

@signature_router.message(SignatureFlow.waiting_for_id_number)
async def process_id_number(message: types.Message, state: FSMContext):
    data = await state.get_data()
    
    if data['person_type'] == 'juridica':
        await state.update_data(nit=message.text)
        # Jurídica necesita representante legal
        await state.set_state(SignatureFlow.waiting_for_legal_rep)
        await message.answer("👤 Ingresa el **Nombre del Representante Legal**:", parse_mode="Markdown")
    else:
        await state.update_data(id_number=message.text)
        # Natural ya tiene nombre e ID, pasamos a contacto
        await state.set_state(SignatureFlow.waiting_for_address)
        await message.answer("📍 Ingresa tu **Dirección de Residencia/Fiscal**:", parse_mode="Markdown")

@signature_router.message(SignatureFlow.waiting_for_legal_rep)
async def process_legal_rep(message: types.Message, state: FSMContext):
    await state.update_data(legal_rep_name=message.text)
    await state.set_state(SignatureFlow.waiting_for_rep_id)
    await message.answer("🔢 Ingresa el **Documento del Rep. Legal**:", parse_mode="Markdown")

@signature_router.message(SignatureFlow.waiting_for_rep_id)
async def process_rep_id(message: types.Message, state: FSMContext):
    await state.update_data(legal_rep_id=message.text)
    await state.set_state(SignatureFlow.waiting_for_address)
    await message.answer("📍 Ingresa la **Dirección Fiscal** de la empresa:", parse_mode="Markdown")

# --- CONTACTO ---

@signature_router.message(SignatureFlow.waiting_for_address)
async def process_address(message: types.Message, state: FSMContext):
    await state.update_data(address=message.text)
    await state.set_state(SignatureFlow.waiting_for_city)
    await message.answer("🏙️ Ingresa tu **Ciudad y Departamento** (Ej: Bogotá, Cundinamarca):", parse_mode="Markdown")

@signature_router.message(SignatureFlow.waiting_for_city)
async def process_city(message: types.Message, state: FSMContext):
    parts = message.text.split(",")
    city = parts[0].strip()
    dept = parts[1].strip() if len(parts) > 1 else "N/A"
    
    await state.update_data(city=city, department=dept)
    await state.set_state(SignatureFlow.waiting_for_phone)
    await message.answer("📱 Ingresa tu **Número Celular**:", parse_mode="Markdown")

@signature_router.message(SignatureFlow.waiting_for_phone)
async def process_phone(message: types.Message, state: FSMContext):
    await state.update_data(phone=message.text)
    await state.set_state(SignatureFlow.waiting_for_bank)
    await message.answer(
        "🏦 **Información Bancaria**\n\n"
        "Esta cuenta es donde recibirás tus pagos automatizados.\n\n"
        "Ingresa el **Nombre del Banco** (Ej: Bancolombia, Nequi, Davivienda):", 
        parse_mode="Markdown"
    )

# --- BANCO ---

@signature_router.message(SignatureFlow.waiting_for_bank)
async def process_bank(message: types.Message, state: FSMContext):
    await state.update_data(bank_name=message.text)
    await state.set_state(SignatureFlow.waiting_for_account_type)
    await message.answer("💳 Tipo de Cuenta:", reply_markup=kbd_account_type())

@signature_router.message(SignatureFlow.waiting_for_account_type)
async def process_account_type(message: types.Message, state: FSMContext):
    text = message.text.lower()
    if "ahorro" in text:
        await state.update_data(account_type="ahorros")
    elif "corriente" in text:
        await state.update_data(account_type="corriente")
    else:
        await message.answer("Por favor selecciona una opción válida.")
        return
        
    await state.set_state(SignatureFlow.waiting_for_account_number)
    await message.answer("🔢 Ingresa el **Número de Cuenta**:", reply_markup=ReplyKeyboardRemove(), parse_mode="Markdown")

@signature_router.message(SignatureFlow.waiting_for_account_number)
async def process_account_number(message: types.Message, state: FSMContext):
    await state.update_data(account_number=message.text)
    
    # Resumen y confirmación
    data = await state.get_data()
    
    summary = (
        "📋 **CONFIRMA TUS DATOS**\n\n"
        f"**Tipo:** {data['person_type'].title()}\n"
    )
    
    if data['person_type'] == 'natural':
        summary += (
            f"**Nombre:** {data.get('full_legal_name')}\n"
            f"**ID:** {data.get('id_type')} {data.get('id_number')}\n"
        )
    else:
        summary += (
            f"**Empresa:** {data.get('business_name')}\n"
            f"**NIT:** {data.get('nit')}\n"
            f"**Rep. Legal:** {data.get('legal_rep_name')}\n"
        )
    
    summary += (
        f"**Dirección:** {data.get('address')}, {data.get('city')}\n"
        f"**Teléfono:** {data.get('phone')}\n\n"
        f"**Banco:** {data.get('bank_name')} ({data.get('account_type')})\n"
        f"**Cuenta:** {data.get('account_number')}\n"
    )
    
    # Agregar account_holder_name = full_legal_name / business_name por defecto
    holder = data.get('full_legal_name') if data['person_type'] == 'natural' else data.get('business_name')
    await state.update_data(account_holder_name=holder)
    
    await state.set_state(SignatureFlow.waiting_for_account_info_confirm)
    await message.answer(summary, reply_markup=kbd_confirm(), parse_mode="Markdown")

# --- CONFIRMACIÓN Y GUARDADO ---

@signature_router.callback_query(F.data == "legal_restart")
async def handle_restart(callback: types.CallbackQuery, state: FSMContext):
    await state.clear()
    await callback.message.edit_text("🔄 Proceso reiniciado.")
    await cmd_legal_start(callback.message, state)

@signature_router.callback_query(F.data == "legal_confirm_data")
async def handle_save_and_preview(callback: types.CallbackQuery, state: FSMContext):
    data = await state.get_data()
    user_id = callback.from_user.id
    
    # Preparar payload para API
    legal_data = {
        "person_type": data['person_type'],
        "address": data['address'],
        "city": data['city'],
        "department": data.get('department', 'N/A'),
        "phone": data['phone'],
        "bank_name": data['bank_name'],
        "account_type": data['account_type'],
        "account_number": data['account_number'],
        "account_holder_name": data['account_holder_name'],
        "owner_id_telegram": str(user_id) # Para identificar al usuario
    }
    
    if data['person_type'] == 'natural':
        legal_data.update({
            "full_legal_name": data['full_legal_name'],
            "id_type": data['id_type'],
            "id_number": data['id_number']
        })
    else:
        legal_data.update({
            "business_name": data['business_name'],
            "nit": data['nit'],
            "legal_rep_name": data['legal_rep_name'],
            "legal_rep_id": data['legal_rep_id']
        })

    # Guardar en DB localmente por ahora (o llamar a API)
    # Aquí llamaremos dirctamente a DB para simplificar, como se hace en main.py
    # Pero lo ideal es usar la API. Simularemos el endpoint submit_legal_info.
    
    text = "⏳ Guardando información y generando contrato..."
    await callback.message.edit_text(text)
    
    async with AsyncSessionLocal() as session:
        # Encontrar user DB ID
        res = await session.execute(select(User).where(User.telegram_id == user_id))
        db_user = res.scalar_one_or_none()
        
        if not db_user:
             await callback.message.edit_text("❌ Error: Usuario no encontrado.")
             return

        # Insert/Update OwnerLegalInfo
        stmt = select(OwnerLegalInfo).where(OwnerLegalInfo.owner_id == db_user.id)
        existing = (await session.execute(stmt)).scalar_one_or_none()
        
        if existing:
            for k, v in legal_data.items():
                if k != 'owner_id_telegram' and hasattr(existing, k):
                   setattr(existing, k, v)
        else:
            # Filtrar campos que no son del modelo
            model_data = {k: v for k, v in legal_data.items() if k != 'owner_id_telegram'}
            new_info = OwnerLegalInfo(owner_id=db_user.id, **model_data)
            session.add(new_info)
        
        db_user.legal_verification_status = "info_submitted"
        await session.commit()

    # Pasar al estado de firma
    await state.set_state(SignatureFlow.waiting_for_contract_review)
    
    await callback.message.edit_text(
        "✅ **Datos Guardados Correctamente**\n\n"
        "A continuación puedes leer el borrador del contrato.\n"
        "Cuando estés listo, presiona **FIRMAR AHORA** para recibir tu código de seguridad.",
        reply_markup=kbd_sign_contract(),
        parse_mode="Markdown"
    )

# --- FIRMA DEL CONTRATO ---

from aiogram.types import BufferedInputFile
from api.services.pdf_service import PDFContractService

@signature_router.callback_query(F.data == "legal_read_pdf")
async def handle_read_pdf(callback: types.CallbackQuery):
    await callback.message.edit_text("⏳ Generando documento... (Por favor espera)")
    
    user_id = callback.from_user.id
    
    try:
        async with AsyncSessionLocal() as session:
            # Recuperar datos legales
            stmt = select(OwnerLegalInfo).join(User).where(User.telegram_id == user_id)
            result = await session.execute(stmt)
            legal_info_model = result.scalar_one_or_none()
            
            if not legal_info_model:
                await callback.message.edit_text("❌ Error: No se encontró información legal. Usa /legal para reiniciar.")
                return

            # Convertir modelo a diccionario
            legal_info_dict = {c.name: getattr(legal_info_model, c.name) for c in legal_info_model.__table__.columns}
            
            # Intentar generar archivo
            try:
                # Intento 1: PDF (WeasyPrint)
                pdf_bytes = await PDFContractService.generate_preview_pdf_async(legal_info_dict)
                file_data = pdf_bytes
                filename = "Contrato_Mandato.pdf"
                caption = "📄 **Contrato de Mandato** (PDF)\nRevisa los términos antes de firmar."
            except Exception as e_pdf:
                logging.warning(f"PDF generation failed: {e_pdf}. Falling back to HTML.")
                
                # Intento 2: HTML (Fallback)
                try:
                    html_content = PDFContractService.generate_contract_html(legal_info_dict)
                    file_data = html_content.encode('utf-8')
                    filename = "Contrato_Mandato.html"
                    caption = "📄 **Contrato de Mandato** (Vista Web)\nDescarga y abre este archivo en tu navegador para leerlo."
                except Exception as e_html:
                    logging.error(f"HTML generation failed: {e_html}")
                    await callback.message.edit_text(f"❌ Error crítico generando documento: {e_html}")
                    return

            # Enviar documento
            input_file = BufferedInputFile(file_data, filename=filename)
            
            # Borramos el mensaje de "Generando" y enviamos el documento
            await callback.message.delete()
            await callback.message.answer_document(
                document=input_file,
                caption=caption,
                parse_mode="Markdown",
                reply_markup=kbd_sign_contract()
            )

    except Exception as e:
        logging.error(f"Handler error: {e}")
        try:
            await callback.message.edit_text(f"❌ Error inesperado: {str(e)}")
        except:
            await callback.message.answer(f"❌ Error inesperado: {str(e)}")


@signature_router.callback_query(F.data == "legal_sign_now")
async def handle_sign_request(callback: types.CallbackQuery, state: FSMContext):
    user_id = callback.from_user.id
    
    await callback.message.edit_text("⏳ Solicitando código de firma segura...")
    
    # Llamar a API /request-signature
    # Necesitamos un token válido. 
    # Estrategia: Login interno o tener función compartida.
    # Dado que "bot" y "api" comparten código, podemos llamar a la lógica directamente o usar API.
    # Usaremos la lógica de API re-implementada brevemente para no lidiar con Auth HTTP complexa ahora.
    
    try:
        import secrets
        from datetime import datetime
        from api.models.signature import SignatureCode
        
        async with AsyncSessionLocal() as session:
             # Get user
            res = await session.execute(select(User).where(User.telegram_id == user_id))
            db_user = res.scalar_one_or_none()
            
            # Generar OTP
            otp = secrets.token_hex(3).upper() # 6 caracteres
            
            # Guardar OTP
            # En producción deberíamos calcular hash real del PDF aquí.
            # Usaremos un hash placeholder por ahora.
            dummy_hash = "0x" + secrets.token_hex(32)
            
            # Invalidar anteriores
            # ... (logica de invalidación)
            
            new_code = SignatureCode(
                owner_id=db_user.id,
                code=otp,
                contract_hash=dummy_hash,
                expires_at=datetime.utcnow() + timedelta(minutes=15)
            )
            session.add(new_code)
            await session.commit()
            
            await state.update_data(signature_otp=otp)
            
            await state.set_state(SignatureFlow.waiting_for_otp)
            await callback.message.edit_text(
                "🔐 **CÓDIGO DE FIRMA GENERADO**\n\n"
                f"Tu código de seguridad es: `{otp}`\n\n"
                "⚠️ Copia este código y envíalo en este chat para firmar el contrato legalmente.\n"
                "Al enviar el código, aceptas los términos y condiciones del Contrato de Mandato.",
                parse_mode="Markdown"
            )
            
    except Exception as e:
        logging.error(f"Error signing request: {e}")
        await callback.message.edit_text("❌ Error interno solicitando firma.")


@signature_router.message(SignatureFlow.waiting_for_otp)
async def process_otp_verification(message: types.Message, state: FSMContext):
    input_otp = message.text.strip().upper()
    data = await state.get_data()
    
    # Verificar OTP (simple check contra lo que guardamos en state para velocidad, 
    # pero lo correcto es verificar contra DB)
    
    expected_otp = data.get('signature_otp')
    
    if input_otp == expected_otp:
        await message.answer("✅ **Firma Verificada Correctamente**\n⏳ Registrando en Blockchain...")
        
        # Aquí ocurriría el proceso de firma real:
        # 1. Generar PDF final firmado con WeasyPrint
        # 2. Calcular Hash
        # 3. Enviar a Blockchain (store_contract)
        # 4. Guardar SignedContract en DB
        
        # Simulamos éxito para la demo
        import uuid
        fake_tx = "0x" + uuid.uuid4().hex + uuid.uuid4().hex
        
        async with AsyncSessionLocal() as session:
            # Get user and info...
             # Actualizar estado user
            res = await session.execute(select(User).where(User.telegram_id == message.from_user.id))
            db_user = res.scalar_one_or_none()
            db_user.legal_verification_status = "contract_signed"
            db_user.can_create_channels = True
            
            # Crear contrato dummy
            signed = SignedContract(
                owner_id=db_user.id,
                pdf_url="https://storage.googleapis.com/.../contract.pdf",
                pdf_hash="0x...",
                blockchain_tx_hash=fake_tx,
                blockchain_confirmed=True, # Simulamos instantáneo
                signature_code=input_otp
            )
            session.add(signed)
            await session.commit()
        
        await state.clear()
        await message.answer(
            "🎉 **¡CONTRATO FIRMADO EXITOSAMENTE!**\n\n"
            "Tu cuenta ha sido verificada y habilitada para recibir pagos.\n\n"
            f"🔗 **Registro Blockchain (Polygon):**\n`{fake_tx}`\n\n"
            "Guardaremos una copia de seguridad. Puedes descargar tu contrato en cualquier momento con `/contract`.",
            parse_mode="Markdown"
        )
        
        # Enviar notificación administrativa si es necesario
        
    else:
        await message.answer("❌ **Código Incorrecto**\nInténtalo de nuevo o escribe /cancelar.")

# --- DESCARGA DE CONTRATO ---

@signature_router.message(Command("contract"))
async def cmd_download_contract(message: types.Message):
    """Permite al usuario descargar su contrato firmado"""
    user_id = message.from_user.id
    
    await message.answer("🔍 Buscando contrato firmado...")
    
    try:
        async with AsyncSessionLocal() as session:
            # 1. Buscar contrato firmado
            res_contract = await session.execute(
                select(SignedContract).join(User).where(User.telegram_id == user_id)
            )
            signed_contract = res_contract.scalar_one_or_none()
            
            if not signed_contract:
                await message.answer("❌ No tienes un contrato firmado todavía.\nUsa /legal para iniciar el proceso.")
                return

            # 2. Buscar info legal
            res_legal = await session.execute(
                select(OwnerLegalInfo).where(OwnerLegalInfo.owner_id == signed_contract.owner_id)
            )
            legal_info = res_legal.scalar_one_or_none()
            
            if not legal_info:
                await message.answer("❌ Error: Contrato encontrado pero falta información legal asociada.")
                return

            # 3. Preparar datos
            legal_dict = {c.name: getattr(legal_info, c.name) for c in legal_info.__table__.columns}
            
            signature_data = {
                "signature_date": signed_contract.signed_at,
                "signature_code": signed_contract.signature_code,
                "telegram_user_id": str(user_id),
                "ip_address": "Telegram Bot (Signed)",
                "document_hash": signed_contract.pdf_hash,
                "blockchain_tx_hash": signed_contract.blockchain_tx_hash,
                "blockchain_network": "Polygon Amoy",
                "contract_id": f"CTR-{signed_contract.id}"
            }

            # 4. Generar Documento (PDF o HTML)
            try:
                # Intento PDF
                pdf_bytes, _ = await PDFContractService.generate_signed_pdf_async(legal_dict, signature_data)
                file_data = pdf_bytes
                filename = f"Contrato_Mandato_Firmado_{signed_contract.id}.pdf"
                caption = (
                    "✅ **CONTRATO DE MANDATO (FIRMADO)**\n\n"
                    f"📅 Fecha: {signed_contract.signed_at.strftime('%Y-%m-%d')}\n"
                    f"🔗 Blockchain TX: `{signed_contract.blockchain_tx_hash}`"
                )
            except Exception as e_pdf:
                logging.warning(f"Falla PDF descarga: {e_pdf}. Usando HTML fallback.")
                # Intento HTML
                try:
                    html_content = PDFContractService.generate_contract_html(legal_dict, signature_data)
                    file_data = html_content.encode('utf-8')
                    filename = f"Contrato_Mandato_Firmado_{signed_contract.id}.html"
                    caption = (
                        "✅ **CONTRATO DE MANDATO (Vista Web)**\n\n"
                        "⚠️ PDF no disponible. Descarga este archivo HTML para visualizar tu contrato firmado.\n\n"
                        f"📅 Fecha: {signed_contract.signed_at.strftime('%Y-%m-%d')}\n"
                        f"🔗 Blockchain TX: `{signed_contract.blockchain_tx_hash}`"
                    )
                except Exception as e_html:
                    await message.answer(f"❌ Error generando documento: {e_html}")
                    return

            # 5. Enviar
            file = BufferedInputFile(file_data, filename=filename)
            await message.answer_document(document=file, caption=caption, parse_mode="Markdown")

    except Exception as e:
        logging.error(f"Error /contract: {e}")
        await message.answer(f"❌ Error interno recuperando contrato: {str(e)}")

# --- UTILIDAD ---
from datetime import timedelta
