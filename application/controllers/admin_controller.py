from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import selectinload
from sqlalchemy.future import select
from sqlalchemy import and_, func

from infrastructure.database.connection import get_db, AsyncSessionLocal
from core.entities import (
    User as DBUser,
    Withdrawal,
    SupportTicket,
    TicketMessage,
    Payment,
    SystemConfig as ConfigItem,
    BusinessExpense,
    AffiliateEarning,
    AffiliateRank
)
from core.entities import OwnerLegalInfo, SignedContract
from application.dto.user import UserAdminResponse
from application.dto.misc import ConfigUpdate, TaxExpenseRequest
from application.middlewares.auth import get_current_admin
from infrastructure.storage.storage_factory import StorageFactory

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/config")
async def get_admin_config(
    current_user: DBUser = Depends(get_current_admin),
    db: AsyncSessionLocal = Depends(get_db),
):
    result = await db.execute(select(ConfigItem))
    return result.scalars().all()


@router.post("/config")
async def update_admin_config(
    data: ConfigUpdate,
    current_user: DBUser = Depends(get_current_admin),
    db: AsyncSessionLocal = Depends(get_db),
):
    result = await db.execute(select(ConfigItem).where(ConfigItem.key == data.key))
    config = result.scalar_one_or_none()
    if not config:
        config = ConfigItem(key=data.key, value=data.value)
        db.add(config)
    else:
        config.value = data.value
    await db.commit()
    return config


@router.get("/withdrawals")
async def get_admin_withdrawals(
    current_user: DBUser = Depends(get_current_admin),
    db: AsyncSessionLocal = Depends(get_db),
):
    result = await db.execute(select(Withdrawal).order_by(Withdrawal.created_at.desc()))
    return result.scalars().all()


@router.post("/withdrawals/{id}/process")
async def process_withdrawal(
    id: int,
    status: str,
    current_user: DBUser = Depends(get_current_admin),
    db: AsyncSessionLocal = Depends(get_db),
):
    result = await db.execute(select(Withdrawal).where(Withdrawal.id == id))
    w = result.scalar_one_or_none()
    if not w:
        raise HTTPException(status_code=404)
    w.status = status
    w.processed_at = datetime.utcnow()
    await db.commit()
    return w


@router.get("/tickets")
async def get_admin_tickets(
    current_user: DBUser = Depends(get_current_admin),
    db: AsyncSessionLocal = Depends(get_db),
):
    result = await db.execute(
        select(SupportTicket).order_by(SupportTicket.updated_at.desc())
    )
    return result.scalars().all()


