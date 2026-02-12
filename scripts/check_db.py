import asyncio
from api.shared.database import init_db, AsyncSessionLocal
from sqlalchemy import text
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)

async def check_connection():
    logging.info("⏳ Intentando conectar a la base de datos...")
    try:
        # 1. Intentar inicializar modelos (Crear tablas si no existen)
        await init_db()
        logging.info("✅ Tablas sincronizadas correctamente.")

        # 2. Verificar conexión con una consulta simple
        async with AsyncSessionLocal() as session:
            result = await session.execute(text("SELECT 1"))
            match = result.scalar()
            if match == 1:
                logging.info("✅ Conexión a Supabase EXITOSA (SELECT 1 OK).")
            else:
                logging.error("❌ Falló la consulta de prueba.")
    except Exception as e:
        logging.error(f"❌ Error crítico de conexión: {str(e)}")

if __name__ == "__main__":
    asyncio.run(check_connection())
