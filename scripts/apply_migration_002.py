#!/usr/bin/env python3
"""
Script para aplicar migración 002: Sistema de Firma Digital
Ejecuta la migración SQL en Supabase
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
    """Aplica la migración 002 a la base de datos"""

    # Leer archivo SQL
    migration_file = (
        Path(__file__).parent.parent / "migrations" / "002_signature_system.sql"
    )

    if not migration_file.exists():
        print(f"❌ Error: No se encontró el archivo {migration_file}")
        sys.exit(1)

    with open(migration_file, "r") as f:
        sql_content = f.read()

    print("🔄 Conectando a la base de datos...")
    print(f"📍 Database: {DATABASE_URL.split('@')[1].split('/')[0]}")

    # Crear engine
    engine = create_async_engine(DATABASE_URL, echo=True)

    try:
        async with engine.begin() as conn:
            print("\n📝 Aplicando migración 002: Sistema de Firma Digital...")
            print("=" * 60)

            # Ejecutar SQL
            await conn.execute(text(sql_content))

            print("=" * 60)
            print("✅ Migración aplicada exitosamente!")

            # Verificar tablas creadas
            print("\n🔍 Verificando tablas creadas...")
            result = await conn.execute(
                text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('owner_legal_info', 'signature_codes', 'signed_contracts')
                ORDER BY table_name;
            """)
            )

            tables = result.fetchall()
            print(f"\n✅ Tablas creadas ({len(tables)}/3):")
            for table in tables:
                print(f"   - {table[0]}")

            # Verificar columnas agregadas a users
            print("\n🔍 Verificando columnas en tabla 'users'...")
            result = await conn.execute(
                text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' 
                AND column_name IN ('legal_verification_status', 'can_create_channels')
                ORDER BY column_name;
            """)
            )

            columns = result.fetchall()
            print(f"\n✅ Columnas agregadas a 'users' ({len(columns)}/2):")
            for col in columns:
                print(f"   - {col[0]}")

            # Mostrar estadísticas
            print("\n📊 Estadísticas:")
            result = await conn.execute(text("SELECT COUNT(*) FROM users;"))
            user_count = result.scalar()
            print(f"   - Total usuarios: {user_count}")

            result = await conn.execute(text("SELECT COUNT(*) FROM owner_legal_info;"))
            legal_count = result.scalar()
            print(f"   - Owners con info legal: {legal_count}")

            print("\n🎉 ¡Todo listo! El sistema de firma digital está configurado.")

    except Exception as e:
        print(f"\n❌ Error al aplicar migración: {e}")
        sys.exit(1)

    finally:
        await engine.dispose()


if __name__ == "__main__":
    print("=" * 60)
    print("🚀 MIGRACIÓN 002: SISTEMA DE FIRMA DIGITAL")
    print("=" * 60)
    print()

    asyncio.run(apply_migration())
