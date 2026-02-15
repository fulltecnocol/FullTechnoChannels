from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PromotionCreate(BaseModel):
    code: str
    promo_type: str  # 'discount' or 'trial'
    value: float
    max_uses: Optional[int] = None


class PromotionResponse(BaseModel):
    id: int
    code: str
    promo_type: str
    value: float
    current_uses: int
    max_uses: Optional[int]
    is_active: bool

    class Config:
        from_attributes = True


class WithdrawalRequest(BaseModel):
    amount: float
    method: str
    details: str
    is_express: bool = False


class TicketCreate(BaseModel):
    subject: str
    content: str
    priority: str = "normal"


class TicketResponse(BaseModel):
    id: int
    subject: str
    status: str
    priority: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MessageCreate(BaseModel):
    content: str


class PaymentRequest(BaseModel):
    plan_id: int
    user_id: int
    method: str  # 'stripe', 'wompi', 'crypto'
    promo_id: Optional[int] = None


class ConfigUpdate(BaseModel):
    key: str
    value: float


class TaxExpenseRequest(BaseModel):
    description: str
    amount: float
    category: str
    date: str  # ISO format


class TicketDetailsResponse(BaseModel):
    ticket: TicketResponse
    messages: list[MessageCreate]
