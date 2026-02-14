from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.future import select
from sqlalchemy import func, and_
from sqlalchemy.orm import selectinload
import secrets

from shared.database import get_db, AsyncSessionLocal
from shared.models import User as DBUser, Subscription, Plan, Channel, Withdrawal, Promotion, SupportTicket, TicketMessage, Payment
from api.schemas.user import DashboardSummary, UserProfileResponse, ProfileUpdate
from api.schemas.auth import PasswordUpdate
from api.schemas.channel import ChannelCreate, BrandingUpdate
from api.schemas.plan import PlanResponse, PlanCreate, PlanUpdate
from api.schemas.misc import PromotionResponse, PromotionCreate, WithdrawalRequest, TicketCreate, TicketResponse, MessageCreate
from api.deps import get_current_owner, oauth2_scheme
from api.services.auth_service import AuthService
from shared.accounting import get_affiliate_tier_info

router = APIRouter(prefix="/owner", tags=["Owner"])

@router.get("/dashboard/summary", response_model=DashboardSummary)
async def get_owner_summary(current_user: DBUser = Depends(get_current_owner), db: AsyncSessionLocal = Depends(get_db)):
    # 1. Canales Activos
    channels_result = await db.execute(
        select(func.count(Channel.id)).where(Channel.owner_id == current_user.id)
    )
    active_channels = channels_result.scalar() or 0
    
    # 2. Suscriptores Activos
    subs_result = await db.execute(
        select(func.count(Subscription.id)).join(Plan).join(Channel).where(
            and_(
                Channel.owner_id == current_user.id,
                Subscription.is_active == True,
                Subscription.end_date > datetime.utcnow()
            )
        )
    )
    active_subscribers = subs_result.scalar() or 0
    
    # 3. Info de Afiliados
    tier_info = await get_affiliate_tier_info(db, current_user.id)
    
    return {
        "id": current_user.id,
        "full_name": current_user.full_name or "",
        "email": current_user.email or "",
        "avatar_url": current_user.avatar_url,
        "active_subscribers": active_subscribers,
        "available_balance": current_user.balance,
        "affiliate_balance": current_user.affiliate_balance,
        "active_channels": active_channels,
        "referral_code": current_user.referral_code,
        "affiliate_tier": tier_info["tier"],
        "referral_count": tier_info["count"],
        "affiliate_next_tier_min": tier_info["next_min"],
        "is_admin": current_user.is_admin,
        "telegram_linked": current_user.telegram_id is not None
    }

@router.get("/profile", response_model=UserProfileResponse)
async def get_profile(current_user: DBUser = Depends(get_current_owner)):
    return current_user

@router.put("/profile")
async def update_profile(data: ProfileUpdate, current_user: DBUser = Depends(get_current_owner), db: AsyncSessionLocal = Depends(get_db)):
    if data.full_name is not None:
        current_user.full_name = data.full_name
    if data.avatar_url is not None:
        current_user.avatar_url = data.avatar_url
    await db.commit()
    return {"status": "success"}

