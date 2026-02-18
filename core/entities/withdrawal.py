from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base

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
