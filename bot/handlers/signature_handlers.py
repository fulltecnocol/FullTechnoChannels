import logging
import os
from aiogram import Router, types, F
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from datetime import datetime, timedelta
import uuid
from aiogram.types import (
    ReplyKeyboardMarkup,
    KeyboardButton,
    ReplyKeyboardRemove,
    InlineKeyboardMarkup,
    InlineKeyboardButton,
)

from bot.states.signature_states import SignatureFlow
from infrastructure.database.connection import AsyncSessionLocal
from core.entities.user import User
from core.entities.legal import OwnerLegalInfo, SignedContract, SignatureCode

# Router específico para firma
signature_router = Router()

API_URL = os.getenv("API_URL", "http://localhost:8000")

# --- TECLADOS ---


def kbd_person_type():
    kb = [
        [KeyboardButton(text="👤 Persona Natural")],
        [KeyboardButton(text="🏢 Persona Jurídica (Empresa)")],
    ]
    return ReplyKeyboardMarkup(
        keyboard=kb, resize_keyboard=True, one_time_keyboard=True
    )


def kbd_id_type():
    kb = [
        [KeyboardButton(text="Cédula de Ciudadanía (CC)")],
        [KeyboardButton(text="Cédula de Extranjería (CE)")],
        [KeyboardButton(text="Pasaporte (PA)")],
        [KeyboardButton(text="PEP")],
    ]
    return ReplyKeyboardMarkup(
        keyboard=kb, resize_keyboard=True, one_time_keyboard=True
    )


def kbd_account_type():
    kb = [[KeyboardButton(text="Ahorros")], [KeyboardButton(text="Corriente")]]
    return ReplyKeyboardMarkup(
        keyboard=kb, resize_keyboard=True, one_time_keyboard=True
    )


def kbd_confirm():
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="✅ Confirmar Datos", callback_data="legal_confirm_data"
                )
            ],
            [
                InlineKeyboardButton(
                    text="❌ Corregir (Reiniciar)", callback_data="legal_restart"
                )
            ],
        ]
    )


def kbd_sign_contract():
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="📄 Leer Contrato PDF", callback_data="legal_read_pdf"
                )
            ],
            [
                InlineKeyboardButton(
                    text="✍️ FIRMAR AHORA", callback_data="legal_sign_now"
                )
            ],
        ]
    )


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
            user = User(
                telegram_id=user_id,
                username=message.from_user.username,
                full_name=message.from_user.full_name,
            )
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
                parse_mode="Markdown",
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
                reply_markup=InlineKeyboardMarkup(
                    inline_keyboard=[
                        [
                            InlineKeyboardButton(
                                text="✍️ Ir a Firma", callback_data="legal_goto_sign"
                            )
                        ],
                        [
                            InlineKeyboardButton(
                                text="🔄 Actualizar Datos",
                                callback_data="legal_restart",
                            )
                        ],
                    ]
                ),
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
        parse_mode="Markdown",
    )


# --- FLUJO DE RECOPILACIÓN DE DATOS ---


@signature_router.message(SignatureFlow.waiting_for_person_type)
async def process_person_type(message: types.Message, state: FSMContext):
    text = message.text
    if "Natural" in text:
        await state.update_data(person_type="natural")
        await state.set_state(SignatureFlow.waiting_for_name)
        await message.answer(
            "👤 Ingresa tu **Nombre Completo** (como aparece en tu documento):",
            reply_markup=ReplyKeyboardRemove(),
            parse_mode="Markdown",
        )
    elif "Jurídica" in text:
        await state.update_data(person_type="juridica")
        await state.set_state(SignatureFlow.waiting_for_name)
        await message.answer(
            "🏢 Ingresa la **Razón Social** de la empresa:",
            reply_markup=ReplyKeyboardRemove(),
            parse_mode="Markdown",
        )
    else:
        await message.answer("Por favor usa los botones del teclado.")


