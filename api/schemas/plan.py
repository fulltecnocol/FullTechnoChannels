from pydantic import BaseModel
from typing import Optional

class PlanCreate(BaseModel):
    name: str
    description: str = ""
    price: float
    duration_days: int

class PlanUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    duration_days: Optional[int] = None
    is_active: Optional[bool] = None

class PlanResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    price: float
    duration_days: int
    is_active: bool
    class Config:
        from_attributes = True
