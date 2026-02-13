import os
from dotenv import load_dotenv
load_dotenv(override=True)

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

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
    pool_size=10,  # Conexiones base
    max_overflow=20,  # Conexiones extra bajo carga
    pool_timeout=30,  # Segundos antes de error si no hay conexión libre
    pool_recycle=1800,  # Reciclar conexión cada 30 min para evitar desconexiones de red
    connect_args=connect_args
)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

async def init_db():
    from .models import Base
    async with engine.begin() as conn:
        # En el MVP creamos tablas directamente
        await conn.run_sync(Base.metadata.create_all)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