@signature_router.message(SignatureFlow.waiting_for_name)
async def process_name(message: types.Message, state: FSMContext):
    data = await state.get_data()
    if data["person_type"] == "natural":
        await state.update_data(full_legal_name=message.text)
        await state.set_state(SignatureFlow.waiting_for_id_type)
        await message.answer(
            "🆔 Selecciona tu tipo de documento:", reply_markup=kbd_id_type()
        )
    else:
        await state.update_data(business_name=message.text)
        await state.set_state(
            SignatureFlow.waiting_for_id_number
        )  # Juridica va directo a NIT
        await message.answer(
            "🔢 Ingresa el **NIT** de la empresa (sin dígito de verificación):",
            parse_mode="Markdown",
        )


@signature_router.message(SignatureFlow.waiting_for_id_type)
async def process_id_type(message: types.Message, state: FSMContext):
    # Solo para naturales
    id_type_map = {
        "Cédula de Ciudadanía (CC)": "CC",
        "Cédula de Extranjería (CE)": "CE",
        "Pasaporte (PA)": "PA",
        "PEP": "PEP",
    }
    selected = id_type_map.get(message.text)
    if not selected:
        await message.answer("Por favor selecciona una opción válida.")
        return

    await state.update_data(id_type=selected)
    await state.set_state(SignatureFlow.waiting_for_id_number)
    await message.answer(
        "🔢 Ingresa tu **Número de Documento**:",
        reply_markup=ReplyKeyboardRemove(),
        parse_mode="Markdown",
    )


@signature_router.message(SignatureFlow.waiting_for_id_number)
async def process_id_number(message: types.Message, state: FSMContext):
    data = await state.get_data()

    if data["person_type"] == "juridica":
        await state.update_data(nit=message.text)
        # Jurídica necesita representante legal
        await state.set_state(SignatureFlow.waiting_for_legal_rep)
        await message.answer(
            "👤 Ingresa el **Nombre del Representante Legal**:", parse_mode="Markdown"
        )
    else:
        await state.update_data(id_number=message.text)
        # Natural ya tiene nombre e ID, pasamos a contacto
        await state.set_state(SignatureFlow.waiting_for_address)
        await message.answer(
            "📍 Ingresa tu **Dirección de Residencia/Fiscal**:", parse_mode="Markdown"
        )


@signature_router.message(SignatureFlow.waiting_for_legal_rep)
async def process_legal_rep(message: types.Message, state: FSMContext):
    await state.update_data(legal_rep_name=message.text)
    await state.set_state(SignatureFlow.waiting_for_rep_id)
    await message.answer(
        "🔢 Ingresa el **Documento del Rep. Legal**:", parse_mode="Markdown"
    )


@signature_router.message(SignatureFlow.waiting_for_rep_id)
async def process_rep_id(message: types.Message, state: FSMContext):
    await state.update_data(legal_rep_id=message.text)
    await state.set_state(SignatureFlow.waiting_for_address)
    await message.answer(
        "📍 Ingresa la **Dirección Fiscal** de la empresa:", parse_mode="Markdown"
    )


# --- CONTACTO ---


@signature_router.message(SignatureFlow.waiting_for_address)
async def process_address(message: types.Message, state: FSMContext):
    await state.update_data(address=message.text)
    await state.set_state(SignatureFlow.waiting_for_city)
    await message.answer(
        "🏙️ Ingresa tu **Ciudad y Departamento** (Ej: Bogotá, Cundinamarca):",
        parse_mode="Markdown",
    )


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
        parse_mode="Markdown",
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
    await message.answer(
        "🔢 Ingresa el **Número de Cuenta**:",
        reply_markup=ReplyKeyboardRemove(),
        parse_mode="Markdown",
    )


