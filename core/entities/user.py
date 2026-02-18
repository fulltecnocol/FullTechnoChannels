from sqlalchemy import (
    Column,
    Integer,
    BigInteger,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Float,
)
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from .base import Base

class User(Base):
    """
    Representa tanto a suscriptores como a creadores de contenido.
    Los "owners" se registran vía Dashboard (email/pass).
    Los "suscriptores" se registran vía Telegram.
    """

    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(BigInteger, unique=True, index=True, nullable=True)
    username = Column(String, nullable=True)
    full_name = Column(String, nullable=True)

    # Auth para Dashboard (Owners)
    email = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=True)
    google_id = Column(String, unique=True, index=True, nullable=True)

    # Verificación de Email
    email_verified = Column(Boolean, default=False)
    verification_token = Column(String, nullable=True)

    # Nuevo: Estado firma legal
    legal_verification_status = Column(String, default="pending")
    can_create_channels = Column(Boolean, default=False)

    is_admin = Column(Boolean, default=False)  # Admin central de la plataforma
    is_owner = Column(Boolean, default=False)  # Si es creador de contenido

    # --- SISTEMA DE AFILIADOS ---
    # Código único para invitar a otros
    referral_code = Column(
        String, unique=True, index=True, default=lambda: str(uuid.uuid4())[:8]
    )
    # Quién invitó a este usuario
    referred_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # --- BALANCES ---
    balance = Column(Float, default=0.0)  # Ganancia de sus canales
    affiliate_balance = Column(Float, default=0.0)  # Ganancia por referir otros dueños
    pending_balance = Column(Float, default=0.0)
    avatar_url = Column(String, nullable=True)  # URL de foto de perfil

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relaciones
    subscriptions = relationship("Subscription", back_populates="user")
    payments = relationship(
        "Payment", foreign_keys="Payment.user_id", back_populates="user"
    )
    channels = relationship("Channel", back_populates="owner")
    withdrawals = relationship("Withdrawal", back_populates="owner")

    # Sistema de Firma Digital
    legal_info = relationship("OwnerLegalInfo", uselist=False, back_populates="owner")
    signature_codes = relationship("SignatureCode", back_populates="owner")
    signed_contracts = relationship("SignedContract", back_populates="owner")

    # Relación de Afiliados (Self-referencing)
    referrer = relationship("User", remote_side=[id], backref="referrals")

    # Link-in-Bio
    public_profile = relationship("PublicProfile", uselist=False, back_populates="user")
