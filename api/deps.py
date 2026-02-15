from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.future import select
import os

from shared.database import get_db, AsyncSessionLocal
from shared.models import User as DBUser

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


async def get_current_owner(
    token: str = Depends(oauth2_scheme), db: AsyncSessionLocal = Depends(get_db)
):
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


async def get_current_admin(current_user: DBUser = Depends(get_current_owner)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=403, detail="No tienes permisos de administrador"
        )
    return current_user


# Alias para compatibilidad
get_current_user = get_current_owner
