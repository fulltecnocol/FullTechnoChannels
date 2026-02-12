# 📜 Plan de Implementación: Contratos de Mandato Digital

**Objetivo:** Implementar sistema de firma digital de contratos de mandato para creadores de canales en TeleGate, cumpliendo con la legislación colombiana.

---

## 🎯 Requisitos Legales en Colombia

### **Marco Legal:**
1. **Ley 527 de 1999** - Firma digital y mensajes de datos
2. **Decreto 2364 de 2012** - Firma electrónica
3. **Ley 1231 de 2008** - Facturación electrónica
4. **Código de Comercio** - Contrato de mandato (Art. 1262-1316)

### **Contrato de Mandato:**
- **Mandante:** El creator (owner del canal)
- **Mandatario:** Tu empresa (TeleGate/Full Techno Hub)
- **Objeto:** Recaudar pagos de suscriptores a nombre del mandante

---

## 📋 Flujo de Onboarding con Firma Digital

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO DE REGISTRO                         │
└─────────────────────────────────────────────────────────────┘

1. Usuario se registra (Email + Password)
   ↓
2. Completa perfil básico
   ↓
3. Dashboard muestra: ⚠️ "Completa tu verificación legal"
   ↓
4. Selecciona tipo de persona:
   - [ ] Persona Natural
   - [ ] Persona Jurídica
   ↓
5. Llena formulario legal:
   ├── Natural: Nombre, Cédula, Dirección, RUT, Banco
   └── Jurídica: Razón Social, NIT, Rep. Legal, Cámara, RUT, Banco
   ↓
6. Validación de Identidad (Truora):
   ├── Toma foto de cédula (frente + reverso)
   ├── Toma selfie
   └── Validación automática (30 segundos)
   ↓
7. Preview del contrato personalizado
   ↓
8. Firma digital:
   ├── Opción A: OTP por SMS
   └── Opción B: Biométrica (Truora)
   ↓
9. Contrato firmado:
   ├── Se guarda PDF en Cloud Storage
   ├── Hash en blockchain (opcional)
   └── Notificación por email
   ↓
10. ✅ Estado: "Verificado" - Puede crear canales
```

---

## 🏗️ Arquitectura Técnica

### **Componentes:**

```
┌──────────────────────────────────────────────────────────┐
│                    TeleGate Backend                       │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────┐    ┌──────────────┐    ┌────────────┐ │
│  │   FastAPI   │───▶│  PostgreSQL  │───▶│   Truora   │ │
│  │  Endpoints  │    │   (+legal    │    │    API     │ │
│  └─────────────┘    │   info table)│    └────────────┘ │
│         │            └──────────────┘           │        │
│         │                                       │        │
│         ▼                                       ▼        │
│  ┌─────────────┐                        ┌────────────┐ │
│  │   PDF Gen   │                        │  Identity  │ │
│  │  (WeasyPrint│                        │ Validation │ │
│  │   or jsPDF) │                        └────────────┘ │
│  └─────────────┘                                        │
│         │                                                │
│         ▼                                                │
│  ┌─────────────────────────────────────────────────┐   │
│  │         Google Cloud Storage                     │   │
│  │  /contracts/{owner_id}/{timestamp}_signed.pdf   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 🗄️ Cambios en Base de Datos

### **Nueva Tabla: `owner_legal_info`**

