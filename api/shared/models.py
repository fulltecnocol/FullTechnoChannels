from sqlalchemy import Column, Integer, BigInteger, String, Boolean, DateTime, ForeignKey, Float, Text
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime
import uuid

Base = declarative_base()

class User(Base):
    """
    Representa tanto a suscriptores como a dueños de canales.
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
    
    is_admin = Column(Boolean, default=False)  # Admin central de la plataforma
    is_owner = Column(Boolean, default=False)  # Si es dueño de canales
    
    # --- VERIFICACIÓN LEGAL (NUEVO) ---
    legal_verification_status = Column(String(50), default="pending")
    # Valores: 'pending', 'info_submitted', 'contract_signed', 'rejected'
    can_create_channels = Column(Boolean, default=False)
    
    # --- SISTEMA DE AFILIADOS ---
    # Código único para invitar a otros
    referral_code = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4())[:8])
    # Quién invitó a este usuario
    referred_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # --- BALANCES ---
    balance = Column(Float, default=0.0)           # Ganancia de sus canales
    affiliate_balance = Column(Float, default=0.0) # Ganancia por referir otros dueños
    pending_balance = Column(Float, default=0.0)
    avatar_url = Column(String, nullable=True) # URL de foto de perfil
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relaciones
    subscriptions = relationship("Subscription", back_populates="user")
    payments = relationship("Payment", foreign_keys="Payment.user_id", back_populates="user")
    channels = relationship("Channel", back_populates="owner")
    withdrawals = relationship("Withdrawal", back_populates="owner")
    
    # Relación de Afiliados (Self-referencing)
    referrer = relationship("User", remote_side=[id], backref="referrals")
    
    # Relaciones para Sistema de Firma (NUEVO)
    legal_info = relationship("OwnerLegalInfo", back_populates="owner", uselist=False)
    signature_codes = relationship("SignatureCode", back_populates="owner")
    signed_contracts = relationship("SignedContract", back_populates="owner")

class SystemConfig(Base):
    """
    Configuración dinámica de porcentajes y reglas de negocio.
    """
    __tablename__ = "system_config"
    id = Column(Integer, primary_key=True)
    key = Column(String, unique=True, index=True) # Ej: platform_fee, affiliate_fee
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
    payment_method = Column(String) # stripe, crypto, paypal, etc.
    provider_tx_id = Column(String, unique=True, nullable=True) 
    status = Column(String) # pending, completed, failed
    
    # DESGLOSE PARA MULTI-TENANT Y AFILIADOS
    platform_amount = Column(Float, default=0.0) # Tu comisión
    owner_amount = Column(Float, default=0.0)    # Del dueño del canal
    affiliate_amount = Column(Float, default=0.0) # Del que lo refirió (vitalicia)
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
    level = Column(Integer) # 1 a 10
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
    code = Column(String, unique=True, index=True) # Unico para el deep-link (t.me/bot?start=PROMO)
    
    promo_type = Column(String) # 'discount' o 'trial'
    value = Column(Float) # % de descuento (0.10) o dias (7)
    
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
    status = Column(String, default="open") # open, closed, pending
    priority = Column(String, default="normal") # low, normal, high
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