@router.put("/password")
async def update_password(
    data: PasswordUpdate, 
    current_user: DBUser = Depends(get_current_owner), 
    db: AsyncSessionLocal = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    payload = AuthService.decode_token(token)
    is_recovery = payload.get("recovery", False) if payload else False

    if not is_recovery:
        if not data.current_password:
             raise HTTPException(status_code=400, detail="Se requiere la contraseña actual")
        
        if current_user.hashed_password and not AuthService.verify_password(data.current_password, current_user.hashed_password):
            raise HTTPException(status_code=400, detail="Contraseña actual incorrecta")
            
    current_user.hashed_password = AuthService.get_password_hash(data.new_password)
    await db.commit()
    return {"status": "success", "message": "Contraseña actualizada correctamente"}

@router.get("/channels")
async def get_owner_channels(current_user: DBUser = Depends(get_current_owner), db: AsyncSessionLocal = Depends(get_db)):
    result = await db.execute(
        select(Channel).where(Channel.owner_id == current_user.id).options(selectinload(Channel.plans))
    )
    return result.scalars().all()

@router.post("/channels")
async def create_channel(channel_data: ChannelCreate, current_user: DBUser = Depends(get_current_owner), db: AsyncSessionLocal = Depends(get_db)):
    validation_code = f"V-{secrets.token_hex(2).upper()}-{secrets.token_hex(1).upper()}"
    new_channel = Channel(
        owner_id=current_user.id,
        title=channel_data.title,
        validation_code=validation_code,
        is_verified=False
    )
    db.add(new_channel)
    await db.flush()

    default_plan = Plan(
        channel_id=new_channel.id,
        name="Mensual",
        description="Acceso por 30 días",
        price=10.0,
        duration_days=30,
        is_active=True
    )
    db.add(default_plan)
    await db.commit()
    await db.refresh(new_channel)
    return new_channel

@router.get("/channels/{channel_id}/delete-cost")
async def check_channel_delete_cost(channel_id: int, current_user: DBUser = Depends(get_current_owner), db: AsyncSessionLocal = Depends(get_db)):
    active_subs_result = await db.execute(
        select(Subscription).join(Plan).where(
            and_(
                Plan.channel_id == channel_id,
                Subscription.is_active == True,
                Subscription.end_date > datetime.utcnow()
            )
        ).options(selectinload(Subscription.plan))
    )
    active_subs = active_subs_result.scalars().all()
    
    total_refund = 0.0
    affected_users = len(active_subs)
    
    for sub in active_subs:
        remaining_days = (sub.end_date - datetime.utcnow()).days
        if remaining_days > 0 and sub.plan.duration_days > 0:
            daily_rate = sub.plan.price / sub.plan.duration_days
            total_refund += (daily_rate * remaining_days)

    penalty = total_refund * 0.20
    total_cost = total_refund + penalty
    
    return {
        "active_subscribers": affected_users,
        "refund_amount": round(total_refund, 2),
        "penalty_amount": round(penalty, 2),
        "total_cost": round(total_cost, 2),
        "can_afford": current_user.balance >= total_cost
    }

@router.delete("/channels/{channel_id}")
async def delete_channel(channel_id: int, confirm: bool = False, current_user: DBUser = Depends(get_current_owner), db: AsyncSessionLocal = Depends(get_db)):
    result = await db.execute(select(Channel).where(and_(Channel.id == channel_id, Channel.owner_id == current_user.id)))
    channel = result.scalar_one_or_none()
    if not channel: raise HTTPException(status_code=404, detail="Canal no encontrado")
        
    active_subs_result = await db.execute(
        select(Subscription).join(Plan).where(
            and_(
                Plan.channel_id == channel_id,
                Subscription.is_active == True,
                Subscription.end_date > datetime.utcnow()
            )
        ).options(selectinload(Subscription.plan), selectinload(Subscription.user))
    )
    active_subs = active_subs_result.scalars().all()
    
    if active_subs:
        if not confirm: raise HTTPException(status_code=400, detail="HAS_ACTIVE_SUBS")
        
        total_refund = 0.0
        for sub in active_subs:
            remaining_days = (sub.end_date - datetime.utcnow()).days
            if remaining_days > 0 and sub.plan.duration_days > 0:
                total_refund += (sub.plan.price / sub.plan.duration_days * remaining_days)
        
        total_cost = total_refund * 1.20
        if current_user.balance < total_cost:
            raise HTTPException(status_code=400, detail="Fondos insuficientes")
            
        current_user.balance -= total_cost
        for sub in active_subs:
            sub.is_active = False
            remaining_days = (sub.end_date - datetime.utcnow()).days
            if remaining_days > 0 and sub.plan.duration_days > 0:
                user_compensation = (sub.plan.price / sub.plan.duration_days * remaining_days) * 1.20
                if sub.user: sub.user.balance += user_compensation
                    
    await db.delete(channel)
    await db.commit()
    return {"status": "deleted", "id": channel_id}

@router.get("/channels/{channel_id}/plans", response_model=List[PlanResponse])
async def get_channel_plans(channel_id: int, current_user: DBUser = Depends(get_current_owner), db: AsyncSessionLocal = Depends(get_db)):
    chan_check = await db.execute(select(Channel).where(and_(Channel.id == channel_id, Channel.owner_id == current_user.id)))
    if not chan_check.scalar_one_or_none(): raise HTTPException(status_code=404)
    result = await db.execute(select(Plan).where(Plan.channel_id == channel_id))
    return result.scalars().all()

@router.post("/channels/{channel_id}/plans", response_model=PlanResponse)
async def create_channel_plan(channel_id: int, data: PlanCreate, current_user: DBUser = Depends(get_current_owner), db: AsyncSessionLocal = Depends(get_db)):
    chan_check = await db.execute(select(Channel).where(and_(Channel.id == channel_id, Channel.owner_id == current_user.id)))
    if not chan_check.scalar_one_or_none(): raise HTTPException(status_code=404)

    new_plan = Plan(channel_id=channel_id, **data.dict(), is_active=True)
    db.add(new_plan)
    await db.commit()
    await db.refresh(new_plan)
    return new_plan

@router.patch("/plans/{plan_id}", response_model=PlanResponse)
async def update_plan(plan_id: int, data: PlanUpdate, current_user: DBUser = Depends(get_current_owner), db: AsyncSessionLocal = Depends(get_db)):
    result = await db.execute(select(Plan).join(Channel).where(and_(Plan.id == plan_id, Channel.owner_id == current_user.id)))
    plan = result.scalar_one_or_none()
    if not plan: raise HTTPException(status_code=404)
    for key, value in data.dict(exclude_unset=True).items():
        setattr(plan, key, value)
    await db.commit()
    return plan

@router.delete("/plans/{plan_id}")
async def delete_plan(plan_id: int, current_user: DBUser = Depends(get_current_owner), db: AsyncSessionLocal = Depends(get_db)):
    result = await db.execute(select(Plan).join(Channel).where(and_(Plan.id == plan_id, Channel.owner_id == current_user.id)))
    plan = result.scalar_one_or_none()
    if not plan: raise HTTPException(status_code=404)
    subs = await db.execute(select(Subscription).where(and_(Subscription.plan_id == plan_id, Subscription.is_active == True)))
    if subs.scalars().first():
        plan.is_active = False
        await db.commit()
        return {"status": "deactivated"}
    await db.delete(plan)
    await db.commit()
    return {"status": "deleted"}

@router.post("/channels/{channel_id}/branding")
async def update_channel_branding(channel_id: int, data: BrandingUpdate, current_user: DBUser = Depends(get_current_owner), db: AsyncSessionLocal = Depends(get_db)):
    result = await db.execute(select(Channel).where(and_(Channel.id == channel_id, Channel.owner_id == current_user.id)))
    channel = result.scalar_one_or_none()
    if not channel: raise HTTPException(status_code=404)
    if data.welcome_message is not None: channel.welcome_message = data.welcome_message
    if data.expiration_message is not None: channel.expiration_message = data.expiration_message
    await db.commit()
    return channel

@router.get("/channels/{channel_id}/promotions", response_model=List[PromotionResponse])
async def get_channel_promotions(channel_id: int, current_user: DBUser = Depends(get_current_owner), db: AsyncSessionLocal = Depends(get_db)):
    chan_check = await db.execute(select(Channel).where(and_(Channel.id == channel_id, Channel.owner_id == current_user.id)))
    if not chan_check.scalar_one_or_none(): raise HTTPException(status_code=403)
    result = await db.execute(select(Promotion).where(Promotion.channel_id == channel_id))
    return result.scalars().all()

@router.post("/channels/{channel_id}/promotions")
async def create_promotion(channel_id: int, data: PromotionCreate, current_user: DBUser = Depends(get_current_owner), db: AsyncSessionLocal = Depends(get_db)):
    chan_check = await db.execute(select(Channel).where(and_(Channel.id == channel_id, Channel.owner_id == current_user.id)))
    if not chan_check.scalar_one_or_none(): raise HTTPException(status_code=403)
    existing = await db.execute(select(Promotion).where(Promotion.code == data.code))
    if existing.scalar_one_or_none(): raise HTTPException(status_code=400, detail="El código ya existe")
    new_promo = Promotion(channel_id=channel_id, **data.dict())
    db.add(new_promo)
    await db.commit()
    return new_promo

@router.delete("/promotions/{promo_id}")
async def delete_promotion(promo_id: int, current_user: DBUser = Depends(get_current_owner), db: AsyncSessionLocal = Depends(get_db)):
    result = await db.execute(select(Promotion).join(Channel).where(and_(Promotion.id == promo_id, Channel.owner_id == current_user.id)))
    promo = result.scalar_one_or_none()
    if not promo: raise HTTPException(status_code=404)
    await db.delete(promo)
    await db.commit()
    return {"status": "deleted"}

@router.post("/withdrawals")
async def request_withdrawal(data: WithdrawalRequest, current_user: DBUser = Depends(get_current_owner), db: AsyncSessionLocal = Depends(get_db)):
    if data.amount > current_user.balance + current_user.affiliate_balance:
        raise HTTPException(status_code=400, detail="Balance insuficiente")
    new_withdrawal = Withdrawal(owner_id=current_user.id, **data.dict(), status="pending")
    if current_user.balance >= data.amount:
        current_user.balance -= data.amount
    else:
        remaining = data.amount - current_user.balance
        current_user.balance = 0
        current_user.affiliate_balance -= remaining
    db.add(new_withdrawal)
    await db.commit()
    return new_withdrawal

@router.get("/withdrawals")
async def get_my_withdrawals(current_user: DBUser = Depends(get_current_owner), db: AsyncSessionLocal = Depends(get_db)):
    result = await db.execute(select(Withdrawal).where(Withdrawal.owner_id == current_user.id).order_by(Withdrawal.created_at.desc()))
    return result.scalars().all()

@router.post("/tickets")
async def create_ticket(data: TicketCreate, current_user: DBUser = Depends(get_current_owner), db: AsyncSessionLocal = Depends(get_db)):
    new_ticket = SupportTicket(user_id=current_user.id, subject=data.subject, priority=data.priority)
    db.add(new_ticket)
    await db.flush()
    initial_msg = TicketMessage(ticket_id=new_ticket.id, sender_id=current_user.id, content=data.content)
    db.add(initial_msg)
    await db.commit()
    return new_ticket

@router.get("/tickets")
async def get_my_tickets(current_user: DBUser = Depends(get_current_owner), db: AsyncSessionLocal = Depends(get_db)):
    result = await db.execute(select(SupportTicket).where(SupportTicket.user_id == current_user.id).order_by(SupportTicket.updated_at.desc()))
    return result.scalars().all()

@router.get("/tickets/{ticket_id}")
async def get_ticket_details(ticket_id: int, current_user: DBUser = Depends(get_current_owner), db: AsyncSessionLocal = Depends(get_db)):
    result = await db.execute(select(SupportTicket).where(and_(SupportTicket.id == ticket_id, SupportTicket.user_id == current_user.id)))
    ticket = result.scalar_one_or_none()
    if not ticket: raise HTTPException(status_code=404)
    msgs = await db.execute(select(TicketMessage).where(TicketMessage.ticket_id == ticket_id).order_by(TicketMessage.created_at.asc()))
    return {"ticket": ticket, "messages": msgs.scalars().all()}

@router.post("/tickets/{ticket_id}/reply")
async def reply_ticket_owner(ticket_id: int, data: MessageCreate, current_user: DBUser = Depends(get_current_owner), db: AsyncSessionLocal = Depends(get_db)):
    result = await db.execute(select(SupportTicket).where(and_(SupportTicket.id == ticket_id, SupportTicket.user_id == current_user.id)))
    ticket = result.scalar_one_or_none()
    if not ticket: raise HTTPException(status_code=404)
    new_msg = TicketMessage(ticket_id=ticket_id, sender_id=current_user.id, content=data.content)
    ticket.status = "open"
    db.add(new_msg)
    await db.commit()
    return {"status": "replied"}