@router.get("/tickets/{id}")
async def get_admin_ticket_details(
    id: int,
    current_user: DBUser = Depends(get_current_admin),
    db: AsyncSessionLocal = Depends(get_db),
):
    result = await db.execute(select(SupportTicket).where(SupportTicket.id == id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404)
    msgs = await db.execute(
        select(TicketMessage)
        .where(TicketMessage.ticket_id == id)
        .order_by(TicketMessage.created_at.asc())
    )
    return {"ticket": ticket, "messages": msgs.scalars().all()}


@router.post("/tickets/{id}/reply")
async def reply_ticket_admin(
    id: int,
    content: str,
    current_user: DBUser = Depends(get_current_admin),
    db: AsyncSessionLocal = Depends(get_db),
):
    result = await db.execute(select(SupportTicket).where(SupportTicket.id == id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404)
    new_msg = TicketMessage(ticket_id=id, sender_id=current_user.id, content=content)
    ticket.status = "answered"
    db.add(new_msg)
    await db.commit()
    return {"status": "replied"}


@router.get("/users", response_model=List[UserAdminResponse])
async def get_admin_users(
    current_user: DBUser = Depends(get_current_admin),
    db: AsyncSessionLocal = Depends(get_db),
):
    result = await db.execute(
        select(DBUser)
        .options(
            selectinload(DBUser.referrer),
            selectinload(DBUser.legal_info)
        )
        .order_by(DBUser.created_at.desc())
    )
    users = result.scalars().all()
    
    # Map to DTO manually to ensure referrer_name is populated
    response = []
    for u in users:
        referrer_name = None
        if u.referrer:
            referrer_name = u.referrer.full_name or u.referrer.username or u.referrer.email
            
        # Extract Legal Docs & Status
        rut_url = None
        bank_cert_url = None
        chamber_commerce_url = None
        contract_signed = False

        if u.legal_info:
            rut_url = u.legal_info.rut_url
            bank_cert_url = u.legal_info.bank_cert_url
            chamber_commerce_url = u.legal_info.chamber_commerce_url
            contract_signed = u.legal_info.contract_signed

        response.append(UserAdminResponse(
            id=u.id,
            full_name=u.full_name,
            email=u.email,
            is_admin=u.is_admin,
            is_owner=u.is_owner,
            legal_verification_status=u.legal_verification_status,
            created_at=u.created_at,
            referred_by_id=u.referred_by_id,
            referrer_name=referrer_name,
            referral_code=u.referral_code,
            rut_url=rut_url,
            bank_cert_url=bank_cert_url,
            chamber_commerce_url=chamber_commerce_url,
            contract_signed=contract_signed
        ))
    return response


@router.delete("/users/{id}")
async def delete_user_admin(
    id: int,
    current_user: DBUser = Depends(get_current_admin),
    db: AsyncSessionLocal = Depends(get_db),
):
    result = await db.execute(select(DBUser).where(DBUser.id == id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404)
    await db.delete(user)
    await db.commit()
    return {"ok": True}


@router.get("/users/{user_id}/legal")
async def get_user_legal_info(
    user_id: int,
    current_user: DBUser = Depends(get_current_admin),
    db: AsyncSessionLocal = Depends(get_db),
):
    """Get legal info for a specific user (Admin only)"""
    # 1. Get Base Legal Info
    result = await db.execute(select(OwnerLegalInfo).where(OwnerLegalInfo.owner_id == user_id))
    info = result.scalar_one_or_none()
    
    if not info:
        return {"has_legal": False}
    
    # 2. Check if there is ANY signed contract in the SignedContract table
    # This acts as a fallback if owner_legal_info.contract_signed is false due to sync issues
    contract_res = await db.execute(
        select(SignedContract).where(SignedContract.owner_id == user_id).limit(1)
    )
    has_signed_contract = contract_res.scalar_one_or_none() is not None or info.contract_signed
    
    # Map to schema
    return {
        "has_legal": True,
        "person_type": info.person_type,
        "full_legal_name": info.full_legal_name,
        "id_type": info.id_type,
        "id_number": info.id_number,
        "business_name": info.business_name,
        "nit": info.nit,
        "legal_rep_name": info.legal_rep_name,
        "legal_rep_id": info.legal_rep_id,
        "address": info.address,
        "city": info.city,
        "department": info.department,
        "phone": info.phone,
        "bank_name": info.bank_name,
        "account_type": info.account_type,
        "account_number": info.account_number,
        "account_holder_name": info.account_holder_name,
        "rut_url": info.rut_url,
        "bank_cert_url": info.bank_cert_url,
        "chamber_commerce_url": info.chamber_commerce_url,
        "contract_pdf_url": f"/admin/users/{user_id}/contract" if has_signed_contract else None,
        "signed_at": info.contract_signed_at.isoformat() if info.contract_signed_at else None
    }


@router.get("/users/{user_id}/contract")
async def get_user_signed_contract_pdf(
    user_id: int,
    current_user: DBUser = Depends(get_current_admin),
    db: AsyncSessionLocal = Depends(get_db),
):
    """Generates and serves the signed contract PDF for a user (Admin only)"""
    # 1. Get Legal Info
    res_legal = await db.execute(select(OwnerLegalInfo).where(OwnerLegalInfo.owner_id == user_id))
    info = res_legal.scalar_one_or_none()
    
    if not info:
        raise HTTPException(status_code=404, detail="Legal info not found")
        
    # 2. Get Signature Data from the latest SignedContract record
    res_contract = await db.execute(
        select(SignedContract)
        .where(SignedContract.owner_id == user_id)
        .order_by(SignedContract.signed_at.desc())
    )
    contract = res_contract.scalar_one_or_none()
    
    # Fallback logic if OwnerLegalInfo says it's signed but no record in SignedContract
    if not contract and not info.contract_signed:
        raise HTTPException(status_code=404, detail="Signed contract not found")
        
    if not contract:
        # Fallback if SignedContract is missing but OwnerLegalInfo says signed
        signature_data = {
            "signature_date": info.contract_signed_at or datetime.utcnow(),
            "signature_code": info.contract_signature_method or "OTP",
            "telegram_user_id": "N/A",
            "ip_address": "N/A",
            "document_hash": "N/A",
            "blockchain_tx_hash": None,
            "blockchain_network": "polygon",
            "contract_id": f"CTR-{user_id}-LEGACY",
        }
    else:
        signature_data = {
            "signature_date": contract.signed_at,
            "signature_code": contract.signature_code,
            "telegram_user_id": contract.signature_telegram_user_id,
            "ip_address": contract.signature_ip_address,
            "document_hash": contract.pdf_hash,
            "blockchain_tx_hash": contract.blockchain_tx_hash,
            "blockchain_network": contract.blockchain_network,
            "contract_id": f"CTR-{user_id}-{int(contract.signed_at.timestamp())}",
        }

    # 3. Intentar obtener de Storage
    storage = StorageFactory.get_provider()
    pdf_bytes = None
    
    if contract and contract.pdf_url:
        try:
            # Wrap entire storage access in try/except to prevent crash on file_exists or read
            if storage.file_exists(contract.pdf_url):
                pdf_bytes = await storage.read_file(contract.pdf_url)
        except Exception as e:
            logging.error(f"Error accessing contract from storage (proceeding to regen): {e}")

    # 4. Fallback: Generar PDF on the fly si no existe o falló la lectura
    if not pdf_bytes:
        from api.services.pdf_service import PDFContractService
        import asyncio
        loop = asyncio.get_running_loop()
        pdf_bytes = await loop.run_in_executor(None, PDFContractService.generate_contract_pdf, info.__dict__, signature_data)
        
        # Opcional: Guardar en storage para la próxima
        if contract and contract.pdf_url:
             await storage.save_file(pdf_bytes, contract.pdf_url)
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=contract_{user_id}.pdf"},
    )


@router.get("/tax/summary")
async def get_tax_summary(
    year: int = None,
    current_user: DBUser = Depends(get_current_admin),
    db: AsyncSessionLocal = Depends(get_db),
):
    if not year:
        year = datetime.utcnow().year
    start_date = datetime(year, 1, 1)
    end_date = datetime(year, 12, 31, 23, 59, 59)
    revenue_query = await db.execute(
        select(func.sum(Payment.platform_amount)).where(
            and_(
                Payment.status == "completed",
                Payment.created_at >= start_date,
                Payment.created_at <= end_date,
            )
        )
    )
    gross_revenue = revenue_query.scalar() or 0.0
    expense_query = await db.execute(
        select(BusinessExpense).where(
            and_(
                BusinessExpense.user_id == current_user.id,
                BusinessExpense.date >= start_date,
                BusinessExpense.date <= end_date,
            )
        )
    )
    expenses = expense_query.scalars().all()
    total_expenses = sum(e.amount for e in expenses)
    categories = {}
    for e in expenses:
        categories[e.category] = categories.get(e.category, 0) + e.amount
    return {
        "year": year,
        "gross_revenue": gross_revenue,
        "total_expenses": total_expenses,
        "net_income": gross_revenue - total_expenses,
        "expenses_by_category": categories,
    }


@router.get("/expenses")
async def get_expenses(
    year: int = None,
    current_user: DBUser = Depends(get_current_admin),
    db: AsyncSessionLocal = Depends(get_db),
):
    query = select(BusinessExpense).where(BusinessExpense.user_id == current_user.id)
    if year:
        start_date, end_date = datetime(year, 1, 1), datetime(year, 12, 31, 23, 59, 59)
        query = query.where(
            and_(BusinessExpense.date >= start_date, BusinessExpense.date <= end_date)
        )
    result = await db.execute(query.order_by(BusinessExpense.date.desc()))
    return result.scalars().all()


@router.post("/expenses")
async def create_expense(
    data: TaxExpenseRequest,
    current_user: DBUser = Depends(get_current_admin),
    db: AsyncSessionLocal = Depends(get_db),
):
    new_expense = BusinessExpense(
        user_id=current_user.id, **data.dict(), currency="USD"
    )
    db.add(new_expense)
    await db.commit()
    await db.refresh(new_expense)
    return new_expense


@router.delete("/expenses/{expense_id}")
async def delete_expense(
    expense_id: int,
    current_user: DBUser = Depends(get_current_admin),
    db: AsyncSessionLocal = Depends(get_db),
):
    result = await db.execute(
        select(BusinessExpense).where(
            and_(
                BusinessExpense.id == expense_id,
                BusinessExpense.user_id == current_user.id,
            )
        )
    )
    expense = result.scalar_one_or_none()
    if not expense:
        raise HTTPException(status_code=404)
    await db.delete(expense)
    await db.commit()
    return {"ok": True}


# --- Affiliate Monitoring ---

@router.get("/affiliates/stats")
async def get_admin_affiliate_stats(
    current_user: DBUser = Depends(get_current_admin),
    db: AsyncSessionLocal = Depends(get_db),
):
    """Global affiliate metrics for Admin"""
    # Total commissions paid through the platform
    total_earnings_res = await db.execute(select(func.sum(AffiliateEarning.amount)))
    total_paid = total_earnings_res.scalar() or 0.0

    # Count of users who have referred at least one person
    recruiters_count_res = await db.execute(
        select(func.count(func.distinct(DBUser.referred_by_id)))
        .where(DBUser.referred_by_id.is_not(None))
    )
    total_recruiters = recruiters_count_res.scalar() or 0

    # Total earnings by level
    levels_res = await db.execute(
        select(AffiliateEarning.level, func.sum(AffiliateEarning.amount))
        .group_by(AffiliateEarning.level)
        .order_by(AffiliateEarning.level)
    )
    earnings_by_level = [{"level": r[0], "amount": r[1]} for r in levels_res.all()]

    return {
        "total_commissions_paid": total_paid,
        "active_recruiters": total_recruiters,
        "earnings_by_level": earnings_by_level
    }


@router.get("/affiliates/ledger")
async def get_admin_affiliate_ledger(
    limit: int = 50,
    offset: int = 0,
    current_user: DBUser = Depends(get_current_admin),
    db: AsyncSessionLocal = Depends(get_db),
):
    """A master feed of all affiliate earning events"""
    result = await db.execute(
        select(AffiliateEarning)
        .options(
            selectinload(AffiliateEarning.affiliate),
            selectinload(AffiliateEarning.payment).selectinload(Payment.user)
        )
        .order_by(AffiliateEarning.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    earnings = result.scalars().all()

    ledger_data = []
    for earn in earnings:
        ledger_data.append({
            "id": earn.id,
            "affiliate_name": earn.affiliate.full_name or earn.affiliate.username if earn.affiliate else "N/A",
            "affiliate_id": earn.affiliate_id,
            "source_user": earn.payment.user.username if earn.payment and earn.payment.user else "N/A",
            "amount": earn.amount,
            "level": earn.level,
            "created_at": earn.created_at.isoformat(),
            "payment_id": earn.payment_id
        })

    return ledger_data


@router.get("/affiliates/tree/{user_id}")
async def get_admin_user_tree(
    user_id: int,
    current_user: DBUser = Depends(get_current_admin),
    db: AsyncSessionLocal = Depends(get_db),
):
    """Fetch the network tree for any user (Admin only)"""
    from api.routes.affiliate import get_recursive_downline
    
    # Check if user exists
    user_res = await db.execute(select(DBUser).where(DBUser.id == user_id))
    user = user_res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    network_tree = await get_recursive_downline(db, user_id, max_depth=10)
    
    return {
        "user_id": user.id,
        "root_name": user.full_name or user.username,
        "children": network_tree
    }


# --- Dynamic Rank Configuration ---

from pydantic import BaseModel

class RankCreate(BaseModel):
    name: str
    min_referrals: int
    max_depth: int = 1
    bonus_percentage: float = 0.0
    icon: str = None

class RankResponse(RankCreate):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True

@router.get("/ranks", response_model=List[RankResponse])
async def get_admin_ranks(
    current_user: DBUser = Depends(get_current_admin),
    db: AsyncSessionLocal = Depends(get_db),
):
    """List all configured affiliate ranks"""
    result = await db.execute(select(AffiliateRank).order_by(AffiliateRank.min_referrals.asc()))
    return result.scalars().all()

@router.post("/ranks", response_model=RankResponse)
async def create_admin_rank(
    rank: RankCreate,
    current_user: DBUser = Depends(get_current_admin),
    db: AsyncSessionLocal = Depends(get_db),
):
    """Create a new affiliate rank"""
    # Check if name or min_referrals already exists
    existing = await db.execute(
        select(AffiliateRank).where(
            (AffiliateRank.name == rank.name) | (AffiliateRank.min_referrals == rank.min_referrals)
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Rank name or referral count already exists")
    
    new_rank = AffiliateRank(**rank.dict())
    db.add(new_rank)
    await db.commit()
    await db.refresh(new_rank)
    return new_rank

@router.put("/ranks/{rank_id}", response_model=RankResponse)
async def update_admin_rank(
    rank_id: int,
    rank_data: RankCreate,
    current_user: DBUser = Depends(get_current_admin),
    db: AsyncSessionLocal = Depends(get_db),
):
    """Update an existing affiliate rank"""
    rank = await db.get(AffiliateRank, rank_id)
    if not rank:
        raise HTTPException(status_code=404, detail="Rank not found")
    
    # Check if name or min_referrals is taken by ANOTHER rank
    conflict = await db.execute(
        select(AffiliateRank).where(
            and_(
                (AffiliateRank.name == rank_data.name) | (AffiliateRank.min_referrals == rank_data.min_referrals),
                AffiliateRank.id != rank_id
            )
        )
    )
    if conflict.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Rank name or referral count already exists")

    rank.name = rank_data.name
    rank.min_referrals = rank_data.min_referrals
    rank.max_depth = rank_data.max_depth
    rank.bonus_percentage = rank_data.bonus_percentage
    rank.icon = rank_data.icon

    await db.commit()
    await db.refresh(rank)
    return rank

@router.delete("/ranks/{rank_id}")
async def delete_admin_rank(
    rank_id: int,
    current_user: DBUser = Depends(get_current_admin),
    db: AsyncSessionLocal = Depends(get_db),
):
    """Delete an affiliate rank"""
    rank = await db.get(AffiliateRank, rank_id)
    if not rank:
        raise HTTPException(status_code=404, detail="Rank not found")
    
    await db.delete(rank)
    await db.commit()
    return {"ok": True}


# --- Manual Network Management ---

class UplineUpdate(BaseModel):
    referrer_id: int

@router.patch("/users/{user_id}/uplink")
async def update_user_uplink(
    user_id: int,
    data: UplineUpdate,
    current_user: DBUser = Depends(get_current_admin),
    db: AsyncSessionLocal = Depends(get_db),
):
    """Manually assign or change a user's referrer (Upline)"""
    # 1. Get Target User
    user = await db.get(DBUser, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # 2. Get New Referrer
    referrer = await db.get(DBUser, data.referrer_id)
    if not referrer:
        raise HTTPException(status_code=404, detail="Referrer not found")
    
    # prevent self-referral
    if user.id == referrer.id:
        raise HTTPException(status_code=400, detail="User cannot refer themselves")
        
    # Prevent circular reference (simple check)
    if referrer.referred_by_id == user.id:
        raise HTTPException(status_code=400, detail="Circular reference detected")

    # Update
    user.referred_by_id = referrer.id
    await db.commit()
    
    return {"ok": True, "new_referrer": referrer.full_name or referrer.username}


@router.get("/payments/pending")
async def get_pending_payments(
    current_user: DBUser = Depends(get_current_admin),
    db: AsyncSessionLocal = Depends(get_db),
):
    """List all pending payments (Crypto/Manual)"""
    result = await db.execute(
        select(Payment)
        .where(Payment.status == "pending")
        .order_by(Payment.created_at.desc())
    )
    return result.scalars().all()


@router.post("/payments/{payment_id}/verify-crypto")
async def verify_crypto_payment(
    payment_id: int,
    current_user: DBUser = Depends(get_current_admin),
    db: AsyncSessionLocal = Depends(get_db),
):
    """Verify a crypto payment manually and activate membership"""
    from api.services.membership_service import activate_membership

    result = await db.execute(select(Payment).where(Payment.id == payment_id))
    payment = result.scalar_one_or_none()

    if not payment:
        raise HTTPException(status_code=404, detail="Pago no encontrado")

    if payment.status != "pending":
        raise HTTPException(status_code=400, detail="El pago ya fue procesado")

    # Activa membresía vinculando el pago verificado
    promo_id = None
    try:
        # Extraer promo_id de la referencia si existe (formato user_1_plan_2_p_3_timestamp)
        # Monolith reference: user_{data.user_id}_plan_{data.plan_id}_p_{data.promo_id or 0}_{timestamp}
        parts = payment.reference.split("_")
        if len(parts) >= 6 and parts[4] == "p":
            promo_id_val = int(parts[5])
            if promo_id_val > 0:
                promo_id = promo_id_val
    except Exception:
        pass

    await activate_membership(
        user_id=payment.user_id,
        plan_id=payment.plan_id,
        db=db,
        promo_id=promo_id,
        provider_tx_id=f"CRYPTO_VERIFIED_{payment_id}",
        method="crypto",
    )



    payment.status = "completed"
    await db.commit()
    return {"status": "verified", "payment_id": payment_id}