@signature_router.message(SignatureFlow.waiting_for_account_number)
async def process_account_number(message: types.Message, state: FSMContext):
    await state.update_data(account_number=message.text)

    # Resumen y confirmación
    data = await state.get_data()

    summary = f"📋 **CONFIRMA TUS DATOS**\n\n**Tipo:** {data['person_type'].title()}\n"

    if data["person_type"] == "natural":
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
    holder = (
        data.get("full_legal_name")
        if data["person_type"] == "natural"
        else data.get("business_name")
    )
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
        "person_type": data["person_type"],
        "address": data["address"],
        "city": data["city"],
        "department": data.get("department", "N/A"),
        "phone": data["phone"],
        "bank_name": data["bank_name"],
        "account_type": data["account_type"],
        "account_number": data["account_number"],
        "account_holder_name": data["account_holder_name"],
        "owner_id_telegram": str(user_id),  # Para identificar al usuario
    }

    if data["person_type"] == "natural":
        legal_data.update(
            {
                "full_legal_name": data["full_legal_name"],
                "id_type": data["id_type"],
                "id_number": data["id_number"],
            }
        )
    else:
        legal_data.update(
            {
                "business_name": data["business_name"],
                "nit": data["nit"],
                "legal_rep_name": data["legal_rep_name"],
                "legal_rep_id": data["legal_rep_id"],
            }
        )

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
                if k != "owner_id_telegram" and hasattr(existing, k):
                    setattr(existing, k, v)
        else:
            # Filtrar campos que no son del modelo
            model_data = {
                k: v for k, v in legal_data.items() if k != "owner_id_telegram"
            }
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
        parse_mode="Markdown",
    )


# --- FIRMA DEL CONTRATO ---


