# Modelos SQLAlchemy para Sistema de Firma Digital
# Usuario: owners, contratos, códigos de firma

from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP, ForeignKey, Text, BigInteger
from sqlalchemy.dialects.postgresql import INET
from sqlalchemy.orm import relationship
from datetime import datetime
from api.shared.database import Base

class OwnerLegalInfo(Base):
    """
    Información legal y tributaria de owners (creadores de canales)
    """
    __tablename__ = "owner_legal_info"
    
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # Tipo de persona
    person_type = Column(String(20), nullable=False)  # 'natural' o 'juridica'
    
    # Persona Natural
    full_legal_name = Column(String(255))
    id_type = Column(String(20))  # 'CC', 'CE', 'PA', 'PEP'
    id_number = Column(String(50))
    
    # Persona Jurídica
    business_name = Column(String(255))
    nit = Column(String(20))
    legal_rep_name = Column(String(255))
    legal_rep_id = Column(String(50))
    
    # Información Común
    address = Column(String(500), nullable=False)
    city = Column(String(100), nullable=False)
    department = Column(String(100), nullable=False)
    phone = Column(String(50), nullable=False)
    
    # Información Tributaria
    has_rut = Column(Boolean, default=False)
    rut_url = Column(String(500))
    
    # Información Bancaria
    bank_name = Column(String(100), nullable=False)
    account_type = Column(String(20), nullable=False)  # 'ahorros', 'corriente'
    account_number = Column(String(50), nullable=False)
    account_holder_name = Column(String(255), nullable=False)
    bank_cert_url = Column(String(500))
    
    # Documentos Corporativos
    chamber_commerce_url = Column(String(500))
    
    # Estado del Contrato
    contract_version = Column(String(20), nullable=False, default="1.0")
    contract_signed = Column(Boolean, default=False)
    contract_signed_at = Column(TIMESTAMP(timezone=True))
    contract_pdf_url = Column(String(500))
    contract_signature_method = Column(String(50))
    contract_ip_address = Column(INET)
    contract_user_agent = Column(Text)
    
    # Metadata
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)
    updated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    owner = relationship("User", back_populates="legal_info")


class SignatureCode(Base):
    """
    Códigos OTP temporales para firma de contratos via Telegram
    """
    __tablename__ = "signature_codes"
    
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Código OTP
    code = Column(String(6), nullable=False, index=True)
    
    # Hash del contrato a firmar
    contract_hash = Column(String(66), nullable=False)  # 0x + 64 caracteres SHA-256
    
    # Información del mensaje Telegram
    telegram_message_id = Column(BigInteger)
    
    # Temporalidad
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)
    expires_at = Column(TIMESTAMP(timezone=True), nullable=False, index=True)
    
    # Estado
    used = Column(Boolean, default=False, index=True)
    used_at = Column(TIMESTAMP(timezone=True))
    
    # Auditoría
    ip_address = Column(INET)
    user_agent = Column(Text)
    
    # Relationships
    owner = relationship("User", back_populates="signature_codes")


class SignedContract(Base):
    """
    Registro completo de contratos firmados (incluye info blockchain)
    """
    __tablename__ = "signed_contracts"
    
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Tipo y Versión del Contrato
    contract_type = Column(String(50), default="mandato_comercial")
    contract_version = Column(String(10), default="1.0")
    
    # PDF del Contrato
    pdf_url = Column(String(500), nullable=False)
    pdf_hash = Column(String(66), nullable=False, index=True)  # SHA-256 del PDF
    pdf_size_bytes = Column(Integer)
    
    # Información Blockchain
    blockchain_network = Column(String(50), default="polygon")  # 'polygon', 'mumbai', 'ethereum'
    blockchain_tx_hash = Column(String(66), index=True)  # Hash de la transacción
    blockchain_confirmed = Column(Boolean, default=False)
    blockchain_confirmed_at = Column(TIMESTAMP(timezone=True))
    blockchain_block_number = Column(BigInteger)
    
    # Información de Firma
    signature_method = Column(String(50), default="telegram_otp")
    signature_code = Column(String(6))
    signature_telegram_user_id = Column(BigInteger)
    signature_ip_address = Column(INET)
    signature_user_agent = Column(Text)
    signed_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, index=True)
    
    # Metadata
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)
    
    # Relationships
    owner = relationship("User", back_populates="signed_contracts")
