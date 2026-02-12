-- Migration 002: Sistema de Firma Digital
-- Agrega tablas necesarias para firma de contratos con Telegram + Blockchain
-- Fecha: 2026-02-12

-- ============================================================================
-- 1. TABLA: owner_legal_info
-- Almacena información legal y tributaria de los owners (creadores de canales)
-- ============================================================================

CREATE TABLE IF NOT EXISTS owner_legal_info (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- Tipo de persona
    person_type VARCHAR(20) NOT NULL CHECK (person_type IN ('natural', 'juridica')),
    
    -- Persona Natural
    full_legal_name VARCHAR(255),
    id_type VARCHAR(20), -- 'CC', 'CE', 'PA', 'PEP'
    id_number VARCHAR(50),
    
    -- Persona Jurídica
    business_name VARCHAR(255),
    nit VARCHAR(20),
    legal_rep_name VARCHAR(255),
    legal_rep_id VARCHAR(50),
    
    -- Información Común
    address VARCHAR(500) NOT NULL,
    city VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    
    -- Información Tributaria
    has_rut BOOLEAN DEFAULT FALSE,
    rut_url VARCHAR(500), -- URL del RUT en Cloud Storage
    
    -- Información Bancaria
    bank_name VARCHAR(100) NOT NULL,
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('ahorros', 'corriente')),
    account_number VARCHAR(50) NOT NULL,
    account_holder_name VARCHAR(255) NOT NULL,
    bank_cert_url VARCHAR(500), -- Certificado bancario (opcional)
    
    -- Documentos Corporativos (solo persona jurídica)
    chamber_commerce_url VARCHAR(500),
    
    -- Estado del Contrato
    contract_version VARCHAR(20) NOT NULL DEFAULT '1.0',
    contract_signed BOOLEAN DEFAULT FALSE,
    contract_signed_at TIMESTAMP WITH TIME ZONE,
    contract_pdf_url VARCHAR(500),
    contract_signature_method VARCHAR(50), -- 'telegram_otp', 'biometric'
    contract_ip_address INET,
    contract_user_agent TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para owner_legal_info
CREATE INDEX idx_owner_legal_info_owner_id ON owner_legal_info(owner_id);
CREATE INDEX idx_owner_legal_info_contract_signed ON owner_legal_info(contract_signed);
CREATE INDEX idx_owner_legal_info_person_type ON owner_legal_info(person_type);

-- ============================================================================
-- 2. TABLA: signature_codes
-- Códigos OTP temporales para firma de contratos
-- ============================================================================

CREATE TABLE IF NOT EXISTS signature_codes (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Código OTP
    code VARCHAR(6) NOT NULL,
    
    -- Hash del contrato a firmar
    contract_hash VARCHAR(66) NOT NULL, -- 0x + 64 caracteres SHA-256
    
    -- Información del mensaje Telegram
    telegram_message_id BIGINT,
    
    -- Temporalidad
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Estado
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE,
    
    -- Auditoría
    ip_address INET,
    user_agent TEXT
);

-- Índices para signature_codes
CREATE INDEX idx_signature_codes_owner_id ON signature_codes(owner_id);
CREATE INDEX idx_signature_codes_code ON signature_codes(code);
CREATE INDEX idx_signature_codes_expires_at ON signature_codes(expires_at);
CREATE INDEX idx_signature_codes_used ON signature_codes(used);

-- ============================================================================
-- 3. TABLA: signed_contracts
-- Registro completo de contratos firmados (incluye info blockchain)
-- ============================================================================

CREATE TABLE IF NOT EXISTS signed_contracts (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Tipo y Versión del Contrato
    contract_type VARCHAR(50) DEFAULT 'mandato_comercial',
    contract_version VARCHAR(10) DEFAULT '1.0',
    
    -- PDF del Contrato
    pdf_url VARCHAR(500) NOT NULL,
    pdf_hash VARCHAR(66) NOT NULL, -- SHA-256 del PDF
    pdf_size_bytes INTEGER,
    
    -- Información Blockchain
    blockchain_network VARCHAR(50) DEFAULT 'polygon', -- 'polygon', 'ethereum', 'mumbai' (testnet)
    blockchain_tx_hash VARCHAR(66), -- Hash de la transacción
    blockchain_confirmed BOOLEAN DEFAULT FALSE,
    blockchain_confirmed_at TIMESTAMP WITH TIME ZONE,
    blockchain_block_number BIGINT,
    
    -- Información de Firma
    signature_method VARCHAR(50) DEFAULT 'telegram_otp',
    signature_code VARCHAR(6),
    signature_telegram_user_id BIGINT,
    signature_ip_address INET,
    signature_user_agent TEXT,
    signed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para signed_contracts
CREATE INDEX idx_signed_contracts_owner_id ON signed_contracts(owner_id);
CREATE INDEX idx_signed_contracts_tx_hash ON signed_contracts(blockchain_tx_hash);
CREATE INDEX idx_signed_contracts_pdf_hash ON signed_contracts(pdf_hash);
CREATE INDEX idx_signed_contracts_signed_at ON signed_contracts(signed_at);

-- ============================================================================
-- 4. ACTUALIZAR TABLA: users
-- Agregar columnas para verificación legal
-- ============================================================================

-- Agregar columna de estado de verificación legal
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS legal_verification_status VARCHAR(50) DEFAULT 'pending';

-- Valores posibles:
-- 'pending' - No ha iniciado
-- 'info_submitted' - Llenó información legal
-- 'contract_signed' - Firmó contrato (LISTO)
-- 'rejected' - Rechazado por alguna razón

-- Agregar columna para controlar creación de canales
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS can_create_channels BOOLEAN DEFAULT FALSE;

-- Índices para las nuevas columnas
CREATE INDEX IF NOT EXISTS idx_users_legal_status ON users(legal_verification_status);
CREATE INDEX IF NOT EXISTS idx_users_can_create_channels ON users(can_create_channels);

-- ============================================================================
-- 5. TRIGGER: Actualizar updated_at automáticamente
-- ============================================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para owner_legal_info
DROP TRIGGER IF EXISTS update_owner_legal_info_updated_at ON owner_legal_info;
CREATE TRIGGER update_owner_legal_info_updated_at
    BEFORE UPDATE ON owner_legal_info
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. COMENTARIOS (Documentación en la BD)
-- ============================================================================

COMMENT ON TABLE owner_legal_info IS 'Información legal y tributaria de owners para contratos de mandato';
COMMENT ON TABLE signature_codes IS 'Códigos OTP temporales para firma de contratos vía Telegram';
COMMENT ON TABLE signed_contracts IS 'Registro inmutable de contratos firmados con hash blockchain';

COMMENT ON COLUMN owner_legal_info.person_type IS 'Tipo de persona: natural o juridica';
COMMENT ON COLUMN signature_codes.code IS 'Código OTP de 6 dígitos enviado por Telegram';
COMMENT ON COLUMN signed_contracts.blockchain_tx_hash IS 'Hash de transacción en blockchain (Polygon)';

-- ============================================================================
-- FIN DE MIGRACIÓN 002
-- ============================================================================
