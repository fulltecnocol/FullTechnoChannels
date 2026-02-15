#!/usr/bin/env python3
"""
Script para aplicar migración 003: Sistema de Llamadas Privadas
"""

import asyncio
import sys
from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Convertir postgresql:// a postgresql+asyncpg://
if DATABASE_URL and DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")


async def apply_migration():
    """Aplica la migración 003 a la base de datos"""

    # Leer archivo SQL
    migration_file = (
        Path(__file__).parent.parent / "migrations" / "003_calls_system.sql"
    )

    if not migration_file.exists():
        print(f"❌ Error: No se encontró el archivo {migration_file}")
        sys.exit(1)

    with open(migration_file, "r") as f:
        sql_content = f.read()

    print("🔄 Conectando a la base de datos...")
    # Mask password in logs
    if "@" in DATABASE_URL:
        print(f"📍 Database: {DATABASE_URL.split('@')[1].split('/')[0]}")

    # Crear engine
    engine = create_async_engine(DATABASE_URL, echo=True)

    try:
        async with engine.begin() as conn:
            print("\n📝 Aplicando migración 003: Sistema de Llamadas...")
            print("=" * 60)

            # Ejecutar SQL (Split by ; because asyncpg doesn't support multiple statements)
            commands = sql_content.split(';')
            for cmd in commands:
                cmd = cmd.strip()
                if cmd:
                    await conn.execute(text(cmd))

            print("=" * 60)
            print("✅ Migración aplicada exitosamente!")

            # Verificar tablas creadas
            print("\n🔍 Verificando tablas creadas...")
            result = await conn.execute(
                text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('call_services', 'call_slots')
                ORDER BY table_name;
            """)
            )

            tables = result.fetchall()
            print(f"\n✅ Tablas encontradas ({len(tables)}/2):")
            for table in tables:
                print(f"   - {table[0]}")

            if len(tables) == 2:
                print("\n🎉 ¡Todo listo! El sistema de llamadas está configurado.")
            else:
                print("\n⚠️ Advertencia: No se encontraron todas las tablas esperadas.")

    except Exception as e:
        print(f"\n❌ Error al aplicar migración: {e}")
        sys.exit(1)

    finally:
        await engine.dispose()


if __name__ == "__main__":
    print("=" * 60)
    print("🚀 MIGRACIÓN 003: SISTEMA DE LLAMADAS")
    print("=" * 60)
    print()

    asyncio.run(apply_migration())
