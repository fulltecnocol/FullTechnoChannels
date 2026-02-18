#!/usr/bin/env python3
"""
Comprehensive application test suite
Tests database, API, bot configuration, and environment setup
"""

import os
import sys
import asyncio
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv

load_dotenv(override=True)

import logging

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

# FIX: Ensure signature models are registered with Base metadata
try:
    # Removed: from shared import signature_models
except ImportError:
    pass


class TestSuite:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.warnings = 0

    def test(self, name: str, condition: bool, error_msg: str = ""):
        """Run a test and track results"""
        if condition:
            logging.info(f"✅ PASS: {name}")
            self.passed += 1
            return True
        else:
            logging.error(f"❌ FAIL: {name}")
            if error_msg:
                logging.error(f"   {error_msg}")
            self.failed += 1
            return False

    def warn(self, name: str, message: str = ""):
        """Log a warning"""
        logging.warning(f"⚠️  WARN: {name}")
        if message:
            logging.warning(f"   {message}")
        self.warnings += 1

    def report(self):
        """Print final report"""
        total = self.passed + self.failed
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        print(f"Passed:   {self.passed}/{total}")
        print(f"Failed:   {self.failed}/{total}")
        print(f"Warnings: {self.warnings}")
        print("=" * 60)

        if self.failed == 0:
            print("✅ ALL TESTS PASSED!")
            return 0
        else:
            print(f"❌ {self.failed} TEST(S) FAILED")
            return 1


async def test_environment(suite: TestSuite):
    """Test environment variables"""
    print("\n📋 Testing Environment Configuration...")

    # Required variables
    required_vars = [
        "DATABASE_URL",
        "JWT_SECRET_KEY",
    ]

    for var in required_vars:
        value = os.getenv(var)
        suite.test(
            f"Environment variable {var} exists",
            value is not None and value != "",
            f"{var} is not set or empty",
        )

    # Bot token (either name works)
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN") or os.getenv("BOT_TOKEN")
    suite.test(
        "Bot token available (TELEGRAM_BOT_TOKEN or BOT_TOKEN)",
        bot_token is not None and bot_token != "",
        "Neither TELEGRAM_BOT_TOKEN nor BOT_TOKEN is set",
    )

    # Optional but recommended
    optional_vars = ["STRIPE_WEBHOOK_SECRET", "WOMPI_PUBLIC_KEY"]
    for var in optional_vars:
        value = os.getenv(var)
        if not value:
            suite.warn(
                f"Optional variable {var} not set", "Payment features may not work"
            )


async def test_database_connection(suite: TestSuite):
    """Test database connectivity"""
    print("\n🗄️  Testing Database Connection...")

    try:
        from infrastructure.database.connection import init_db, AsyncSessionLocal, engine
        from sqlalchemy import text

        # Test engine creation
        suite.test("Database engine created", engine is not None)

        # Test connection
        try:
            async with engine.begin() as conn:
                result = await conn.execute(text("SELECT version()"))
                version = result.scalar()
                suite.test("Database connection successful", True)
                logging.info(f"   PostgreSQL version: {version[:60]}...")
        except Exception as e:
            suite.test("Database connection successful", False, str(e))
            return

        # Test session creation
        try:
            async with AsyncSessionLocal() as session:
                result = await session.execute(text("SELECT 1"))
                suite.test("Database session creation successful", result.scalar() == 1)
        except Exception as e:
            suite.test("Database session creation successful", False, str(e))

        #  Test tables exist
        try:
            async with engine.begin() as conn:
                tables_result = await conn.execute(
                    text("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")
                )
                tables = [row[0] for row in tables_result]

                expected_tables = ["users", "plans", "channels", "subscriptions"]
                for table in expected_tables:
                    exists = table in tables
                    if not exists:
                        suite.warn(
                            f"Table '{table}' exists in database",
                            "Table not found - migrations may be needed",
                        )
                    else:
                        logging.info(f"   ✓ Table '{table}' exists")
        except Exception as e:
            suite.warn("Could not check database tables", str(e))

    except ImportError as e:
        suite.test("Database module imports", False, str(e))
    except Exception as e:
        suite.test("Database initialization", False, str(e))


async def test_api_imports(suite: TestSuite):
    """Test API module imports"""
    print("\n🔌 Testing API Imports...")

    try:
        from api.main import app

        suite.test("API app imports successfully", True)

        # Check if app has routes
        routes_count = len(app.routes)
        suite.test(f"API has routes defined ({routes_count} routes)", routes_count > 0)

    except ImportError as e:
        suite.test("API app imports successfully", False, str(e))
    except Exception as e:
        suite.test("API app initialization", False, str(e))


async def test_bot_imports(suite: TestSuite):
    """Test Bot module imports"""
    print("\n🤖 Testing Bot Imports...")

    try:
        from bot.main import app as bot_app, bot, dp

        suite.test("Bot app imports successfully", True)

        # Check bot token is configured
        bot_token = os.getenv("TELEGRAM_BOT_TOKEN") or os.getenv("BOT_TOKEN")
        if bot_token:
            logging.info(f"   Bot token configured (length: {len(bot_token)})")

    except ImportError as e:
        suite.test("Bot app imports successfully", False, str(e))
    except Exception as e:
        suite.test("Bot app initialization", False, str(e))


async def test_unified_app(suite: TestSuite):
    """Test unified main app"""
    print("\n🎯 Testing Unified Application...")

    try:
        from main import app

        suite.test("Unified app imports successfully", True)

        # Check mounted apps
        mounted = {route.path for route in app.routes}
        suite.test("API mounted at /api", any("/api" in path for path in mounted))
        suite.test("Bot mounted at /bot", any("/bot" in path for path in mounted))

    except ImportError as e:
        suite.test("Unified app imports successfully", False, str(e))
    except Exception as e:
        suite.test("Unified app initialization", False, str(e))


async def test_dependencies(suite: TestSuite):
    """Test critical dependencies"""
    print("\n📦 Testing Dependencies...")

    critical_deps = [
        "fastapi",
        "uvicorn",
        "sqlalchemy",
        "asyncpg",
        "aiosqlite",
        "aiogram",
        "stripe",
        "pydantic",
        "passlib",
        "python_jose",
        "httpx",
    ]

    for dep in critical_deps:
        try:
            __import__(dep)
            logging.info(f"   ✓ {dep} installed")
        except ImportError:
            suite.test(
                f"Dependency '{dep}' installed", False, f"Run: pip install {dep}"
            )


async def main():
    """Run all tests"""
    print("=" * 60)
    print("FGATE APPLICATION TEST SUITE")
    print("=" * 60)

    suite = TestSuite()

    # Run all test suites
    await test_environment(suite)
    await test_dependencies(suite)
    await test_database_connection(suite)
    await test_api_imports(suite)
    await test_bot_imports(suite)
    await test_unified_app(suite)

    # Report results
    exit_code = suite.report()

    if exit_code == 0:
        print("\n✅ Application is ready for deployment!")
        print("Next steps:")
        print("1. Deploy to Cloud Run: ./deploy-correct-password.sh")
        print("2. Configure webhook after deployment")
    else:
        print("\n⚠️  Fix the failing tests before deploying.")

    return exit_code


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