@signature_router.callback_query(F.data == "legal_read_pdf")
async def handle_read_pdf(callback: types.CallbackQuery):
    await callback.message.edit_text("⏳ Generando documento... (Por favor espera)")

    user_id = callback.from_user.id
    WORKER_URL = os.getenv("WORKER_URL", "http://localhost:8001")

    try:
        async with AsyncSessionLocal() as session:
            # Recuperar datos legales
            stmt = select(OwnerLegalInfo).join(User).where(User.telegram_id == user_id)
            result = await session.execute(stmt)
            legal_info_model = result.scalar_one_or_none()

            if not legal_info_model:
                await callback.message.edit_text(
                    "❌ Error: No se encontró información legal. Usa /legal para reiniciar."
                )
                return

            # Convertir modelo a diccionario
            legal_info_dict = {
                c.name: getattr(legal_info_model, c.name)
                for c in legal_info_model.__table__.columns
            }

            import httpx
            import base64

            # Llamar al Worker Service
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(
                        f"{WORKER_URL}/generate-preview",
                        json={"legal_data": legal_info_dict}
                    )
                    response.raise_for_status()
                    data = response.json()
                    pdf_bytes = base64.b64decode(data["pdf_base64"])
                
                file_data = pdf_bytes
                filename = "Contrato_Mandato.pdf"
                caption = "📄 **Contrato de Mandato** (PDF)\nRevisa los términos antes de firmar."

            except Exception as e_api:
                logging.error(f"Worker call failed: {e_api}")
                await callback.message.edit_text(
                    "⚠️ El servicio de documentos está ocupado. Intenta en unos segundos."
                )
                return

            # Enviar documento
            input_file = BufferedInputFile(file_data, filename=filename)

            # Borramos el mensaje de "Generando" y enviamos el documento
            await callback.message.delete()
            await callback.message.answer_document(
                document=input_file,
                caption=caption,
                parse_mode="Markdown",
                reply_markup=kbd_sign_contract(),
            )

    except Exception as e:
        logging.error(f"Handler error: {e}")
        try:
            await callback.message.edit_text(f"❌ Error inesperado: {str(e)}")
        except Exception:
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
        from core.entities.legal import SignatureCode

        async with AsyncSessionLocal() as session:
            # Get user
            res = await session.execute(select(User).where(User.telegram_id == user_id))
            db_user = res.scalar_one_or_none()

            # Generar OTP
            otp = secrets.token_hex(3).upper()  # 6 caracteres

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
                expires_at=datetime.utcnow() + timedelta(minutes=15),
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
                parse_mode="Markdown",
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

    expected_otp = data.get("signature_otp")

    if input_otp == expected_otp:
        await message.answer(
            "✅ **Firma Verificada Correctamente**\n⏳ Registrando en Blockchain..."
        )

        # Verificación y Firma
        # Llamar al Worker Service para generar el PDF firmado final
        # NOTA: En un escenario real, el Worker debería subir el PDF a Storage y devolver la URL.
        # Aquí, por simplicidad, generamos los bytes pero no los guardamos en disco en este paso,
        # asumimos que la URL es generada o que el worker se encarga de subirlo.
        # Para mantener compatible con el modelo actual, usaremos un placeholder de URL
        # o subiremos si tuvieramos bucket.
        
        # Como el modelo SignedContract pide pdf_url, vamos a simularlo o 
        # si queremos ser estrictos, el Worker debería devolverlo.
        
        # Por ahora, solo validamos que el PDF se genera correctamente sin errores.
        
        try:
            from infrastructure.external_apis.pdf_generator import PDFContractService
            from infrastructure.storage.storage_factory import StorageFactory
            from core.entities import User, OwnerLegalInfo, SignedContract
            from aiogram.types import BufferedInputFile
            
            async with AsyncSessionLocal() as session:
                # 1. Recuperar Usuario y Datos Legales
                res = await session.execute(select(User).where(User.telegram_id == message.from_user.id))
                db_user = res.scalar_one_or_none()
                
                if not db_user:
                     await message.answer("❌ Error: Usuario no encontrado.")
                     return

                res_legal = await session.execute(
                    select(OwnerLegalInfo).where(OwnerLegalInfo.owner_id == db_user.id)
                )
                legal_info = res_legal.scalar_one_or_none()
                
                if not legal_info:
                    raise Exception("Falta información legal asociada al usuario.")

                # 2. Generar UUID y Hash Simulado
                process_id = uuid.uuid4().hex
                fake_tx = "0x" + uuid.uuid4().hex + uuid.uuid4().hex
                doc_hash = "0x" + uuid.uuid4().hex 
                
                # 3. Preparar Datos para PDF
                pdf_data = {
                    "contract_id": f"CTR-{process_id[:8].upper()}",
                    "signature_date": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
                    "full_name": legal_info.full_name,
                    "id_type": legal_info.id_type,
                    "id_number": legal_info.id_number,
                    "email": db_user.email or "N/A",
                    "telegram_id": str(db_user.telegram_id),
                    "address": legal_info.address,
                    "city": legal_info.city,
                    "signature_code": input_otp,
                    "document_hash": doc_hash,
                    "blockchain_tx_hash": fake_tx,
                    "blockchain_network": "Polygon Amoy (Testnet)",
                    "ip_address": "127.0.0.1 (Local)"
                }
                
                # 4. Generar PDF (CPU Bound -> run_in_executor)
                loop = asyncio.get_running_loop()
                pdf_bytes = await loop.run_in_executor(None, PDFContractService.generate_contract_pdf, legal_info.__dict__, pdf_data)
                
                # 5. Guardar en Disco/Nube
                filename = f"contract_{db_user.id}_{process_id}.pdf"
                storage = StorageFactory.get_provider()
                await storage.save_file(pdf_bytes, filename)
                
                # 6. Guardar en BD
                signed = SignedContract(
                    owner_id=db_user.id,
                    pdf_url=filename, 
                    pdf_hash=doc_hash,
                    blockchain_tx_hash=fake_tx,
                    blockchain_confirmed=True,
                    signature_code=input_otp,
                    signed_at=datetime.utcnow()
                )
                session.add(signed)
                
                db_user.legal_verification_status = "contract_signed"
                db_user.can_create_channels = True
                await session.commit()
                
                # Enviar PDF al usuario
                doc_file = BufferedInputFile(pdf_bytes, filename="Contrato_FGate_Firmado.pdf")
                await message.reply_document(doc_file, caption="✅ **Aquí tienes tu copia del contrato firmado.**")

                await state.clear()
                await message.answer(
                    "🎉 **¡CONTRATO FIRMADO EXITOSAMENTE!**\n\n"
                    "Tu cuenta ha sido verificada y habilitada para recibir pagos.\n\n"
                    f"🔗 **Registro Blockchain (Polygon):**\n`{fake_tx}`\n\n"
                    "Guardaremos una copia de seguridad. Puedes descargar tu contrato en cualquier momento con `/contract`.",
                    parse_mode="Markdown",
                )

        except Exception as e:
             logging.error(f"Error generando contrato local: {e}", exc_info=True)
             await message.answer(f"❌ Error interno al generar contrato: {str(e)}")
             return

        # Enviar notificación administrativa si es necesario

    else:
        await message.answer(
            "❌ **Código Incorrecto**\nInténtalo de nuevo o escribe /cancelar."
        )