```sql
CREATE TABLE owner_legal_info (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER REFERENCES users(id) UNIQUE NOT NULL,
    
    -- Tipo de persona
    person_type VARCHAR(20) NOT NULL, -- 'natural' o 'juridica'
    
    -- Persona Natural
    full_legal_name VARCHAR(255),
    id_type VARCHAR(20), -- 'CC', 'CE', 'PA'
    id_number VARCHAR(50),
    
    -- Persona Jurídica
    business_name VARCHAR(255),
    nit VARCHAR(20),
    legal_rep_name VARCHAR(255),
    legal_rep_id VARCHAR(50),
    
    -- Común
    address VARCHAR(500) NOT NULL,
    city VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    
    -- Tributario
    has_rut BOOLEAN DEFAULT FALSE,
    rut_url VARCHAR(500), -- URL del RUT en Cloud Storage
    
    -- Bancario
    bank_name VARCHAR(100) NOT NULL,
    account_type VARCHAR(20) NOT NULL, -- 'ahorros', 'corriente'
    account_number VARCHAR(50) NOT NULL,
    account_holder_name VARCHAR(255) NOT NULL,
    bank_cert_url VARCHAR(500), -- Certificado bancario (opcional)
    
    -- Documentos corporativos (solo jurídico)
    chamber_commerce_url VARCHAR(500),
    
    -- Verificación Truora
    truora_validation_id VARCHAR(100),
    truora_status VARCHAR(50), -- 'pending', 'approved', 'rejected'
    identity_verified BOOLEAN DEFAULT FALSE,
    identity_verified_at TIMESTAMP,
    
    -- Contrato
    contract_version VARCHAR(20) NOT NULL DEFAULT '1.0',
    contract_signed BOOLEAN DEFAULT FALSE,
    contract_signed_at TIMESTAMP,
    contract_pdf_url VARCHAR(500),
    contract_signature_method VARCHAR(50), -- 'otp_sms', 'biometric'
    contract_ip_address INET,
    contract_user_agent TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Índices
    CONSTRAINT check_person_type CHECK (person_type IN ('natural', 'juridica'))
);

CREATE INDEX idx_owner_legal_info_owner_id ON owner_legal_info(owner_id);
CREATE INDEX idx_owner_legal_info_identity_verified ON owner_legal_info(identity_verified);
```

### **Actualizar Tabla `users`:**

```sql
ALTER TABLE users 
ADD COLUMN legal_verification_status VARCHAR(50) DEFAULT 'pending';
-- 'pending', 'info_submitted', 'identity_verified', 'contract_signed', 'rejected'

ALTER TABLE users 
ADD COLUMN can_create_channels BOOLEAN DEFAULT FALSE;
-- Solo TRUE cuando legal_verification_status = 'contract_signed'
```

---

## 📄 Plantilla del Contrato de Mandato

