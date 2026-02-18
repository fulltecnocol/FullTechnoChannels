from sqlalchemy import Column, Integer, BigInteger, String, Boolean, DateTime, ForeignKey, Float, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base

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
