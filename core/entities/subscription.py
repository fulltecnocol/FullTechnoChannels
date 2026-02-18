from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base

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