**Archivo:** `templates/contrato_mandato.html` (se genera PDF)

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Arial', sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .clause { margin: 20px 0; }
        .signature-box { border: 1px solid #000; padding: 20px; margin: 30px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h2>CONTRATO DE MANDATO COMERCIAL</h2>
        <p>Para Intermediación en Recaudo de Pagos</p>
    </div>

    <p>Entre los suscritos a saber:</p>
    
    <div class="clause">
        <strong>EL MANDANTE:</strong> 
        {{ mandante_nombre }}, identificado con {{ tipo_documento }} No. {{ numero_documento }},
        domiciliado en {{ ciudad }}, {{ direccion }}, 
        quien actúa en nombre {{ 'propio' if persona_natural else 'y representación de ' + razon_social + ' NIT ' + nit }},
        quien para efectos del presente contrato se denominará <strong>EL MANDANTE</strong>.
    </div>

    <div class="clause">
        <strong>EL MANDATARIO:</strong>
        FULL TECHNO HUB S.A.S., sociedad comercial identificada con NIT [TU_NIT],
        representada legalmente por [REPRESENTANTE LEGAL],
        quien para efectos del presente contrato se denominará <strong>EL MANDATARIO</strong>.
    </div>

    <h3>CLÁUSULAS</h3>

    <div class="clause">
        <strong>PRIMERA - OBJETO:</strong>
        EL MANDANTE confiere mandato especial a EL MANDATARIO para que en su nombre y representación
        reciba, administre y distribuya los pagos realizados por suscriptores de los canales privados
        de Telegram administrados por EL MANDANTE a través de la plataforma TeleGate.
    </div>

    <div class="clause">
        <strong>SEGUNDA - OBLIGACIONES DEL MANDATARIO:</strong>
        <ol>
            <li>Recaudar los pagos de suscripciones en nombre de EL MANDANTE.</li>
            <li>Mantener contabilidad separada de los fondos recaudados.</li>
            <li>Transferir a EL MANDANTE el 88% del total recaudado, descontando únicamente:
                <ul>
                    <li>12% como comisión por intermediación</li>
                    <li>Impuestos y costos de transacción aplicables</li>
                </ul>
            </li>
            <li>Proveer reporte mensual detallado de transacciones.</li>
            <li>Procesar retiros en máximo 5 días hábiles desde la solicitud.</li>
        </ol>
    </div>

    <div class="clause">
        <strong>TERCERA - OBLIGACIONES DEL MANDANTE:</strong>
        <ol>
            <li>Proporcionar información veraz y actualizada.</li>
            <li>Mantener actividad lícita en sus canales.</li>
            <li>Cumplir con obligaciones tributarias sobre sus ingresos.</li>
            <li>Responder ante suscriptores por la calidad del servicio.</li>
        </ol>
    </div>

    <div class="clause">
        <strong>CUARTA - COMISIÓN:</strong>
        EL MANDANTE autoriza a EL MANDATARIO a retener el 12% del total de pagos recibidos
        como comisión por sus servicios de intermediación, procesamiento de pagos, infraestructura
        tecnológica y soporte.
    </div>

    <div class="clause">
        <strong>QUINTA - CUENTA BANCARIA:</strong>
        Los desembolsos a favor de EL MANDANTE se realizarán a la cuenta bancaria registrada:
        <ul>
            <li>Banco: {{ banco }}</li>
            <li>Tipo: {{ tipo_cuenta }}</li>
            <li>Número: {{ numero_cuenta }}</li>
            <li>Titular: {{ titular_cuenta }}</li>
        </ul>
    </div>

    <div class="clause">
        <strong>SEXTA - RESPONSABILIDAD TRIBUTARIA:</strong>
        EL MANDANTE será responsable de cumplir con todas las obligaciones tributarias
        derivadas de los ingresos percibidos. EL MANDATARIO actuará como agente retenedor
        cuando la ley así lo requiera.
    </div>

    <div class="clause">
        <strong>SÉPTIMA - DURACIÓN:</strong>
        El presente contrato tendrá vigencia indefinida, pudiendo ser terminado por cualquiera
        de las partes con 30 días de anticipación mediante comunicación escrita.
    </div>

    <div class="clause">
        <strong>OCTAVA - PROTECCIÓN DE DATOS:</strong>
        EL MANDANTE autoriza el tratamiento de sus datos personales de acuerdo con la
        Ley 1581 de 2012 y política de privacidad disponible en [URL].
    </div>

    <div class="clause">
        <strong>NOVENA - LEY APLICABLE:</strong>
        Este contrato se regirá por las leyes de la República de Colombia.
    </div>

    <div class="signature-box">
        <p><strong>FIRMA DIGITAL DEL MANDANTE</strong></p>
        <p>Nombre: {{ mandante_nombre }}</p>
        <p>Documento: {{ tipo_documento }} {{ numero_documento }}</p>
        <p>Fecha y hora: {{ fecha_firma }}</p>
        <p>Dirección IP: {{ ip_address }}</p>
        <p>Método: {{ metodo_firma }}</p>
        <p>Hash del documento: {{ document_hash }}</p>
    </div>

    <div class="signature-box">
        <p><strong>FIRMA DEL MANDATARIO</strong></p>
        <p>FULL TECHNO HUB S.A.S.</p>
        <p>NIT: [TU_NIT]</p>
        <p>Representante Legal: [NOMBRE]</p>
        <p>Fecha: {{ fecha_firma }}</p>
    </div>

    <footer style="margin-top: 50px; font-size: 10px; text-align: center;">
        <p>Documento generado electrónicamente por TeleGate - ID: {{ contrato_id }}</p>
        <p>Hash SHA-256: {{ document_hash }}</p>
    </footer>
</body>
</html>
```

---

## 💻 Implementación Backend

### **1. Nuevos Endpoints API:**

```python
# api/legal.py

@app.post("/owner/legal-info")
async def submit_legal_info(
    data: LegalInfoCreate, 
    current_user: DBUser = Depends(get_current_owner),
    db: AsyncSessionLocal = Depends(get_db)
):
    """Owner envía su información legal"""
    pass

@app.post("/owner/start-identity-verification")
async def start_identity_verification(
    current_user: DBUser = Depends(get_current_owner),
    db: AsyncSessionLocal = Depends(get_db)
):
    """Inicia proceso de verificación con Truora"""
    pass

@app.get("/owner/contract/preview")
async def preview_contract(
    current_user: DBUser = Depends(get_current_owner),
    db: AsyncSessionLocal = Depends(get_db)
):
    """Genera preview del contrato en PDF"""
    pass

@app.post("/owner/contract/sign")
async def sign_contract(
    signature_data: ContractSignature,
    current_user: DBUser = Depends(get_current_owner),
    db: AsyncSessionLocal = Depends(get_db)
):
    """Firma el contrato digitalmente"""
    pass

@app.get("/owner/contract/download")
async def download_contract(
    current_user: DBUser = Depends(get_current_owner),
    db: AsyncSessionLocal = Depends(get_db)
):
    """Descarga contrato firmado"""
    pass
```

---

## 🔐 Integración con Truora

### **Pasos:**

1. **Crear cuenta en Truora:** https://truora.com/
2. **Obtener API keys** (sandbox + production)
3. **Instalar SDK:**
```bash
pip install truora-python
```

4. **Flujo de validación:**

```python
# services/truora_service.py

import truora

class TruoraService:
    def __init__(self):
        self.client = truora.Client(api_key=os.getenv("TRUORA_API_KEY"))
    
    async def create_validation(self, user_data):
        """Crea validación de identidad"""
        validation = await self.client.validations.create(
            type="background-check",
            country="CO",
            user_data={
                "national_id": user_data["id_number"],
                "first_name": user_data["first_name"],
                "last_name": user_data["last_name"]
            }
        )
        return validation.id
    
    async def check_status(self, validation_id):
        """Verifica estado de validación"""
        validation = await self.client.validations.get(validation_id)
        return validation.status  # 'pending', 'success', 'failure'
```

---

## 💰 Actualizar Sistema de Fees

**En `shared/accounting.py`:**

```python
# Cambiar de 20% a 12%
PLATFORM_FEE_PERCENT = 0.12  # 12% para la plataforma
```

---

## 📊 Dashboard - Nueva Sección

**Agregar en el frontend:**

```
┌────────────────────────────────────────┐
│  Verificación Legal  ⚠️ PENDIENTE      │
├────────────────────────────────────────┤
│                                         │
│  Para poder crear canales y recibir    │
│  pagos, debes completar tu verificación│
│                                         │
│  [ Completar Verificación ]             │
│                                         │
│  Pasos:                                 │
│  1. ☐ Información legal                │
│  2. ☐ Verificación de identidad        │
│  3. ☐ Firma de contrato                │
│                                         │
└────────────────────────────────────────┘
```

---

## ⚡ Quick Start

### **Fase 1: Base de Datos** (1 hora)
- Crear tabla `owner_legal_info`
- Migración de datos existentes

### **Fase 2: API Endpoints** (2 horas)
- Endpoints de legal info
- Integración Truora
- Generación PDF

### **Fase 3: Frontend** (3 horas)
- Formulario legal
- Flujo de verificación
- Vista de contrato

### **Fase 4: Testing** (2 horas)
- Flujo completo end-to-end
- Casos edge

---

## 📝 Checklist Legal

Antes de lanzar, necesitas:

- [ ] **Abogado colombiano** revise el contrato de mandato
- [ ] **Registrar tu empresa** (si no está registrada)
- [ ] **RUT de tu empresa** actualizado con actividad de intermediación
- [ ] **Cuenta bancaria empresarial** separada
- [ ] **Política de privacidad** actualizada
- [ ] **Términos y condiciones** actualizados
- [ ] **Registro ante DIAN** como agente retenedor (si aplica)

---

## 💡 Recomendaciones

1. **Usa Truora** - Es la mejor opción para Colombia
2. **Consulta abogado** - El contrato debe ser revisado
3. **Empieza simple** - Implementa firma OTP primero, biométrica después
4. **Guarda todo** - Logs, IPs, timestamps de cada firma
5. **Backup de contratos** - Cloud Storage + backup local

---

**¿Quieres que implemente esto ahora?** Podemos empezar por:
1. Crear las migraciones de BD
2. Actualizar el API
3. Configurar Truora
4. Generar el PDF del contrato
