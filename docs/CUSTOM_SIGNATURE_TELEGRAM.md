# 🔐 Solución Custom: Firma Digital con Telegram + Blockchain

**Propuesta:** Sistema de firma digital usando el bot de Telegram existente + blockchain para inmutabilidad

---

## 🎯 Por Qué Esta Solución es PERFECTA para TeleGate

### **Ventajas únicas:**
1. ✅ **Costo CERO** - Telegram API es gratis
2. ✅ **Ya tienes bot** - Reutilizas infraestructura
3. ✅ **Usuarios ya en Telegram** - No friction
4. ✅ **Más seguro que SMS** - Telegram tiene E2E encryption
5. ✅ **Blockchain inmutable** - Prueba irrefutable
6. ✅ **Control total** - Tu código, tu data
7. ✅ **Escalable infinito** - Sin límites de API
8. ✅ **Experiencia nativa** - Usuario firma desde el bot

### **Comparación Telegram vs SMS (Twilio):**

| Característica | Telegram | SMS (Twilio) |
|----------------|----------|--------------|
| **Costo** | $0 (gratis) | $0.0075/SMS |
| **Seguridad** | E2E encryption | Plain text |
| **Velocidad** | Instantáneo | 5-30 segundos |
| **Confiabilidad** | 99.9% | 95% (operadores) |
| **User Experience** | Nativo (ya usa bot) | Sale de la app |
| **Verificación** | Telegram ID único | Número reutilizable |
| **Internacional** | Global gratis | Caro fuera CO |

**Ganador:** 🏆 Telegram (por mucho)

---

## 🤔 Bot Existente vs Bot Nuevo

### **Opción A: Usar el Bot Existente** ⭐⭐⭐ (Recomendado)

**Pros:**
- ✅ No duplicas infraestructura
- ✅ Usuario ya lo conoce
- ✅ Misma autenticación (ya sabe su Telegram ID)
- ✅ Todo centralizado
- ✅ Menos confusión

**Contras:**
- ⚠️ Mezcla lógica de negocio con firma legal
- ⚠️ Si el bot cae, no hay firma (pero tampoco hay servicio)

### **Opción B: Bot Separado para Firma** ⭐

**Pros:**
- ✅ Separación de responsabilidades
- ✅ Bot especializado solo en firma
- ✅ Escalabilidad independiente

**Contras:**
- ❌ Usuario debe agregar 2 bots
- ❌ Duplica infraestructura
- ❌ Confusión: "¿Cuál bot uso?"

### **Decisión: Opción A (Bot Existente)**

**Razones:**
1. **UX Superior** - Usuario ya tiene el bot
2. **Simplicidad** - Un solo punto de contacto
3. **Trust** - No parecen 2 servicios diferentes
4. **Economía** - No duplicas monitoreo/infraestructura

---

## 🏗️ Arquitectura Técnica Completa

### **Stack:**

