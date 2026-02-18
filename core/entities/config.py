from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base

class SystemConfig(Base):
    """
    Configuración dinámica de porcentajes y reglas de negocio.
    """

    __tablename__ = "system_config"
    id = Column(Integer, primary_key=True)
    key = Column(String, unique=True, index=True)  # Ej: platform_fee, affiliate_fee
    value = Column(Float)
    description = Column(String, nullable=True)


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
