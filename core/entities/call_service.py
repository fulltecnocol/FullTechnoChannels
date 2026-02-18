from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base

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
    start_time = Column(DateTime, index=True)
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
