from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean, BigInteger
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base

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

    # Note: 'channel' relationship is defined in Channel with back_populates or here if needed generally
    # In shared/models.py: channel = relationship("Channel", backref="promotions")
    channel = relationship("Channel", backref="promotions")


class RegistrationToken(Base):
    __tablename__ = "registration_tokens"
    token = Column(String, primary_key=True, index=True)
    telegram_id = Column(BigInteger, nullable=False)
    username = Column(String, nullable=True)
    full_name = Column(String, nullable=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
