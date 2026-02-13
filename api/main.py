import os
import stripe
from datetime import datetime, timedelta
from typing import List, Optional

from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
import bcrypt  # Direct usage instead of passlib
from pydantic import BaseModel
from sqlalchemy.future import select
from sqlalchemy import func, and_
from sqlalchemy.exc import IntegrityError
import hashlib
import httpx
import logging
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests


import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from shared.database import init_db, get_db, AsyncSessionLocal
from shared.models import User as DBUser, Subscription, Payment, Plan, Channel, Withdrawal, AffiliateEarning, SupportTicket, Promotion, RegistrationToken
from shared.accounting import distribute_payment_funds, get_affiliate_tier_info

# Importar router de firma digital
from api.routes.legal import router as legal_router

# Configuración de Seguridad
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY environment variable is not set")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 1 día

# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Configuración Stripe/SaaS
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
PLATFORM_FEE_PERCENT = float(os.getenv("PLATFORM_FEE_PERCENT", "0.20"))

# Configuración Wompi
WOMPI_PUBLIC_KEY = os.getenv("WOMPI_PUBLIC_KEY")
WOMPI_PRIVATE_KEY = os.getenv("WOMPI_PRIVATE_KEY")
WOMPI_INTEGRITY_SECRET = os.getenv("WOMPI_INTEGRITY_SECRET")
WOMPI_EVENTS_SECRET = os.getenv("WOMPI_EVENTS_SECRET")
WOMPI_API_BASE = "https://sandbox.wompi.co/v1" # Cambiar a production en prod

# --- Modelos Pydantic ---
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

class ChannelCreate(BaseModel):
    title: str

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

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

class PasswordUpdate(BaseModel):
    current_password: Optional[str] = None
    new_password: str

class PromotionCreate(BaseModel):
    code: str
    promo_type: str # 'discount' or 'trial'
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

class MessageCreate(BaseModel):
    content: str

class PaymentRequest(BaseModel):
    plan_id: int
    user_id: int
    method: str # 'stripe', 'wompi', 'crypto'
    promo_id: Optional[int] = None

class TicketResponse(BaseModel):
    id: int
    subject: str
    status: str
    priority: str
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

class BrandingUpdate(BaseModel):
    welcome_message: Optional[str] = None
    expiration_message: Optional[str] = None

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

# --- Utilidades de Auth ---
def verify_password(plain_password, hashed_password):
    # bcrypt.checkpw expects bytes. ensure encoding.
    if isinstance(hashed_password, str):
        hashed_password = hashed_password.encode('utf-8')
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password)