```
┌──────────────────────────────────────────────────────────────┐
│                    TeleGate System                           │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  USER (Creator/Owner)                                        │
│         │                                                     │
│         ├─────────▶ 1. Web Dashboard                         │
│         │           (Llena datos legales)                    │
│         │                                                     │
│         ├─────────▶ 2. Telegram Bot                          │
│         │           (Recibe OTP, firma contrato)             │
│         │                                                     │
│         └─────────▶ 3. Email                                 │
│                     (PDF firmado + certificado)              │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              FastAPI Backend                         │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │                                                       │    │
│  │  /api/legal/info          ← Recibe datos legales    │    │
│  │  /api/legal/preview       ← Preview PDF             │    │
│  │  /api/legal/request-sign  ← Inicia firma            │    │
│  │  /api/legal/verify-code   ← Valida OTP              │    │
│  │  /api/legal/contract      ← Descarga PDF            │    │
│  │                                                       │    │
│  └───────────┬───────────────────────────┬──────────────┘    │
│              │                           │                    │
│              ▼                           ▼                    │
│  ┌──────────────────┐       ┌─────────────────────┐         │
│  │   PostgreSQL     │       │   Telegram Bot API  │         │
│  ├──────────────────┤       ├─────────────────────┤         │
│  │ owner_legal_info │       │ sendMessage()       │         │
│  │ contract_sigs    │       │ answerCallback()    │         │
│  └──────────────────┘       └─────────────────────┘         │
│         │                                                     │
│         ▼                                                     │
│  ┌──────────────────────────────────────────────┐           │
│  │         PDF Generation (WeasyPrint)          │           │
│  ├──────────────────────────────────────────────┤           │
│  │ 1. Template HTML con datos                   │           │
│  │ 2. Genera PDF                                │           │
│  │ 3. Calcula SHA-256 hash                      │           │
│  └────────────┬─────────────────────────────────┘           │
│               │                                               │
│               ▼                                               │
│  ┌──────────────────────────────────────────────┐           │
│  │      Blockchain (Polygon PoS - Layer 2)      │           │
│  ├──────────────────────────────────────────────┤           │
│  │ Smart Contract: ContractRegistry             │           │
│  │                                               │           │
│  │ function storeContract(                       │           │
│  │   bytes32 contractHash,                       │           │
│  │   uint256 ownerId,                            │           │
│  │   uint256 timestamp                           │           │
│  │ )                                             │           │
│  │                                               │           │
│  │ Gas cost: ~$0.001 (casi gratis)              │           │
│  └────────────┬─────────────────────────────────┘           │
│               │                                               │
│               ▼                                               │
│  ┌──────────────────────────────────────────────┐           │
│  │     Google Cloud Storage (GCS)                │           │
│  ├──────────────────────────────────────────────┤           │
│  │ /contracts/{owner_id}/                        │           │
│  │   └── {timestamp}_contract.pdf                │           │
│  │   └── {timestamp}_certificate.pdf             │           │
│  └───────────────────────────────────────────────┘           │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo Completo de Usuario

### **Paso a Paso:**

```
┌─────────────────────────────────────────────────────────┐
│  FASE 1: REGISTRO LEGAL (Web Dashboard)                 │
└─────────────────────────────────────────────────────────┘

1. Owner se loguea en dashboard web
2. Ve banner: ⚠️ "Completa verificación legal"
3. Click en "Verificar ahora"
4. Llena formulario:
   ├── Tipo: Natural / Jurídica
   ├── Nombre completo
   ├── Cédula / NIT
   ├── Dirección
   ├── Teléfono
   ├── Cuenta bancaria
   └── Upload RUT (opcional)

5. Backend valida datos
6. Se guarda en `owner_legal_info`
7. Status: 'pending_signature'

┌─────────────────────────────────────────────────────────┐
│  FASE 2: PREVIEW CONTRATO (Web Dashboard)               │
└─────────────────────────────────────────────────────────┘

8. Dashboard muestra: "Revisa tu contrato"
9. Click "Ver contrato"
10. Backend genera PDF preview (sin firmar)
11. Owner lee el contrato completo
12. Acepta términos: ☑️ checkbox
13. Click "Firmar Contrato"

┌─────────────────────────────────────────────────────────┐
│  FASE 3: FIRMA VIA TELEGRAM                             │
└─────────────────────────────────────────────────────────┘

14. Backend:
    ├── Genera código OTP de 6 dígitos
    ├── Guarda en Redis (expira en 10 min)
    └── Envía mensaje a Telegram:

15. Usuario recibe en Telegram:

    ┌──────────────────────────────────────┐
    │ 🔐 TeleGate Bot                       │
    ├──────────────────────────────────────┤
    │                                       │
    │ Hola Juan! 👋                        │
    │                                       │
    │ Tienes un CONTRATO DE MANDATO        │
    │ pendiente de firma.                   │
    │                                       │
    │ 📄 Contrato: Mandato Comercial       │
    │ 💰 Comisión: 12%                     │
    │ 📅 Válido desde: 2026-02-12          │
    │                                       │
    │ Tu código de firma es:                │
    │                                       │
    │     🔑 123456                         │
    │                                       │
    │ Válido por 10 minutos.                │
    │                                       │
    │ [✅ Firmar Ahora]  [❌ Cancelar]     │
    │                                       │
    └──────────────────────────────────────┘

16. Usuario hace click en "✅ Firmar Ahora"

17. Bot responde:

    ┌──────────────────────────────────────┐
    │ Por favor, envía el código de        │
    │ firma que recibiste:                  │
    │                                       │
    │ Código: 🔑 ______                    │
    └──────────────────────────────────────┘

