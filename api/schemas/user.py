from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserAdminResponse(BaseModel):
    id: int
    full_name: Optional[str]
    email: Optional[str]
    is_admin: bool
    is_owner: bool
    legal_verification_status: str
    created_at: datetime
    class Config:
        from_attributes = True

class UserProfileResponse(BaseModel):
    id: int
    telegram_id: Optional[int]
    username: Optional[str]
    full_name: Optional[str]
    email: Optional[str]
    is_admin: bool
    is_owner: bool
    referral_code: Optional[str]
    referred_by_id: Optional[int]
    balance: float
    affiliate_balance: float
    pending_balance: float
    avatar_url: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

class DashboardSummary(BaseModel):
    id: int
    full_name: str
    email: str
    avatar_url: Optional[str]
    active_subscribers: int
    available_balance: float
    affiliate_balance: float
    active_channels: int
    referral_code: str
    affiliate_tier: str
    referral_count: int
    affiliate_next_tier_min: Optional[int]
    is_admin: bool
    telegram_linked: bool

class UserAdmin(BaseModel):
    id: int
    full_name: Optional[str]
    email: Optional[str]
    is_admin: bool
    is_owner: bool
    legal_verification_status: str
    created_at: datetime
    class Config:
        from_attributes = True
