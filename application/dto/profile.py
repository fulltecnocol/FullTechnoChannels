from pydantic import BaseModel, HttpUrl
from typing import Optional, List
from datetime import datetime

class ProfileLinkBase(BaseModel):
    title: str
    url: str
    icon: Optional[str] = None
    is_active: bool = True
    order_index: int = 0

class ProfileLinkCreate(ProfileLinkBase):
    pass

class ProfileLinkUpdate(BaseModel):
    title: Optional[str] = None
    url: Optional[str] = None
    icon: Optional[str] = None
    is_active: Optional[bool] = None
    order_index: Optional[int] = None

class ProfileLinkRead(ProfileLinkBase):
    id: int
    click_count: int = 0
    created_at: datetime
    
    class Config:
        from_attributes = True

class PublicProfileBase(BaseModel):
    slug: str
    display_name: str
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    theme_color: Optional[str] = "#000000"
    background_image_url: Optional[str] = None
    is_published: bool = True

class PublicProfileCreate(PublicProfileBase):
    pass

class PublicProfileUpdate(BaseModel):
    slug: Optional[str] = None
    display_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    theme_color: Optional[str] = None
    background_image_url: Optional[str] = None
    is_published: Optional[bool] = None

class PublicProfileRead(PublicProfileBase):
    id: int
    view_count: int = 0
    links: List[ProfileLinkRead] = []
    
    class Config:
        from_attributes = True
