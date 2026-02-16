-- Migration 003: Sistema de Llamadas Privadas
-- Agrega tablas para ofrecer y agendar llamadas 1 a 1
-- Fecha: 2026-02-14

-- ============================================================================
-- 1. TABLA: call_services
-- Configuración del servicio de llamadas por dueño (owner)
-- ============================================================================

CREATE TABLE IF NOT EXISTS call_services (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.0,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_call_services_owner_id ON call_services(owner_id);

-- ============================================================================
-- 2. TABLA: call_slots
-- Horarios disponibles para reservar
-- ============================================================================

CREATE TABLE IF NOT EXISTS call_slots (
    id SERIAL PRIMARY KEY,
    service_id INTEGER NOT NULL REFERENCES call_services(id) ON DELETE CASCADE,
    
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    is_booked BOOLEAN DEFAULT FALSE,
    booked_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    jitsi_link VARCHAR(500),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_call_slots_service_id ON call_slots(service_id);
CREATE INDEX idx_call_slots_start_time ON call_slots(start_time);
CREATE INDEX idx_call_slots_is_booked ON call_slots(is_booked);
CREATE INDEX idx_call_slots_booked_by_id ON call_slots(booked_by_id);

-- ============================================================================
-- 3. COMENTARIOS
-- ============================================================================

COMMENT ON TABLE call_services IS 'Configuración de oferta de llamadas privadas 1 a 1';
COMMENT ON TABLE call_slots IS 'Slots de tiempo disponibles para llamadas';
