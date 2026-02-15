from pydantic import BaseModel
from typing import Optional


class Token(BaseModel):
    access_token: str
    token_type: str


class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str
    referral_code: Optional[str] = None
    registration_token: Optional[str] = None


class GoogleAuthRequest(BaseModel):
    credential: str  # This is the ID Token
    referral_code: Optional[str] = None
    registration_token: Optional[str] = None


class GenerateTokenRequest(BaseModel):
    telegram_id: int
    username: Optional[str] = None
    full_name: Optional[str] = None


class CreateMagicLinkRequest(BaseModel):
    telegram_id: int


class PasswordUpdate(BaseModel):
    current_password: Optional[str] = None
    new_password: str