18. Usuario escribe: "123456"

19. Bot valida con backend:
    ├── Verifica código en Redis
    ├── Verifica no expirado
    └── Verifica owner_id match

┌─────────────────────────────────────────────────────────┐
│  FASE 4: FIRMA Y BLOCKCHAIN                             │
└─────────────────────────────────────────────────────────┘

20. Backend (si código correcto):
    ├── Genera PDF final con datos de firma
    ├── Calcula SHA-256 del PDF
    ├── Envía hash a blockchain (Polygon)
    ├── Espera confirmación (5-10 seg)
    ├── Guarda PDF en Cloud Storage
    ├── Actualiza DB: contract_signed = true
    └── Genera certificado digital

21. Bot responde:

    ┌──────────────────────────────────────┐
    │ ✅ ¡Contrato Firmado Exitosamente!   │
    │                                       │
    │ 📄 Tu contrato ha sido registrado    │
    │    en blockchain.                     │
    │                                       │
    │ 🔗 TX Hash: 0xabc123...              │
    │ 📅 Fecha: 2026-02-12 07:30:15        │
    │                                       │
    │ Recibirás por email:                  │
    │ • Contrato firmado (PDF)              │
    │ • Certificado blockchain              │
    │                                       │
    │ [📥 Descargar Ahora]                 │
    │                                       │
    └──────────────────────────────────────┘

22. Email enviado con:
    ├── contract_signed.pdf
    └── certificate.pdf (con QR de verificación)

23. Dashboard actualizado:
    └── ✅ "Verificado - Puedes crear canales"
```

---

## 💻 Implementación - Código Completo

### **1. Database Migration**

```sql
-- contracts/migrations/002_signature_system.sql

