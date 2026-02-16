from sqlalchemy import (
    Column,
    Integer,
    BigInteger,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Float,
    Text,
)
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime
import uuid

Base = declarative_base()


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


class SystemConfig(Base):
    """
    Configuración dinámica de porcentajes y reglas de negocio.
    """

    __tablename__ = "system_config"
    id = Column(Integer, primary_key=True)
    key = Column(String, unique=True, index=True)  # Ej: platform_fee, affiliate_fee
    value = Column(Float)
    description = Column(String, nullable=True)


class Channel(Base):
    __tablename__ = "channels"
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))

    telegram_id = Column(BigInteger, unique=True, index=True, nullable=True)
    title = Column(String)
    invite_link = Column(String, nullable=True)

    validation_code = Column(String, unique=True, index=True)
    is_verified = Column(Boolean, default=False)

    # Personalización de Branding
    welcome_message = Column(Text, nullable=True)
    expiration_message = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="channels")
    plans = relationship("Plan", back_populates="channel")


class Plan(Base):
    __tablename__ = "plans"
    id = Column(Integer, primary_key=True, index=True)
    channel_id = Column(Integer, ForeignKey("channels.id"))

    name = Column(String)
    description = Column(String)
    price = Column(Float)
    duration_days = Column(Integer)
    stripe_price_id = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

    channel = relationship("Channel", back_populates="plans")
    subscriptions = relationship("Subscription", back_populates="plan")


class Subscription(Base):
    __tablename__ = "subscriptions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    plan_id = Column(Integer, ForeignKey("plans.id"))
    start_date = Column(DateTime, default=datetime.utcnow)
    end_date = Column(DateTime)
    is_active = Column(Boolean, default=True)
    is_trial = Column(Boolean, default=False)

    user = relationship("User", back_populates="subscriptions")
    plan = relationship("Plan", backref="subscriptions_list")


class Payment(Base):
    """
    Registra cada transacción procesada, sin importar el proveedor.
    """

    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    plan_id = Column(Integer, ForeignKey("plans.id"), nullable=True)

    # Info de la transacción
    amount = Column(Float)
    currency = Column(String, default="usd")
    payment_method = Column(String)  # stripe, crypto, paypal, etc.
    provider_tx_id = Column(String, unique=True, nullable=True)
    status = Column(String)  # pending, completed, failed

    # DESGLOSE PARA MULTI-TENANT Y AFILIADOS
    platform_amount = Column(Float, default=0.0)  # Tu comisión
    owner_amount = Column(Float, default=0.0)  # Del dueño del canal
    affiliate_amount = Column(Float, default=0.0)  # Del que lo refirió (vitalicia)
    affiliate_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id], back_populates="payments")
    affiliate_earnings = relationship("AffiliateEarning", back_populates="payment")


class AffiliateEarning(Base):
    """
    Registra la ganancia de cada nivel en el sistema multinivel (hasta 10 niveles).
    """

    __tablename__ = "affiliate_earnings"
    id = Column(Integer, primary_key=True, index=True)
    payment_id = Column(Integer, ForeignKey("payments.id"))
    affiliate_id = Column(Integer, ForeignKey("users.id"))
    level = Column(Integer)  # 1 a 10
    amount = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

    payment = relationship("Payment", back_populates="affiliate_earnings")
    affiliate = relationship("User")


class Withdrawal(Base):
    __tablename__ = "withdrawals"
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))

    amount = Column(Float)
    fee_applied = Column(Float, default=0.0)

    status = Column(String, default="pending")
    method = Column(String)
    details = Column(Text, nullable=True)

    is_express = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    payout_id = Column(Integer, ForeignKey("withdrawals.id"), nullable=True)

    owner = relationship("User", back_populates="withdrawals")


class Promotion(Base):
    """
    Gestiona links de oferta y periodos de prueba.
    """

    __tablename__ = "promotions"
    id = Column(Integer, primary_key=True, index=True)
    channel_id = Column(Integer, ForeignKey("channels.id"))
    code = Column(
        String, unique=True, index=True
    )  # Unico para el deep-link (t.me/bot?start=PROMO)

    promo_type = Column(String)  # 'discount' o 'trial'
    value = Column(Float)  # % de descuento (0.10) o dias (7)

    max_uses = Column(Integer, nullable=True)
    current_uses = Column(Integer, default=0)

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    channel = relationship("Channel", backref="promotions")


class SupportTicket(Base):
    __tablename__ = "support_tickets"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    subject = Column(String)
    status = Column(String, default="open")  # open, closed, pending
    priority = Column(String, default="normal")  # low, normal, high
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User")
    messages = relationship("TicketMessage", back_populates="ticket")


class TicketMessage(Base):
    __tablename__ = "ticket_messages"
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("support_tickets.id"))
    sender_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    ticket = relationship("SupportTicket", back_populates="messages")
    sender = relationship("User")


class RegistrationToken(Base):
    __tablename__ = "registration_tokens"
    token = Column(String, primary_key=True, index=True)
    telegram_id = Column(BigInteger, nullable=False)
    username = Column(String, nullable=True)
    full_name = Column(String, nullable=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class BusinessExpense(Base):
    __tablename__ = "business_expenses"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))  # Admin Owner
    description = Column(String)
    amount = Column(Float)
    currency = Column(String, default="USD")
    date = Column(DateTime, default=datetime.utcnow)
    category = Column(String)  # Softare, Legal, Ads, Other
    receipt_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")


class CallService(Base):
    __tablename__ = "call_services"
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    channel_id = Column(Integer, ForeignKey("channels.id"), nullable=True)  # New field
    price = Column(Float)
    duration_minutes = Column(Integer)
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", backref="call_service")
    channel = relationship("Channel")  # Relationship to Channel
    slots = relationship("CallSlot", back_populates="service")


class CallSlot(Base):
    __tablename__ = "call_slots"
    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("call_services.id"))
    start_time = Column(DateTime)
    is_booked = Column(Boolean, default=False)
    booked_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    jitsi_link = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    service = relationship("CallService", back_populates="slots")
    booked_by = relationship("User", foreign_keys=[booked_by_id])


class AvailabilityRange(Base):
    """
    Define bloques de tiempo en los que el usuario está disponible para CUALQUIER servicio.
    Ej: Lunes 9:00 - 12:00.
    """
    __tablename__ = "availability_ranges"
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    channel_id = Column(Integer, ForeignKey("channels.id"), nullable=True) # Scope opcional
    
    # 0=Monday, 6=Sunday. Si es null, podría ser una fecha específica (override)
    day_of_week = Column(Integer, nullable=True) 
    specific_date = Column(DateTime, nullable=True) # Para overrides
    
    start_time = Column(String) # Format "HH:MM"
    end_time = Column(String)   # Format "HH:MM"
    
    is_recurring = Column(Boolean, default=True)
    
    owner = relationship("User")


class CallBooking(Base):
    """
    Reemplazo moderno de CallSlot.
    Representa una cita confirmada o pendiente.
    Disponibilidad = (AvailabilityRanges - CallBookings).
    """
    __tablename__ = "call_bookings"
    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("call_services.id"))
    booker_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    start_time = Column(DateTime) # UTC
    end_time = Column(DateTime)   # UTC (Calculado: start + service.duration)
    
    status = Column(String, default="confirmed") # pending, confirmed, cancelled, completed
    meeting_link = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    service = relationship("CallService")
    booker = relationship("User", foreign_keys=[booker_id])
