from aiogram.fsm.state import State, StatesGroup


class SignatureFlow(StatesGroup):
    """Estados para el flujo de firma digital"""

    # 1. Identificación
    waiting_for_person_type = State()

    # 2. Datos Personales / Empresa
    waiting_for_name = State()  # Nombre o Razón Social
    waiting_for_id_type = State()  # CC, NIT, etc
    waiting_for_id_number = State()  # Número de documento
    waiting_for_legal_rep = State()  # Solo jurídica: Rep Legal Nombre
    waiting_for_rep_id = State()  # Solo jurídica: Rep Legal ID

    # 3. Datos de Contacto y Ubicación
    waiting_for_address = State()
    waiting_for_city = State()
    waiting_for_phone = State()

    # 4. Datos Bancarios
    waiting_for_bank = State()
    waiting_for_account_type = State()
    waiting_for_account_number = State()
    waiting_for_account_info_confirm = State()  # Confirmar todo

    # 5. Firma del Contrato
    waiting_for_contract_review = State()  # Viendo PDF y botón "Firmar"
    waiting_for_otp = State()  # Código enviado al chat
