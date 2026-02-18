from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base

class PublicProfile(Base):
    """
    Perfil público 'Link-in-Bio' (fgate.co/slug).
    """
    __tablename__ = "public_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    slug = Column(String, unique=True, index=True)  # URL amigable
    
    display_name = Column(String)
    bio = Column(Text, nullable=True)
    avatar_url = Column(String, nullable=True)
    
    # Personalización
    theme_color = Column(String, default="#000000")
    background_image_url = Column(String, nullable=True)
    is_published = Column(Boolean, default=True)
    
    view_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="public_profile")
    links = relationship("ProfileLink", back_populates="profile", cascade="all, delete-orphan")


class ProfileLink(Base):
    """
    Enlaces dentro del perfil público.
    """
    __tablename__ = "profile_links"
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("public_profiles.id"))
    
    title = Column(String)
    url = Column(String)
    icon = Column(String, nullable=True) # Nombre de ícono Lucide (ej: "instagram", "twitter")
    
    is_active = Column(Boolean, default=True)
    order_index = Column(Integer, default=0)
    
    click_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    profile = relationship("PublicProfile", back_populates="links")
