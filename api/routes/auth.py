import os
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.future import select
from sqlalchemy import and_
from sqlalchemy.exc import IntegrityError
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from shared.database import get_db, AsyncSessionLocal
from shared.models import User as DBUser, RegistrationToken
from api.schemas.auth import (
    Token,
    UserRegister,
    GoogleAuthRequest,
    GenerateTokenRequest,
    CreateMagicLinkRequest,
)
from api.services.auth_service import AuthService

router = APIRouter(tags=["Authentication"])


@router.post("/auth/generate-registration-token")
async def generate_registration_token(
    data: GenerateTokenRequest, db: AsyncSessionLocal = Depends(get_db)
):
    # 1. Check if Telegram ID already linked to a user
    user_res = await db.execute(
        select(DBUser).where(DBUser.telegram_id == data.telegram_id)
    )
    if user_res.scalar_one_or_none():
        raise HTTPException(
            status_code=400, detail="Este usuario de Telegram ya está registrado."
        )

    # 2. Generate Token (6 digits)
    import random

    token = str(random.randint(100000, 999999))

    # 3. Store
    new_token = RegistrationToken(
        token=token,
        telegram_id=data.telegram_id,
        username=data.username,
        full_name=data.full_name,
        expires_at=datetime.utcnow() + timedelta(minutes=15),
    )
    db.add(new_token)
    await db.commit()

    return {"token": token}


@router.post("/register", response_model=Token)
async def register_owner(
    user_data: UserRegister, db: AsyncSessionLocal = Depends(get_db)
):
    # Verificar si ya existe
    result = await db.execute(select(DBUser).where(DBUser.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Este email ya está registrado")

    referred_by_id = None
    if user_data.referral_code:
        ref_result = await db.execute(
            select(DBUser).where(DBUser.referral_code == user_data.referral_code)
        )
        referrer = ref_result.scalar_one_or_none()
        if referrer:
            referred_by_id = referrer.id

    telegram_id = None
    if user_data.registration_token:
        token_res = await db.execute(
            select(RegistrationToken).where(
                and_(
                    RegistrationToken.token == user_data.registration_token,
                    RegistrationToken.expires_at > datetime.utcnow(),
                )
            )
        )
        token_obj = token_res.scalar_one_or_none()
        if not token_obj:
            raise HTTPException(
                status_code=400, detail="Token de registro inválido o expirado"
            )
        telegram_id = token_obj.telegram_id

        # Check if Telegram ID already linked to another user
        tg_check = await db.execute(
            select(DBUser).where(DBUser.telegram_id == telegram_id)
        )
        if tg_check.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail="Esta cuenta de Telegram ya está vinculada a un usuario. Por favor, inicia sesión o usa otra cuenta de Telegram.",
            )

        await db.delete(token_obj)  # Consume token

    new_owner = DBUser(
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=AuthService.get_password_hash(user_data.password),
        is_owner=True,
        referred_by_id=referred_by_id,
        telegram_id=telegram_id,
    )
    db.add(new_owner)
    try:
        await db.commit()
    except IntegrityError as e:
        await db.rollback()
        error_msg = str(e.orig)
        if "users_email_key" in error_msg or "email" in error_msg:
            raise HTTPException(status_code=400, detail="Este email ya está registrado")
        elif "users_telegram_id_key" in error_msg or "telegram_id" in error_msg:
            raise HTTPException(
                status_code=400,
                detail="Esta cuenta de Telegram ya está registrada con otro usuario",
            )
        else:
            raise HTTPException(
                status_code=400,
                detail="Error de integridad: Esta cuenta ya existe o algunos datos están duplicados",
            )

    access_token = AuthService.create_access_token(data={"sub": new_owner.email})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/auth/google", response_model=Token)
async def google_auth(
    auth_data: GoogleAuthRequest, db: AsyncSessionLocal = Depends(get_db)
):
    try:
        CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
        idinfo = id_token.verify_oauth2_token(
            auth_data.credential, google_requests.Request(), CLIENT_ID
        )

        google_id = idinfo["sub"]
        email = idinfo["email"]
        name = idinfo.get("name", email.split("@")[0])
        avatar = idinfo.get("picture")

        result = await db.execute(select(DBUser).where(DBUser.google_id == google_id))
        user = result.scalar_one_or_none()

        if not user:
            result = await db.execute(select(DBUser).where(DBUser.email == email))
            user = result.scalar_one_or_none()

            if user:
                user.google_id = google_id
                if not user.avatar_url:
                    user.avatar_url = avatar
            else:
                referred_by_id = None
                if auth_data.referral_code:
                    ref_result = await db.execute(
                        select(DBUser).where(
                            DBUser.referral_code == auth_data.referral_code
                        )
                    )
                    referrer = ref_result.scalar_one_or_none()
                    if referrer:
                        referred_by_id = referrer.id

                telegram_id = None
                if auth_data.registration_token:
                    token_res = await db.execute(
                        select(RegistrationToken).where(
                            and_(
                                RegistrationToken.token == auth_data.registration_token,
                                RegistrationToken.expires_at > datetime.utcnow(),
                            )
                        )
                    )
                    token_obj = token_res.scalar_one_or_none()
                    if token_obj:
                        telegram_id = token_obj.telegram_id
                        tg_check = await db.execute(
                            select(DBUser).where(DBUser.telegram_id == telegram_id)
                        )
                        if tg_check.scalar_one_or_none():
                            raise HTTPException(
                                status_code=400,
                                detail="Esta cuenta de Telegram ya está vinculada a otro usuario.",
                            )
                        await db.delete(token_obj)

                user = DBUser(
                    email=email,
                    full_name=name,
                    google_id=google_id,
                    avatar_url=avatar,
                    is_owner=True,
                    email_verified=True,
                    referred_by_id=referred_by_id,
                    telegram_id=telegram_id,
                )
                db.add(user)

            await db.commit()
            await db.refresh(user)

        access_token = AuthService.create_access_token(data={"sub": user.email})
        return {"access_token": access_token, "token_type": "bearer"}

    except ValueError:
        raise HTTPException(status_code=400, detail="Token de Google inválido")
    except Exception:
        raise HTTPException(status_code=500, detail="Error de autenticación social")


@router.post("/auth/magic-link-token")
async def generate_magic_link_token(
    data: CreateMagicLinkRequest, db: AsyncSessionLocal = Depends(get_db)
):
    result = await db.execute(
        select(DBUser).where(DBUser.telegram_id == data.telegram_id)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if not user.is_owner:
        raise HTTPException(status_code=403, detail="Solo para creadores de contenido")

    token = AuthService.create_magic_link_token(user.email)
    return {"token": token}


@router.post("/auth/magic-login", response_model=Token)
async def magic_login(token: str, db: AsyncSessionLocal = Depends(get_db)):
    payload = AuthService.decode_token(token)
    if not payload or payload.get("type") != "magic_link":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Enlace inválido o expirado",
        )

    email = payload.get("sub")
    result = await db.execute(select(DBUser).where(DBUser.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no encontrado"
        )

    access_token = AuthService.create_access_token(
        data={"sub": user.email, "recovery": True}
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSessionLocal = Depends(get_db),
):
    result = await db.execute(select(DBUser).where(DBUser.email == form_data.username))
    user = result.scalar_one_or_none()

    if not user or not AuthService.verify_password(
        form_data.password, user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = AuthService.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}