def get_hashed_password(password):
    # bcrypt.hashpw returns bytes, decode to store as string
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_magic_link_token(user_email: str):
    expire = datetime.utcnow() + timedelta(minutes=5)
    to_encode = {"sub": user_email, "type": "magic_link", "exp": expire}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_owner(token: str = Depends(oauth2_scheme), db: AsyncSessionLocal = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    result = await db.execute(select(DBUser).where(DBUser.email == email))
    user = result.scalar_one_or_none()
    if user is None or not user.is_owner:
        raise credentials_exception
    return user

# Alias para compatibilidad con otros módulos
get_current_user = get_current_owner

# --- Aplicación FastAPI ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(title="TeleGate API", lifespan=lifespan)

# Montar router de firma digital e inyectar dependencias
import api.routes.legal
api.routes.legal.get_current_user = get_current_owner
app.include_router(legal_router)

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8080",
        "https://full-techno-channels--full-techno-channels.us-central1.hosted.app",
        "https://full-techno-channels.web.app",
        "https://full-techno-channels.firebaseapp.com",
        "https://telegate.fulltechnohub.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Health Check Endpoint ---
@app.get("/health")
async def api_health_check():
    """API-specific health check with database validation"""
    from sqlalchemy import text
    
    health_status = {
        "service": "TeleGate API",
        "status": "healthy",
        "components": {
            "database": {"status": "unknown"},
            "stripe": {"status": "configured" if STRIPE_WEBHOOK_SECRET else "not_configured"}
        }
    }
    
    # Test database
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
            health_status["components"]["database"] = {"status": "healthy"}
    except Exception as e:
        health_status["status"] = "unhealthy"
        health_status["components"]["database"] = {"status": "unhealthy", "error": str(e)}
        from fastapi import Response
        return Response(content=str(health_status), status_code=503)
    
    return health_status



# --- Endpoints de Autenticación ---

@app.post("/auth/generate-registration-token")
async def generate_registration_token(data: GenerateTokenRequest, db: AsyncSessionLocal = Depends(get_db)):
    # 1. Check if Telegram ID already linked to a user
    user_res = await db.execute(select(DBUser).where(DBUser.telegram_id == data.telegram_id))
    if user_res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Este usuario de Telegram ya está registrado.")

    # 2. Generate Token (6 digits)
    import random
    token = str(random.randint(100000, 999999))
    
    # 3. Store
    new_token = RegistrationToken(
        token=token,
        telegram_id=data.telegram_id,
        username=data.username,
        full_name=data.full_name,
        expires_at=datetime.utcnow() + timedelta(minutes=15)
    )
    db.add(new_token)
    await db.commit()
    
    return {"token": token}

@app.post("/register", response_model=Token)
async def register_owner(user_data: UserRegister, db: AsyncSessionLocal = Depends(get_db)):
    # Verificar si ya existe
    result = await db.execute(select(DBUser).where(DBUser.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Este email ya está registrado")
    
    referred_by_id = None
    if user_data.referral_code:
        ref_result = await db.execute(select(DBUser).where(DBUser.referral_code == user_data.referral_code))
        referrer = ref_result.scalar_one_or_none()
        if referrer:
            referred_by_id = referrer.id

    telegram_id = None
    if user_data.registration_token:
        token_res = await db.execute(select(RegistrationToken).where(and_(RegistrationToken.token == user_data.registration_token, RegistrationToken.expires_at > datetime.utcnow())))
        token_obj = token_res.scalar_one_or_none()
        if not token_obj:
            raise HTTPException(status_code=400, detail="Token de registro inválido o expirado")
        telegram_id = token_obj.telegram_id
        await db.delete(token_obj) # Consume token

    new_owner = DBUser(
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=get_hashed_password(user_data.password),
        is_owner=True,
        referred_by_id=referred_by_id,
        telegram_id=telegram_id
    )
    db.add(new_owner)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Este email ya está registrado")
    
    access_token = create_access_token(data={"sub": new_owner.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/auth/google", response_model=Token)
async def google_auth(auth_data: GoogleAuthRequest, db: AsyncSessionLocal = Depends(get_db)):
    """
    Verifica el token de Google, vincula o crea un usuario y retorna un JWT.
    """
    try:
        # Obtener el Client ID desde las variables de entorno
        CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
        if not CLIENT_ID:
            print("⚠️ WARNING: GOOGLE_CLIENT_ID not set. Basic verification fallback (NOT RECOMMENDED FOR PROD).")
            # En modo sin CLIENT_ID, google-auth fallará si no se provee.
            # Para facilitar el setup inicial, podríamos saltar la verificación SI estamos en dev,
            # pero es mejor forzar la configuración.
        
        # Verificar el token con Google
        idinfo = id_token.verify_oauth2_token(
            auth_data.credential, 
            google_requests.Request(), 
            CLIENT_ID
        )

        # Extraer información del token
        google_id = idinfo['sub']
        email = idinfo['email']
        name = idinfo.get('name', email.split('@')[0])
        avatar = idinfo.get('picture')

        # 1. Buscar por google_id
        result = await db.execute(select(DBUser).where(DBUser.google_id == google_id))
        user = result.scalar_one_or_none()

        if not user:
            # 2. Buscar por email para vincular cuenta existente
            result = await db.execute(select(DBUser).where(DBUser.email == email))
            user = result.scalar_one_or_none()
            
            if user:
                # Vincular
                user.google_id = google_id
                if not user.avatar_url:
                    user.avatar_url = avatar
            else:
                # 3. Crear nuevo usuario (Owner)
                referred_by_id = None
                if auth_data.referral_code:
                    ref_result = await db.execute(select(DBUser).where(DBUser.referral_code == auth_data.referral_code))
                    referrer = ref_result.scalar_one_or_none()
                    if referrer:
                        referred_by_id = referrer.id

                telegram_id = None
                if auth_data.registration_token:
                    token_res = await db.execute(select(RegistrationToken).where(and_(RegistrationToken.token == auth_data.registration_token, RegistrationToken.expires_at > datetime.utcnow())))
                    token_obj = token_res.scalar_one_or_none()
                    if token_obj:
                        telegram_id = token_obj.telegram_id
                        await db.delete(token_obj)

                user = DBUser(
                    email=email,
                    full_name=name,
                    google_id=google_id,
                    avatar_url=avatar,
                    is_owner=True,
                    email_verified=True,
                    referred_by_id=referred_by_id,
                    telegram_id=telegram_id
                )
                db.add(user)
            
            await db.commit()
            await db.refresh(user)

        # Generar token de TeleGate
        access_token = create_access_token(data={"sub": user.email})
        return {"access_token": access_token, "token_type": "bearer"}

    except ValueError as e:
        print(f"❌ Google Token Validation Error: {e}")
        raise HTTPException(status_code=400, detail="Token de Google inválido")
    except Exception as e:
        print(f"❌ Error in /auth/google: {e}")
        raise HTTPException(status_code=500, detail="Error de autenticación social")

@app.post("/auth/magic-link-token")
async def generate_magic_link_token(data: CreateMagicLinkRequest, db: AsyncSessionLocal = Depends(get_db)):
    """
    Called by the BOT to generate a short-lived token for a user.
    """
    # Verify user exists and has this Telegram ID
    result = await db.execute(select(DBUser).where(DBUser.telegram_id == data.telegram_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    if not user.is_owner:
         raise HTTPException(status_code=403, detail="Solo para creadores de contenido")

    token = create_magic_link_token(user.email)
    return {"token": token}

@app.post("/auth/magic-login", response_model=Token)
async def magic_login(token: str, db: AsyncSessionLocal = Depends(get_db)):
    """
    Called by the FRONTEND to exchange a magic token for a session token.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Enlace inválido o expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if email is None or token_type != "magic_link":
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception
        
    # Check if user still exists
    result = await db.execute(select(DBUser).where(DBUser.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise credentials_exception
        
    # Generate standard access token with recovery flag
    access_token = create_access_token(data={"sub": user.email, "recovery": True})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSessionLocal = Depends(get_db)):
    result = await db.execute(select(DBUser).where(DBUser.email == form_data.username))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

async def get_current_admin(current_user: DBUser = Depends(get_current_owner)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="No tienes permisos de administrador")
    return current_user

# --- Endpoints de Administración ---

@app.get("/admin/config")
async def get_admin_config(current_user: DBUser = Depends(get_current_admin), db: AsyncSessionLocal = Depends(get_db)):
    result = await db.execute(select(SystemConfig))
    configs = result.scalars().all()
    # Si la tabla está vacía, podríamos devolver valores por defecto para que el front los vea
    return configs

class ConfigUpdate(BaseModel):
    key: str
    value: float

@app.post("/admin/config")
async def update_config(data: ConfigUpdate, current_user: DBUser = Depends(get_current_admin), db: AsyncSessionLocal = Depends(get_db)):
    result = await db.execute(select(SystemConfig).where(SystemConfig.key == data.key))
    config = result.scalar_one_or_none()
    
    if config:
        config.value = data.value
    else:
        config = SystemConfig(key=data.key, value=data.value)
        db.add(config)
    
    await db.commit()
    return {"status": "updated", "key": data.key, "value": data.value}

@app.get("/admin/users", response_model=List[UserAdminResponse])
async def get_all_users(current_user: DBUser = Depends(get_current_admin), db: AsyncSessionLocal = Depends(get_db)):
    result = await db.execute(select(DBUser).where(DBUser.is_owner == True).order_by(DBUser.created_at.desc()))
    return result.scalars().all()

@app.get("/admin/withdrawals")
async def get_all_withdrawals(current_user: DBUser = Depends(get_current_admin), db: AsyncSessionLocal = Depends(get_db)):
    result = await db.execute(select(Withdrawal).order_by(Withdrawal.created_at.desc()))
    return result.scalars().all()

class WithdrawalProcess(BaseModel):
    status: str # "completed" o "rejected"

@app.post("/admin/withdrawals/{withdrawal_id}/process")
async def process_withdrawal(withdrawal_id: int, data: WithdrawalProcess, current_user: DBUser = Depends(get_current_admin), db: AsyncSessionLocal = Depends(get_db)):
    result = await db.execute(select(Withdrawal).where(Withdrawal.id == withdrawal_id))
    withdrawal = result.scalar_one_or_none()
    
    if not withdrawal:
        raise HTTPException(status_code=404, detail="Retiro no encontrado")
    
    if withdrawal.status != "pending":
        raise HTTPException(status_code=400, detail="El retiro ya fue procesado")

    if data.status == "completed" and withdrawal.method.lower() == "wompi":
        # Intentar pago automático vía Wompi Dispersiones
        amount_in_cop = int(withdrawal.amount * 4000)
        payload = {
            "amount_in_cents": amount_in_cop * 100,
            "currency": "COP",
            "reference": f"payout_wompi_{withdrawal.id}_{int(datetime.utcnow().timestamp())}",
            "payment_description": f"Retiro VIP #{withdrawal.id}",
            "beneficiary_details": {
                "account_number": withdrawal.details,
                "account_type": "NEQUI",
                "beneficiary_type": "PERSON",
                "identification_tuple": {"type": "CC", "number": "00000000"},
                "full_name": "VIP Member"
            }
        }
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {WOMPI_PRIVATE_KEY}"}
            resp = await client.post(f"{WOMPI_API_BASE}/payouts", json=payload, headers=headers)
            if resp.status_code != 201:
                raise HTTPException(status_code=400, detail=f"Error en Dispersión Wompi: {resp.text}")

    withdrawal.status = data.status
    withdrawal.processed_at = datetime.utcnow()
    
    if data.status == "rejected":
        # Devolvemos el dinero al balance
        owner_result = await db.execute(select(DBUser).where(DBUser.id == withdrawal.owner_id))
        owner = owner_result.scalar_one_or_none()
        if owner:
            owner.balance += withdrawal.amount

    await db.commit()
    return withdrawal

@app.get("/admin/payments/pending")
async def get_pending_payments(current_user: DBUser = Depends(get_current_admin), db: AsyncSessionLocal = Depends(get_db)):
    result = await db.execute(select(Payment).where(Payment.status == "pending").order_by(Payment.created_at.desc()))
    return result.scalars().all()

@app.post("/admin/payments/{payment_id}/verify-crypto")
async def verify_crypto_payment(payment_id: int, current_user: DBUser = Depends(get_current_admin), db: AsyncSessionLocal = Depends(get_db)):
    result = await db.execute(select(Payment).where(Payment.id == payment_id))
    payment = result.scalar_one_or_none()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Pago no encontrado")
    
    if payment.status != "pending":
        raise HTTPException(status_code=400, detail="El pago ya fue procesado")

    # Activar membresía usando el helper centralizado
    promo_id = None
    try:
        parts = payment.reference.split("_")
        promo_id_val = int(parts[5])
        if promo_id_val > 0:
            promo_id = promo_id_val
    except:
        pass

    await activate_membership(
        user_id=payment.user_id,
        plan_id=payment.plan_id,
        db=db,
        promo_id=promo_id,
        provider_tx_id=f"CRYPTO_VERIFIED_{payment_id}",
        method="crypto"
    )
    
    payment.status = "completed"
    await db.commit()
    return {"status": "verified", "payment_id": payment_id}

@app.get("/admin/tickets")
async def get_all_tickets(current_user: DBUser = Depends(get_current_admin), db: AsyncSessionLocal = Depends(get_db)):
    result = await db.execute(select(SupportTicket).order_by(SupportTicket.updated_at.desc()))
    return result.scalars().all()

@app.get("/admin/tickets/{ticket_id}")
async def get_ticket_admin(ticket_id: int, current_user: DBUser = Depends(get_current_admin), db: AsyncSessionLocal = Depends(get_db)):
    result = await db.execute(select(SupportTicket).where(SupportTicket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket: raise HTTPException(status_code=404)
    
    msgs_result = await db.execute(select(TicketMessage).where(TicketMessage.ticket_id == ticket_id).order_by(TicketMessage.created_at.asc()))
    messages = msgs_result.scalars().all()
    return {"ticket": ticket, "messages": messages}

@app.post("/admin/tickets/{ticket_id}/reply")
async def reply_ticket_admin(ticket_id: int, data: MessageCreate, current_user: DBUser = Depends(get_current_admin), db: AsyncSessionLocal = Depends(get_db)):
    result = await db.execute(select(SupportTicket).where(SupportTicket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket: raise HTTPException(status_code=404)

    new_msg = TicketMessage(ticket_id=ticket_id, sender_id=current_user.id, content=data.content)
    ticket.status = "pending" # Pendiente de acción del usuario
    db.add(new_msg)
    await db.commit()
    
    # Notificar al usuario dueño del ticket si tiene TG vinculado
    owner_result = await db.execute(select(DBUser).where(DBUser.id == ticket.user_id))
    owner = owner_result.scalar_one_or_none()
    if owner and owner.telegram_id:
        from shared.notifications import send_telegram_notification
        await send_telegram_notification(owner.telegram_id, f"🎫 *Tu ticket ha sido respondido*\n\nAsunto: {ticket.subject}\n\nRevisa tu dashboard para ver la respuesta.")
    
    return {"status": "replied"}

# --- Endpoints de Dueño ---

@app.get("/owner/dashboard/summary", response_model=DashboardSummary)
async def get_owner_summary(current_user: DBUser = Depends(get_current_owner), db: AsyncSessionLocal = Depends(get_db)):
    # 1. Canales Activos
    channels_result = await db.execute(
        select(func.count(Channel.id)).where(Channel.owner_id == current_user.id)
    )
    active_channels = channels_result.scalar() or 0
    
    # 2. Suscriptores Activos (en todos sus canales)
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
    
    # 3. Ingresos Mensuales (últimos 30 días)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    rev_result = await db.execute(
        select(func.sum(Payment.owner_amount)).join(Plan, Payment.plan_id == Plan.id).join(Channel).where(
            and_(
                Channel.owner_id == current_user.id,
                Payment.status == "completed",
                Payment.created_at >= thirty_days_ago
            )
        )
    )
    monthly_revenue = rev_result.scalar() or 0.0
    
    # 4. Info de Afiliados
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

@app.put("/owner/profile")
async def update_profile(data: ProfileUpdate, current_user: DBUser = Depends(get_current_owner), db: AsyncSessionLocal = Depends(get_db)):
    if data.full_name is not None:
        current_user.full_name = data.full_name
    if data.avatar_url is not None:
        current_user.avatar_url = data.avatar_url
    await db.commit()
    return {"status": "success"}

@app.put("/owner/password")
async def update_password(
    data: PasswordUpdate, 
    current_user: DBUser = Depends(get_current_owner), 
    db: AsyncSessionLocal = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    # Decodificar el token para ver si es recovery
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        is_recovery = payload.get("recovery", False)
    except:
        is_recovery = False

    # Solo exigimos contraseña actual si NO es un flujo de recuperación
    if not is_recovery:
        if not data.current_password:
             raise HTTPException(status_code=400, detail="Se requiere la contraseña actual")
        
        if not current_user.hashed_password:
            # Caso raro: usuario sin contraseña (solo Google) intentando poner una
            pass
        elif not verify_password(data.current_password, current_user.hashed_password):
            raise HTTPException(status_code=400, detail="Contraseña actual incorrecta")
            
    current_user.hashed_password = get_hashed_password(data.new_password)
    await db.commit()
    return {"status": "success", "message": "Contraseña actualizada correctamente"}

@app.get("/owner/channels")
async def get_owner_channels(current_user: DBUser = Depends(get_current_owner), db: AsyncSessionLocal = Depends(get_db)):
    result = await db.execute(
        select(Channel).where(Channel.owner_id == current_user.id)
    )
    channels = result.scalars().all()
    return channels

@app.post("/owner/channels")
async def create_channel(channel_data: ChannelCreate, current_user: DBUser = Depends(get_current_owner), db: AsyncSessionLocal = Depends(get_db)):
    import secrets
    # Generar código único de validación para el bot
    validation_code = f"V-{secrets.token_hex(2).upper()}-{secrets.token_hex(1).upper()}"
    
    new_channel = Channel(
        owner_id=current_user.id,
        title=channel_data.title,
        validation_code=validation_code,
        is_verified=False
    )
    db.add(new_channel)
    await db.commit()
    await db.refresh(new_channel)
    return new_channel

@app.get("/owner/channels/{channel_id}/delete-cost")
async def check_channel_delete_cost(channel_id: int, current_user: DBUser = Depends(get_current_owner), db: AsyncSessionLocal = Depends(get_db)):
    # Calculate cancellation cost
    active_subs_result = await db.execute(
        select(Subscription).join(Plan).where(
            and_(
                Plan.channel_id == channel_id,
                Subscription.is_active == True,
                Subscription.end_date > datetime.utcnow()
            )
        )
    )
    active_subs = active_subs_result.scalars().all()
    
    total_refund = 0.0
    affected_users = len(active_subs)
    
    for sub in active_subs:
        # Calculate pro-rated refund
        remaining_days = (sub.end_date - datetime.utcnow()).days
        if remaining_days > 0 and sub.plan.duration_days > 0:
            daily_rate = sub.plan.price / sub.plan.duration_days
            refund_amount = daily_rate * remaining_days
            total_refund += refund_amount

    penalty = total_refund * 0.20
    total_cost = total_refund + penalty
    
    return {
        "active_subscribers": affected_users,
        "refund_amount": round(total_refund, 2),
        "penalty_amount": round(penalty, 2),
        "total_cost": round(total_cost, 2),
        "can_afford": current_user.balance >= total_cost
    }

@app.delete("/owner/channels/{channel_id}")
async def delete_channel(channel_id: int, confirm: bool = False, current_user: DBUser = Depends(get_current_owner), db: AsyncSessionLocal = Depends(get_db)):
    result = await db.execute(select(Channel).where(and_(Channel.id == channel_id, Channel.owner_id == current_user.id)))
    channel = result.scalar_one_or_none()
    
    if not channel:
        raise HTTPException(status_code=404, detail="Canal no encontrado")
        
    # Check active subs
    active_subs_result = await db.execute(
        select(Subscription).join(Plan).where(
            and_(
                Plan.channel_id == channel_id,
                Subscription.is_active == True,
                Subscription.end_date > datetime.utcnow()
            )
        )
    )
    active_subs = active_subs_result.scalars().all()
    
    if active_subs:
        if not confirm:
             # Just strict check if not confirmed
             raise HTTPException(status_code=400, detail="HAS_ACTIVE_SUBS")
        
        # Calculate cost again to be safe
        total_refund = 0.0
        for sub in active_subs:
            remaining_days = (sub.end_date - datetime.utcnow()).days
            if remaining_days > 0 and sub.plan.duration_days > 0:
                daily_rate = sub.plan.price / sub.plan.duration_days
                total_refund += (daily_rate * remaining_days)
        
        penalty = total_refund * 0.20
        total_cost = total_refund + penalty
        
        if current_user.balance < total_cost:
            raise HTTPException(status_code=400, detail="Fondos insuficientes para cubrir penalización y reembolsos.")
            
        # Process Refunds
        current_user.balance -= total_cost
        
        for sub in active_subs:
            sub.is_active = False
            # Calculate individual refund + 20% compensation
            remaining_days = (sub.end_date - datetime.utcnow()).days
            if remaining_days > 0 and sub.plan.duration_days > 0:
                daily_rate = sub.plan.price / sub.plan.duration_days
                base_refund = daily_rate * remaining_days
                user_compensation = base_refund * 1.20 # Refund + 20%
                
                # Credit to subscriber balance
                if sub.user:
                    sub.user.balance += user_compensation
                    
                # Todo: Trigger Telegram Kick logic here if needed
                
    await db.delete(channel)
    await db.commit()
    return {"status": "deleted", "id": channel_id}

@app.post("/owner/channels/{channel_id}/branding")
async def update_channel_branding(channel_id: int, data: BrandingUpdate, current_user: DBUser = Depends(get_current_owner), db: AsyncSessionLocal = Depends(get_db)):
    result = await db.execute(select(Channel).where(and_(Channel.id == channel_id, Channel.owner_id == current_user.id)))
    channel = result.scalar_one_or_none()
    if not channel: raise HTTPException(status_code=404, detail="Canal no encontrado")

    if data.welcome_message is not None:
        channel.welcome_message = data.welcome_message
    if data.expiration_message is not None:
        channel.expiration_message = data.expiration_message
        
    await db.commit()
    return channel

@app.get("/owner/channels/{channel_id}/promotions", response_model=List[PromotionResponse])
async def get_channel_promotions(channel_id: int, current_user: DBUser = Depends(get_current_owner), db: AsyncSessionLocal = Depends(get_db)):
    chan_check = await db.execute(select(Channel).where(and_(Channel.id == channel_id, Channel.owner_id == current_user.id)))
    if not chan_check.scalar_one_or_none(): raise HTTPException(status_code=403, detail="No tienes acceso a este canal")
    result = await db.execute(select(Promotion).where(Promotion.channel_id == channel_id))
    return result.scalars().all()

@app.post("/owner/channels/{channel_id}/promotions")
async def create_promotion(channel_id: int, data: PromotionCreate, current_user: DBUser = Depends(get_current_owner), db: AsyncSessionLocal = Depends(get_db)):
    chan_check = await db.execute(select(Channel).where(and_(Channel.id == channel_id, Channel.owner_id == current_user.id)))
    if not chan_check.scalar_one_or_none(): raise HTTPException(status_code=403)
    
    # Validar que el código no exista
    existing = await db.execute(select(Promotion).where(Promotion.code == data.code))
    if existing.scalar_one_or_none(): raise HTTPException(status_code=400, detail="El código ya existe")

    new_promo = Promotion(
        channel_id=channel_id,
        code=data.code,
        promo_type=data.promo_type,
        value=data.value,
        max_uses=data.max_uses
    )
    db.add(new_promo)
    await db.commit()
    return new_promo

@app.delete("/owner/promotions/{promo_id}")
async def delete_promotion(promo_id: int, current_user: DBUser = Depends(get_current_owner), db: AsyncSessionLocal = Depends(get_db)):
    result = await db.execute(select(Promotion).join(Channel).where(and_(Promotion.id == promo_id, Channel.owner_id == current_user.id)))
    promo = result.scalar_one_or_none()
    if not promo: raise HTTPException(status_code=404)
    await db.delete(promo)
    await db.commit()
    return {"status": "deleted"}

@app.get("/bot/check-promo/{code}")
async def bot_check_promo(code: str, user_id: int, db: AsyncSessionLocal = Depends(get_db)):
    """
    Validación para el Bot: Verifica si un código es válido y si el usuario califica.
    """
    result = await db.execute(select(Promotion).where(and_(Promotion.code == code, Promotion.is_active == True)))
    promo = result.scalar_one_or_none()
    if not promo: return {"valid": False, "reason": "invalid"}

    if promo.max_uses and promo.current_uses >= promo.max_uses:
        return {"valid": False, "reason": "limit_reached"}

    # Si es trial, verificar que el usuario no haya tenido uno en este canal
    if promo.promo_type == "trial":
        trial_check = await db.execute(
            select(Subscription).join(Plan).where(
                and_(
                    Subscription.user_id == user_id, 
                    Plan.channel_id == promo.channel_id,
                    Subscription.is_trial == True
                )
            )
        )
        if trial_check.scalar_one_or_none():
            return {"valid": False, "reason": "trial_already_used"}

    return {
        "valid": True,
        "type": promo.promo_type,
        "value": promo.value,
        "channel_id": promo.channel_id
    }

@app.post("/owner/withdrawals")
async def request_withdrawal(data: WithdrawalRequest, current_user: DBUser = Depends(get_current_owner), db: AsyncSessionLocal = Depends(get_db)):
    if data.amount > current_user.balance + current_user.affiliate_balance:
        raise HTTPException(status_code=400, detail="Balance insuficiente")
    
    new_withdrawal = Withdrawal(
        owner_id=current_user.id,
        amount=data.amount,
        method=data.method,
        details=data.details,
        is_express=data.is_express,
        status="pending"
    )
    
    # Descontamos del balance inmediatamente para "bloquear" los fondos
    if current_user.balance >= data.amount:
        current_user.balance -= data.amount
    else:
        remaining = data.amount - current_user.balance
        current_user.balance = 0
        current_user.affiliate_balance -= remaining

    db.add(new_withdrawal)
    await db.commit()
    return new_withdrawal

@app.get("/owner/withdrawals")
async def get_my_withdrawals(current_user: DBUser = Depends(get_current_owner), db: AsyncSessionLocal = Depends(get_db)):
    result = await db.execute(select(Withdrawal).where(Withdrawal.owner_id == current_user.id).order_by(Withdrawal.created_at.desc()))
    return result.scalars().all()

# --- SOPORTE ---
@app.post("/owner/tickets")
async def create_ticket(data: TicketCreate, current_user: DBUser = Depends(get_current_owner), db: AsyncSessionLocal = Depends(get_db)):
    new_ticket = SupportTicket(user_id=current_user.id, subject=data.subject, priority=data.priority)
    db.add(new_ticket)
    await db.flush()
    
    initial_msg = TicketMessage(ticket_id=new_ticket.id, sender_id=current_user.id, content=data.content)
    db.add(initial_msg)
    await db.commit()
    return new_ticket

@app.get("/owner/tickets")
async def get_my_tickets(current_user: DBUser = Depends(get_current_owner), db: AsyncSessionLocal = Depends(get_db)):
    result = await db.execute(select(SupportTicket).where(SupportTicket.user_id == current_user.id).order_by(SupportTicket.updated_at.desc()))
    return result.scalars().all()

@app.get("/owner/tickets/{ticket_id}")
async def get_ticket_details(ticket_id: int, current_user: DBUser = Depends(get_current_owner), db: AsyncSessionLocal = Depends(get_db)):
    result = await db.execute(select(SupportTicket).where(and_(SupportTicket.id == ticket_id, SupportTicket.user_id == current_user.id)))
    ticket = result.scalar_one_or_none()
    if not ticket: raise HTTPException(status_code=404, detail="Ticket no encontrado")
    
    msgs_result = await db.execute(select(TicketMessage).where(TicketMessage.ticket_id == ticket_id).order_by(TicketMessage.created_at.asc()))
    messages = msgs_result.scalars().all()
    return {"ticket": ticket, "messages": messages}

@app.post("/owner/tickets/{ticket_id}/reply")
async def reply_ticket_owner(ticket_id: int, data: MessageCreate, current_user: DBUser = Depends(get_current_owner), db: AsyncSessionLocal = Depends(get_db)):
    result = await db.execute(select(SupportTicket).where(and_(SupportTicket.id == ticket_id, SupportTicket.user_id == current_user.id)))
    ticket = result.scalar_one_or_none()
    if not ticket: raise HTTPException(status_code=404)

    new_msg = TicketMessage(ticket_id=ticket_id, sender_id=current_user.id, content=data.content)
    ticket.status = "open" # Reabrir si estaba pendiente
    db.add(new_msg)
    await db.commit()
    return {"status": "replied"}

# --- Webhook Stripe (Mantenido) ---

@app.post("/webhook/stripe")
async def stripe_webhook(request: Request, db: AsyncSessionLocal = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    try:
        if STRIPE_WEBHOOK_SECRET:
            event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
        else:
            # Fallback para desarrollo sin secret
            import json
            event = json.loads(payload)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Stripe Event")

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        await handle_checkout_completed(session, db)

    return {"status": "success"}

async def activate_membership(user_id: int, plan_id: int, db: AsyncSessionLocal, promo_id: Optional[int] = None, provider_tx_id: Optional[str] = None, method: str = "stripe"):
    plan_result = await db.execute(select(Plan).where(Plan.id == plan_id))
    plan = plan_result.scalar_one_or_none()
    if not plan: return None

    # 0. Idempotencia: Verificar si el pago ya fue procesado
    if provider_tx_id:
        # Verificar en tabla Payments
        pay_check = await db.execute(select(Payment).where(Payment.provider_tx_id == provider_tx_id))
        existing_payment = pay_check.scalar_one_or_none()
        if existing_payment:
            print(f"⚠️ Idempotency check: Payment {provider_tx_id} already processed.")
            # Buscar y devolver la suscripción actual para no romper flujo
            sub_check = await db.execute(
                select(Subscription).where(
                    and_(Subscription.user_id == user_id, Subscription.plan_id == plan_id)
                )
            )
            return sub_check.scalars().first()

    # 1. Distribuir fondos (MLM + Dueño + Plataforma)
    # Calculamos el precio final considerando posibles promociones
    final_price = plan.price
    if promo_id:
        promo_res = await db.execute(select(Promotion).where(Promotion.id == promo_id))
        promo = promo_res.scalar_one_or_none()
        if promo and promo.promo_type == "discount":
            final_price = round(plan.price * (1 - promo.value), 2)
            promo.current_uses += 1

    await distribute_payment_funds(
        db=db,
        user_id=user_id,
        plan_id=plan_id,
        total_amount=final_price,
        payment_method=method,
        provider_tx_id=provider_tx_id
    )

    # 2. Activar o Extender Suscripción
    # Buscar si ya tiene una suscripción activa
    existing_sub = await db.execute(
        select(Subscription).where(
            and_(Subscription.user_id == user_id, Subscription.plan_id == plan_id, Subscription.is_active == True)
        )
    )
    sub = existing_sub.scalar_one_or_none()
    
    now = datetime.utcnow()
    if sub and sub.end_date > now:
        sub.end_date += timedelta(days=plan.duration_days)
    else:
        sub = Subscription(
            user_id=user_id,
            plan_id=plan_id,
            start_date=now,
            end_date=now + timedelta(days=plan.duration_days),
            is_active=True
        )
        db.add(sub)
    
    await db.commit()

    # 3. Notificación de Bienvenida
    chan_res = await db.execute(select(Channel).where(Channel.id == plan.channel_id))
    channel = chan_res.scalar_one_or_none()
    usr_res = await db.execute(select(DBUser).where(DBUser.id == user_id))
    user = usr_res.scalar_one_or_none()
    
    if user and user.telegram_id and channel:
        from shared.notifications import send_telegram_notification
        msg = channel.welcome_message or f"✅ **¡Acceso Activado!**\n\nYa puedes disfrutar de: *{channel.title}*."
        await send_telegram_notification(user.telegram_id, msg)
    
    return sub

async def handle_checkout_completed(session, db):
    user_id = int(session['metadata'].get('user_id'))
    plan_id = int(session['metadata'].get('plan_id'))
    promo_id = session['metadata'].get('promo_id')
    promo_id = int(promo_id) if promo_id and promo_id != "None" else None
    
    await activate_membership(
        user_id=user_id,
        plan_id=plan_id,
        db=db,
        promo_id=promo_id,
        provider_tx_id=session.get('id'),
        method="stripe"
    )

@app.post("/payments/create-link")
async def create_payment_link(data: PaymentRequest, db: AsyncSessionLocal = Depends(get_db)):
    plan_result = await db.execute(select(Plan).where(Plan.id == data.plan_id))
    plan = plan_result.scalar_one_or_none()
    if not plan: raise HTTPException(status_code=404, detail="Plan no encontrado")
    
    # Aplicar descuento si hay promo
    final_price = plan.price
    if data.promo_id:
        promo_res = await db.execute(select(Promotion).where(Promotion.id == data.promo_id))
        promo = promo_res.scalar_one_or_none()
        if promo and promo.promo_type == "discount":
            final_price = round(plan.price * (1 - promo.value), 2)

    # Referencia única para rastrear [USER_ID]-[PLAN_ID]-[PROMO_ID]-[TIMESTAMP]
    reference = f"user_{data.user_id}_plan_{data.plan_id}_p_{data.promo_id or 0}_{int(datetime.utcnow().timestamp())}"

    if data.method == "stripe":
        # Lógica de Stripe (ya existente pero adaptada)
        try:
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {'name': f"Suscripción VIP: {plan.name}"},
                        'unit_amount': int(final_price * 100),
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=f"{os.getenv('DASHBOARD_URL')}/success?session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=f"{os.getenv('DASHBOARD_URL')}/cancel",
                client_reference_id=reference
            )
            return {"url": session.url}
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    elif data.method == "wompi":
        # Lógica de Wompi (Colombia)
        # Convertir USD a COP (Tasa fija demo: 4000)
        amount_in_cop = int(final_price * 4000)
        amount_in_cents = amount_in_cop * 100 

        # Generar firma de integridad (Si está activa en Wompi)
        # SHA256(referencia + monto_en_centavos + moneda + secreto_integridad)
        if WOMPI_INTEGRITY_SECRET:
            chain = f"{reference}{amount_in_cents}COP{WOMPI_INTEGRITY_SECRET}"
            integrity_signature = hashlib.sha256(chain.encode()).hexdigest()
        else:
            integrity_signature = None

        payload = {
            "name": f"VIP: {plan.name}",
            "description": f"Suscripción {plan.duration_days} días",
            "single_use": True,
            "collect_shipping": False,
            "amount_in_cents": amount_in_cents,
            "currency": "COP",
            "sku": reference,
            "redirect_url": f"{os.getenv('DASHBOARD_URL')}/success"
        }

        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {WOMPI_PUBLIC_KEY}"}
            resp = await client.post(f"{WOMPI_API_BASE}/payment_links", json=payload, headers=headers)
            if resp.status_code != 201:
                raise HTTPException(status_code=400, detail=f"Error Wompi: {resp.text}")
            
            wompi_data = resp.json().get("data", {})
            return {"url": f"https://checkout.wompi.co/l/{wompi_data.get('id')}"}

    elif data.method == "crypto":
        # Crear registro de pago pendiente
        new_payment = Payment(
            user_id=data.user_id,
            plan_id=data.plan_id,
            amount=final_price,
            method="crypto",
            status="pending",
            reference=reference
        )
        db.add(new_payment)
        await db.commit()

        wallet_address = os.getenv("CRYPTO_WALLET_ADDRESS", "TXYZ... (Configura tu wallet)")
        network = os.getenv("CRYPTO_NETWORK", "Red TRC20 (USDT)")
        
        return {
            "method": "crypto",
            "address": wallet_address,
            "network": network,
            "amount": final_price,
            "payment_id": new_payment.id,
            "instructions": f"Envía exactamente ${final_price} USDT a la dirección de abajo. Luego abre un ticket indicando tu ID de pago #{new_payment.id} y el HASH de la transacción."
        }

    raise HTTPException(status_code=400, detail="Método de pago no soportado")

@app.post("/webhook/wompi")
async def wompi_webhook(request: Request, db: AsyncSessionLocal = Depends(get_db)):
    payload = await request.json()
    
    # 1. Validar firma de eventos WOMPI_EVENTS_SECRET
    if WOMPI_EVENTS_SECRET:
        signature_obj = payload.get("signature", {})
        properties = signature_obj.get("properties", [])
        checksum = signature_obj.get("checksum")
        timestamp = payload.get("timestamp")
        
        # Concatenar valores en el orden de properties
        data_obj = payload.get("data", {})
        transaction = data_obj.get("transaction", {})
        
        chain = ""
        for prop in properties:
            # Wompi properties suelen ser 'transaction.id', 'transaction.amount_in_cents', etc.
            if prop.startswith("transaction."):
                key = prop.replace("transaction.", "")
                val = transaction.get(key)
                chain += str(val)
        
        chain += str(timestamp)
        chain += WOMPI_EVENTS_SECRET
        
        calculated_checksum = hashlib.sha256(chain.encode()).hexdigest()
        if calculated_checksum != checksum:
            logging.error(f"Fallo de firma Wompi: {calculated_checksum} != {checksum}")
            raise HTTPException(status_code=400, detail="Invalid Wompi Signature")

    # 2. Procesar Evento
    event = payload.get("event")
    data = payload.get("data", {}).get("transaction", {})
    
    if event == "transaction.updated" and data.get("status") == "APPROVED":
        reference = data.get("reference")
        # reference format: user_1_plan_2_p_0_timestamp
        try:
            parts = reference.split("_")
            user_id = int(parts[1])
            plan_id = int(parts[3])
            promo_id = int(parts[5])
            
            await activate_membership(
                user_id=user_id, 
                plan_id=plan_id, 
                db=db, 
                promo_id=promo_id if promo_id > 0 else None,
                provider_tx_id=data.get("id"),
                method="wompi"
            )
            return {"status": "ok"}
        except Exception as e:
            logging.error(f"Error procesando webhook Wompi: {e}")
            return {"status": "error"}
            
    return {"status": "ignored"}

@app.get("/owner/analytics")
async def get_owner_analytics(current_user: DBUser = Depends(get_current_owner), db: AsyncSessionLocal = Depends(get_db)):
    # 1. Ingresos diarios (últimos 30 días)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    # Revenue data grouping by date
    rev_query = await db.execute(
        select(
            func.date(Payment.created_at).label('date'),
            func.sum(Payment.owner_amount).label('revenue')
        ).join(Plan, Payment.plan_id == Plan.id).join(Channel).where(
            and_(
                Channel.owner_id == current_user.id,
                Payment.status == "completed",
                Payment.created_at >= thirty_days_ago
            )
        ).group_by(func.date(Payment.created_at)).order_by(func.date(Payment.created_at))
    )
    revenue_chart = [{"date": str(r.date), "value": r.revenue} for r in rev_query.all()]

    # 2. Crecimiento de suscriptores
    sub_query = await db.execute(
        select(
            func.date(Subscription.start_date).label('date'),
            func.count(Subscription.id).label('count')
        ).join(Plan).join(Channel).where(
            and_(
                Channel.owner_id == current_user.id,
                Subscription.start_date >= thirty_days_ago
            )
        ).group_by(func.date(Subscription.start_date)).order_by(func.date(Subscription.start_date))
    )
    subscriber_chart = [{"date": str(s.date), "value": s.count} for s in sub_query.all()]

    # 3. Datos de Red (MLM)
    mlm_query = await db.execute(
        select(
            func.date(AffiliateEarning.created_at).label('date'),
            func.sum(AffiliateEarning.amount).label('amount')
        ).where(
            and_(
                AffiliateEarning.affiliate_id == current_user.id,
                AffiliateEarning.created_at >= thirty_days_ago
            )
        ).group_by(func.date(AffiliateEarning.created_at)).order_by(func.date(AffiliateEarning.created_at))
    )
    mlm_chart = [{"date": str(m.date), "value": m.amount} for m in mlm_query.all()]

    return {
        "revenue_series": revenue_chart,
        "subscriber_series": subscriber_chart,
        "mlm_series": mlm_chart
    }
