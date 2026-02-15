from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.future import select
from sqlalchemy import and_, func

from shared.database import get_db, AsyncSessionLocal
from shared.models import (
    User as DBUser,
    Withdrawal,
    SupportTicket,
    TicketMessage,
    Payment,
    SystemConfig as ConfigItem,
    BusinessExpense,
)
from api.schemas.user import UserAdminResponse
from api.schemas.misc import ConfigUpdate, TaxExpenseRequest
from api.deps import get_current_admin

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
    result = await db.execute(select(DBUser).order_by(DBUser.created_at.desc()))
    return result.scalars().all()


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
