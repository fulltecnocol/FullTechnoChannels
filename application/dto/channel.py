from pydantic import BaseModel
from typing import Optional


class ChannelCreate(BaseModel):
    title: str


class BrandingUpdate(BaseModel):
    welcome_message: Optional[str] = None
    expiration_message: Optional[str] = None