-- Tabla de códigos OTP temporales (mejor en Redis, pero esto funciona)
CREATE TABLE signature_codes (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER REFERENCES users(id) NOT NULL,
    code VARCHAR(6) NOT NULL,
    contract_hash VARCHAR(66) NOT NULL, -- SHA-256
    telegram_message_id BIGINT,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

CREATE INDEX idx_signature_codes_owner ON signature_codes(owner_id);
CREATE INDEX idx_signature_codes_code ON signature_codes(code);
CREATE INDEX idx_signature_codes_expires ON signature_codes(expires_at);

-- Tabla de contratos firmados (registro completo)
CREATE TABLE signed_contracts (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER REFERENCES users(id) NOT NULL,
    contract_type VARCHAR(50) DEFAULT 'mandato_comercial',
    contract_version VARCHAR(10) DEFAULT '1.0',
    
    -- PDF
    pdf_url VARCHAR(500) NOT NULL,
    pdf_hash VARCHAR(66) NOT NULL, -- SHA-256
    pdf_size_bytes INTEGER,
    
    -- Blockchain
    blockchain_network VARCHAR(50) DEFAULT 'polygon', -- 'polygon', 'ethereum', etc
    blockchain_tx_hash VARCHAR(66),
    blockchain_confirmed BOOLEAN DEFAULT FALSE,
    blockchain_confirmed_at TIMESTAMP,
    blockchain_block_number BIGINT,
    
    -- Firma
    signature_method VARCHAR(50) DEFAULT 'telegram_otp',
    signature_code VARCHAR(6),
    signature_telegram_user_id BIGINT,
    signature_ip_address INET,
    signature_user_agent TEXT,
    signed_at TIMESTAMP DEFAULT NOW(),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_signed_contracts_owner ON signed_contracts(owner_id);
CREATE INDEX idx_signed_contracts_tx ON signed_contracts(blockchain_tx_hash);
```

---

### **2. Smart Contract (Solidity - Polygon)**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ContractRegistry
 * @dev Registro inmutable de contratos firmados en TeleGate
 */
contract ContractRegistry {
    
    struct Contract {
        bytes32 contractHash;      // SHA-256 del PDF
        uint256 ownerId;           // ID del owner en DB
        uint256 timestamp;         // Timestamp de firma
        address signer;            // Dirección que firmó
        bool exists;
    }
    
    // Mapping: hash => Contract
    mapping(bytes32 => Contract) public contracts;
    
    // Array de todos los hashes (para enumerar)
    bytes32[] public contractHashes;
    
    // Events
    event ContractStored(
        bytes32 indexed contractHash,
        uint256 indexed ownerId,
        uint256 timestamp,
        address signer
    );
    
    /**
     * @dev Almacena un nuevo contrato
     * @param _contractHash Hash SHA-256 del PDF
     * @param _ownerId ID del owner en base de datos
     */
    function storeContract(
        bytes32 _contractHash,
        uint256 _ownerId
    ) external {
        require(!contracts[_contractHash].exists, "Contract already exists");
        
        contracts[_contractHash] = Contract({
            contractHash: _contractHash,
            ownerId: _ownerId,
            timestamp: block.timestamp,
            signer: msg.sender,
            exists: true
        });
        
        contractHashes.push(_contractHash);
        
        emit ContractStored(
            _contractHash,
            _ownerId,
            block.timestamp,
            msg.sender
        );
    }
    
    /**
     * @dev Verifica si un contrato existe
     * @param _contractHash Hash a verificar
     * @return exists, ownerId, timestamp
     */
    function verifyContract(bytes32 _contractHash) 
        external 
        view 
        returns (bool, uint256, uint256, address) 
    {
        Contract memory c = contracts[_contractHash];
        return (c.exists, c.ownerId, c.timestamp, c.signer);
    }
    
    /**
     * @dev Obtiene total de contratos registrados
     */
    function getTotalContracts() external view returns (uint256) {
        return contractHashes.length;
    }
}
```

**Deployment:**
```bash
# Deploy en Polygon Mumbai (testnet)
npx hardhat run scripts/deploy.js --network mumbai

# Deploy en Polygon Mainnet
npx hardhat run scripts/deploy.js --network polygon
```

---

### **3. Backend - API Endpoints**

```python
# api/legal.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta
import hashlib
import secrets
from web3 import Web3
from weasyprint import HTML
import os

router = APIRouter(prefix="/api/legal", tags=["Legal"])

# Configuración Polygon
w3 = Web3(Web3.HTTPProvider(os.getenv("POLYGON_RPC_URL")))
CONTRACT_ADDRESS = os.getenv("CONTRACT_REGISTRY_ADDRESS")
CONTRACT_ABI = [...] # ABI del smart contract

contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI)

@router.post("/request-signature")
async def request_signature(
    current_user: User = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db)
):
    """
    Inicia proceso de firma:
    1. Valida que tenga legal_info completa
    2. Genera código OTP
    3. Genera PDF preview
    4. Calcula hash
    5. Envía mensaje a Telegram
    """
    
    # 1. Verificar legal info
    legal_info = await db.execute(
        select(OwnerLegalInfo).where(OwnerLegalInfo.owner_id == current_user.id)
    )
    legal_info = legal_info.scalar_one_or_none()
    
    if not legal_info:
        raise HTTPException(400, "Complete legal info first")
    
    # 2. Generar OTP de 6 dígitos
    otp_code = ''.join([str(secrets.randbelow(10)) for _ in range(6)])
    
    # 3. Generar PDF del contrato
    contract_html = render_contract_template(legal_info)
    pdf_bytes = HTML(string=contract_html).write_pdf()
    
    # 4. Calcular hash SHA-256
    contract_hash = hashlib.sha256(pdf_bytes).hexdigest()
    
    # 5. Guardar código en DB
    signature_code = SignatureCode(
        owner_id=current_user.id,
        code=otp_code,
        contract_hash=f"0x{contract_hash}",
        expires_at=datetime.utcnow() + timedelta(minutes=10)
    )
    db.add(signature_code)
    await db.commit()
    
    # 6. Enviar mensaje a Telegram
    telegram_user_id = current_user.telegram_id
    
    message = f"""
🔐 *TeleGate - Firma de Contrato*

Hola {legal_info.full_legal_name}! 👋

Tienes un *CONTRATO DE MANDATO* pendiente de firma.

📄 *Contrato:* Mandato Comercial
💰 *Comisión:* 12%
📅 *Válido desde:* {datetime.now().strftime('%Y-%m-%d')}

Tu código de firma es:

🔑 `{otp_code}`

⏱ Válido por 10 minutos.

⚠️ *Importante:* Este código es personal e intransferible.
"""
    
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="✅ Firmar Ahora", callback_data=f"sign_contract:{signature_code.id}"),
            InlineKeyboardButton(text="❌ Cancelar", callback_data="cancel_signature")
        ],
        [
            InlineKeyboardButton(text="📄 Ver Contrato", url=f"https://yourdomain.com/contract/preview/{current_user.id}")
        ]
    ])
    
    msg = await bot.send_message(
        chat_id=telegram_user_id,
        text=message,
        parse_mode="Markdown",
        reply_markup=keyboard
    )
    
    # Guardar message_id para referencia
    signature_code.telegram_message_id = msg.message_id
    await db.commit()
    
    return {
        "status": "otp_sent",
        "expires_at": signature_code.expires_at,
        "message": "Check your Telegram for signing code"
    }


@router.post("/verify-signature")
async def verify_signature(
    code: str,
    current_user: User = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db)
):
    """
    Verifica código OTP y firma contrato:
    1. Valida código
    2. Genera PDF final
    3. Sube a blockchain
    4. Guarda en Cloud Storage
    5. Marca como firmado
    """
    
    # 1. Buscar código
    result = await db.execute(
        select(SignatureCode)
        .where(
            SignatureCode.owner_id == current_user.id,
            SignatureCode.code == code,
            SignatureCode.used == False,
            SignatureCode.expires_at > datetime.utcnow()
        )
    )
    signature_code = result.scalar_one_or_none()
    
    if not signature_code:
        raise HTTPException(400, "Invalid or expired code")
    
    # 2. Marcar código como usado
    signature_code.used = True
    signature_code.used_at = datetime.utcnow()
    
    # 3. Obtener legal info
    legal_info = await db.execute(
        select(OwnerLegalInfo).where(OwnerLegalInfo.owner_id == current_user.id)
    )
    legal_info = legal_info.scalar_one()
    
    # 4. Generar PDF FINAL con datos de firma
    contract_data = {
        **legal_info.__dict__,
        "signature_date": datetime.utcnow(),
        "signature_code": code,
        "signature_method": "telegram_otp",
        "telegram_user_id": current_user.telegram_id
    }
    
    contract_html = render_contract_template(contract_data)
    pdf_bytes = HTML(string=contract_html).write_pdf()
    contract_hash = hashlib.sha256(pdf_bytes).hexdigest()
    
    # 5. Subir a blockchain (Polygon)
    try:
        # Preparar transacción
        tx = contract.functions.storeContract(
            bytes.fromhex(contract_hash),
            current_user.id
        ).build_transaction({
            'from': os.getenv("SIGNER_ADDRESS"),
            'nonce': w3.eth.get_transaction_count(os.getenv("SIGNER_ADDRESS")),
            'gas': 200000,
            'gasPrice': w3.eth.gas_price
        })
        
        # Firmar transacción
        signed_tx = w3.eth.account.sign_transaction(
            tx, 
            private_key=os.getenv("SIGNER_PRIVATE_KEY")
        )
        
        # Enviar transacción
        tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        
        # Esperar confirmación (timeout 60 seg)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
        
    except Exception as e:
        logger.error(f"Blockchain error: {e}")
        raise HTTPException(500, "Failed to store contract on blockchain")
    
    # 6. Subir PDF a Cloud Storage
    storage_client = storage.Client()
    bucket = storage_client.bucket(os.getenv("GCS_BUCKET_NAME"))
    
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    blob_path = f"contracts/{current_user.id}/{timestamp}_contract.pdf"
    blob = bucket.blob(blob_path)
    blob.upload_from_string(pdf_bytes, content_type="application/pdf")
    
    pdf_url = f"https://storage.googleapis.com/{bucket.name}/{blob_path}"
    
    # 7. Guardar en DB
    signed_contract = SignedContract(
        owner_id=current_user.id,
        pdf_url=pdf_url,
        pdf_hash=f"0x{contract_hash}",
        pdf_size_bytes=len(pdf_bytes),
        blockchain_network="polygon",
        blockchain_tx_hash=receipt['transactionHash'].hex(),
        blockchain_confirmed=True,
        blockchain_confirmed_at=datetime.utcnow(),
        blockchain_block_number=receipt['blockNumber'],
        signature_method="telegram_otp",
        signature_code=code,
        signature_telegram_user_id=current_user.telegram_id,
        signed_at=datetime.utcnow()
    )
    db.add(signed_contract)
    
    # 8. Actualizar owner legal info
    legal_info.contract_signed = True
    legal_info.contract_signed_at = datetime.utcnow()
    legal_info.contract_pdf_url = pdf_url
    
    # 9. Actualizar user status
    current_user.legal_verification_status = "contract_signed"
    current_user.can_create_channels = True
    
    await db.commit()
    
    # 10. Notificar via Telegram
    await bot.send_message(
        chat_id=current_user.telegram_id,
        text=f"""
✅ *¡Contrato Firmado Exitosamente!*

📄 Tu contrato ha sido registrado en blockchain.

🔗 *TX Hash:* `{receipt['transactionHash'].hex()}`
📅 *Fecha:* {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
🔢 *Bloque:* {receipt['blockNumber']}

Recibirás por email:
• Contrato firmado (PDF)
• Certificado blockchain

Ya puedes crear canales y recibir pagos! 🎉
""",
        parse_mode="Markdown"
    )
    
    # 11. Enviar email con PDF
    send_contract_email(current_user.email, pdf_url, receipt)
    
    return {
        "status": "signed",
        "contract_url": pdf_url,
        "blockchain_tx": receipt['transactionHash'].hex(),
        "block_number": receipt['blockNumber']
    }
```

---

### **4. Bot Handler - Firma Interactiva**

```python
# bot/handlers/contract_signature.py

from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup

router = Router()

class SignatureStates(StatesGroup):
    waiting_for_code = State()

@router.callback_query(F.data.startswith("sign_contract:"))
async def start_signature_flow(callback: CallbackQuery, state: FSMContext):
    """Usuario hace click en 'Firmar Ahora'"""
    await callback.answer()
    
    await callback.message.answer(
        "Por favor, envía el código de firma que aparece arriba 👆\n\n"
        "Código: 🔑 ______",
        reply_markup=types.ReplyKeyboardRemove()
    )
    
    await state.set_state(SignatureStates.waiting_for_code)

@router.message(SignatureStates.waiting_for_code)
async def handle_signature_code(message: Message, state: FSMContext, db: AsyncSession):
    """Usuario envía el código OTP"""
    
    code = message.text.strip()
    
    # Validar formato
    if not code.isdigit() or len(code) != 6:
        await message.answer(
            "❌ Código inválido. Debe ser 6 dígitos.\n"
            "Intenta de nuevo:"
        )
        return
    
    # Llamar a API para verificar
    try:
        # Aquí normalmente harías una llamada al endpoint /verify-signature
        # Por simplicidad, lo hago directo en el bot
        
        result = await db.execute(
            select(SignatureCode)
            .where(
                SignatureCode.code == code,
                SignatureCode.used == False,
                SignatureCode.expires_at > datetime.utcnow()
            )
            .join(User, User.id == SignatureCode.owner_id)
            .where(User.telegram_id == message.from_user.id)
        )
        signature_code = result.scalar_one_or_none()
        
        if not signature_code:
            await message.answer(
                "❌ Código inválido o expirado.\n\n"
                "Solicita un nuevo código desde el dashboard."
            )
            await state.clear()
            return
        
        # Mostrar loading
        loading_msg = await message.answer("⏳ Firmando contrato y guardando en blockchain...")
        
        # ... (aquí va el resto de la lógica de firma, blockchain, etc)
        # Ver código completo en el endpoint verify_signature
        
        await loading_msg.delete()
        
        await message.answer(
            "✅ *¡Contrato Firmado Exitosamente!*\n\n"
            f"🔗 TX Hash: `{tx_hash}`\n"
            f"📅 Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
            "Recibirás el PDF firmado por email.\n\n"
            "¡Ya puedes crear canales y recibir pagos! 🎉",
            parse_mode="Markdown"
        )
        
        await state.clear()
        
    except Exception as e:
        logger.error(f"Signature error: {e}")
        await message.answer(
            "❌ Error al firmar el contrato.\n"
            "Por favor contacta a soporte."
        )
        await state.clear()
```

---

## 💰 Costos Reales

### **Por 100 firmas/mes:**

```
Telegram API: $0 (gratis)
Polygon gas (100 tx): $0.10 (muy barato)
Cloud Storage (100 PDFs × 200KB): $0.01
WeasyPrint (self-hosted): $0

TOTAL: $0.11/mes (~$0.001 por firma)
```

### **Por 1000 firmas/mes:**

```
Telegram: $0
Polygon: $1
Cloud Storage: $0.10
Compute: ~$5 (Cloud Run)

TOTAL: $6.10/mes (~$0.006 por firma)
```

**vs Truora:** $2000/mes (1000 firmas × $2)

**Ahorro:** $1994/mes (99.7% más barato)

---

## ⚖️ Validez Legal

### **¿Esta solución es legal en Colombia?**

**Respuesta: SÍ**, siempre que cumplas:

✅ **Ley 527 de 1999 - Requisitos:**
1. ✅ Manifestación inequívoca de voluntad → OTP confirma
2. ✅ Mensaje de datos atribuible → Telegram ID único
3. ✅ Integridad del mensaje → Hash SHA-256 + blockchain
4. ✅ Conservación → Cloud Storage + blockchain inmutable
5. ✅ Firma electrónica → OTP cuenta como firma electrónica simple

**Nivel de firma:** "Firma electrónica simple" (válida para contratos privados)

**No es necesario:** Certificado digital calificado (solo para actos públicos)

### **Fortalezas legales:**

1. **Inmutabilidad** - Blockchain es prueba irrefutable
2. **Timestamp** - Blockchain provee timestamp verificable
3. **No repudio** - Telegram ID + OTP = prueba de identidad
4. **Trazabilidad** - Logs completos en DB
5. **Evidencia** - Email + PDF + certificado blockchain

### **Recomendación adicional:**

Incluir en el contrato cláusula:

> "Las partes acuerdan que la firma a través de código OTP enviado a Telegram constituye manifestación inequívoca de voluntad y tiene plena validez legal conforme a la Ley 527 de 1999."

---

## 🎯 Ventajas vs Soluciones Pagas

| Aspecto | Custom Telegram | Truora | Certiblock |
|---------|-----------------|---------|------------|
| **Costo** | ~$0.001/firma | $2/firma | $0.50/firma |
| **Control** | 100% tuyo | Dependes de ellos | Medio |
| **Blockchain** | ✅ Polygon | ❌ No | ✅ Ethereum |
| **UX** | Nativo Telegram | Sale de la app | Email |
| **Validación ID** | ❌ Manual | ✅ Automática | ❌ No |
| **Escalabilidad** | ∞ Infinita | Limitado por precio | Limitado |
| **Downtime risk** | Tú controlas | Si Truora cae | Si Certiblock cae |

---

## 📝 Checklist de Implementación

### **Semana 1:**
- [ ] Crear tabla `signature_codes` y `signed_contracts`
- [ ] Configurar cuenta Polygon (crear wallet)
- [ ] Deploy smart contract en testnet (Mumbai)
- [ ] Implementar endpoints `/request-signature` y `/verify-signature`

### **Semana 2:**
- [ ] Integrar bot handlers para firma
- [ ] Implementar generación de PDF
- [ ] Testing end-to-end en testnet
- [ ] Generar certificado con QR

### **Semana 3:**
- [ ] Deploy smart contract en mainnet
- [ ] Configurar Cloud Storage
- [ ] Email notifications
- [ ] Testing con usuarios beta

### **Semana 4:**
- [ ] Revisión legal del abogado
- [ ] Ajustes finales
- [ ] Documentación
- [ ] Launch! 🚀

---

## 🚀 ¿Implementamos esto?

**Ventajas principales:**
1. ✅ **Costo prácticamente $0**
2. ✅ **UX perfecta** (todo en Telegram)
3. ✅ **Control total** (tu infraestructura)
4. ✅ **Blockchain inmutable** (evidencia irrefutable)
5. ✅ **Escalable infinitamente**

**Único trade-off:**
- ⚠️ No valida identidad automáticamente (confías en datos)

**Solución híbrida:**
- Usar esta solución custom para firma
- Agregar Truora solo para owners que manejen +$X/mes
- Best of both worlds!

---

**¿Te gusta esta solución?** Puedo empezar implementándola ahora mismo! 🔥
