from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base

class AffiliateEarning(Base):
    """
    Registra la ganancia de cada nivel en el sistema multinivel (hasta 10 niveles).
    """

    __tablename__ = "affiliate_earnings"
    id = Column(Integer, primary_key=True, index=True)
    payment_id = Column(Integer, ForeignKey("payments.id"))
    affiliate_id = Column(Integer, ForeignKey("users.id"), index=True)
    level = Column(Integer)  # 1 a 10
    amount = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

    payment = relationship("Payment", back_populates="affiliate_earnings")
    affiliate = relationship("User")


class AffiliateRank(Base):
    """
    Rangos dinámicos de afiliados (Ej: Bronce, Plata, Oro).
    Configurables desde el Admin.
    """
    __tablename__ = "affiliate_ranks"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    min_referrals = Column(Integer, unique=True) # Cantidad de referidos directos necesarios
    bonus_percentage = Column(Float, default=0.0) # Bonus opcional (0.01 = 1%)
    icon = Column(String, nullable=True) # Emoji o URL
    
    created_at = Column(DateTime, default=datetime.utcnow)