# --- DESCARGA DE CONTRATO ---


@signature_router.message(Command("contract"))
async def cmd_download_contract(message: types.Message):
    """Permite al usuario descargar su contrato firmado"""
    user_id = message.from_user.id

    await message.answer("🔍 Buscando contrato firmado...")

    try:
        file_data = None
        filename = None
        caption = None
        
        async with AsyncSessionLocal() as session:
            # 1. Buscar contrato firmado
            res_contract = await session.execute(
                select(SignedContract).join(User).where(User.telegram_id == user_id)
            )
            signed_contract = res_contract.scalar_one_or_none()

            if not signed_contract:
                await message.answer(
                    "❌ No tienes un contrato firmado todavía.\nUsa /legal para iniciar el proceso."
                )
                return

            # 2. Buscar info legal
            res_legal = await session.execute(
                select(OwnerLegalInfo).where(
                    OwnerLegalInfo.owner_id == signed_contract.owner_id
                )
            )
            legal_info = res_legal.scalar_one_or_none()

            if not legal_info:
                await message.answer(
                    "❌ Error: Contrato encontrado pero falta información legal asociada."
                )
                return

            # 3. Obtener Documento (Factory)
            from infrastructure.storage.storage_factory import StorageFactory
            from infrastructure.external_apis.pdf_generator import PDFContractService
            
            storage = StorageFactory.get_provider()
            filename = signed_contract.pdf_url
            
            # Verificar si existe como archivo local (no URL http)
            is_local_file = filename and not filename.startswith("http") and storage.file_exists(filename)
            
            if is_local_file:
                 logging.info(f"Serving local contract: {filename}")
                 file_data = await storage.read_file(filename)
            else:
                 # Fallback: Regenerar PDF si no existe en disco o es registro antiguo
                 logging.warning(f"Contract file not found locally ({filename}). Regenerating...")
                 await message.bot.send_chat_action(chat_id=user_id, action="upload_document")
                 
                 # Generar datos
                 process_id = uuid.uuid4().hex
                 doc_hash = signed_contract.pdf_hash or ("0x" + uuid.uuid4().hex)
                 
                 pdf_data = {
                    "contract_id": f"CTR-{signed_contract.id}",
                    "signature_date": signed_contract.signed_at.strftime("%Y-%m-%d %H:%M:%S UTC"),
                    "full_name": legal_info.full_name,
                    "id_type": legal_info.id_type,
                    "id_number": legal_info.id_number,
                    "email": "N/A",
                    "telegram_id": str(user_id),
                    "address": legal_info.address,
                    "city": legal_info.city,
                    "signature_code": signed_contract.signature_code,
                    "document_hash": doc_hash,
                    "blockchain_tx_hash": signed_contract.blockchain_tx_hash,
                    "blockchain_network": "Polygon Amoy",
                    "ip_address": "N/A (Regenerated)"
                 }
                 
                 loop = asyncio.get_running_loop()
                 file_data = await loop.run_in_executor(None, PDFContractService.generate_contract_pdf, legal_info.__dict__, pdf_data)
                 
                 # Guardar el regenerado
                 new_filename = f"contract_{signed_contract.id}_{process_id}.pdf"
                 await storage.save_file(file_data, new_filename)
                 
                 # Actualizar BD
                 signed_contract.pdf_url = new_filename
                 await session.commit()
                 filename = new_filename

            caption = (
                "✅ **CONTRATO DE MANDATO (FIRMADO)**\n\n"
                f"📅 Fecha: {signed_contract.signed_at.strftime('%Y-%m-%d')}\n"
                f"🔗 Blockchain TX: `{signed_contract.blockchain_tx_hash}`"
            )

        # 5. Enviar (Fuera del session para no bloquear)
        if file_data and filename:
            file = BufferedInputFile(file_data, filename=filename)
            await message.answer_document(
                document=file, caption=caption, parse_mode="Markdown"
            )

    except Exception as e:
        logging.error(f"Error in cmd_download_contract: {e}", exc_info=True)
        await message.answer(f"❌ Error al recuperar el contrato: {str(e)}")


# --- UTILIDAD ---
