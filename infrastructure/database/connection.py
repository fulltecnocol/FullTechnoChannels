from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from redis.asyncio import Redis
import os
from dotenv import load_dotenv

load_dotenv()

# Valor por defecto para desarrollo local si no hay DB configurada
DEFAULT_DB = "sqlite+aiosqlite:///./membership.db"
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    DATABASE_URL = DEFAULT_DB
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

# Supabase generalmente requiere SSL, pero a veces asyncpg lo negocia mejor sin forzarlo explícitamente en el connect_args
# si falla la conexión. Vamos a probar sin forzar el contexto SSL manual.
connect_args = {}
if "postgresql" in DATABASE_URL:
    connect_args = {"ssl": "require"}

# Configuración optimizada para alta concurrencia
engine = create_async_engine(
    DATABASE_URL,
    echo=False,  # Desactivado en producción para rendimiento
    pool_size=5,  # Reduced for Cloud Run autoscaling (prevent connection exhaust)
    max_overflow=10,  # Cap overflow
    pool_timeout=30,  # Segundos antes de error si no hay conexión libre
    pool_recycle=1800,  # Reciclar conexión cada 30 min para evitar desconexiones de red
    connect_args=connect_args,
)
AsyncSessionLocal = async_sessionmaker(
    engine, expire_on_commit=False, class_=AsyncSession
)

# Redis Configuration
REDIS_URL = os.getenv("REDIS_URL")
if not REDIS_URL or REDIS_URL.strip() == "":
    REDIS_URL = "redis://localhost:6379/0"

redis_client = Redis.from_url(REDIS_URL, decode_responses=True)


async def init_db():
    from core.entities import Base

    async with engine.begin() as conn:
        # En el MVP creamos tablas directamente
        await conn.run_sync(Base.metadata.create_all)


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


async def get_redis():
    """Dependency to get Redis client"""
    return redis_client


def get_base():
    """Get Base for model definitions"""
    from core.entities import Base

    return Base
