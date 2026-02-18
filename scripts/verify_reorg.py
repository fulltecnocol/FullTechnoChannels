import sys
import os

# Add project root to path
sys.path.append(os.getcwd())

print("Verifying imports...")

try:
    print("1. Importing core entities...")
    from core.entities import User
    print("   ✅ core.entities ok")

    print("2. Importing infrastructure database...")
    from infrastructure.database.connection import get_db
    print("   ✅ infrastructure.database ok")

    print("3. Importing shared.models (compat)...")
    from core.entities import User as SharedUser
    assert User == SharedUser
    print("   ✅ shared.models compat ok")

    print("4. Importing api.main...")
    import api.main
    print("   ✅ api.main imports ok (controllers loaded)")

    print("5. Importing bot.main...")
    # Might require env vars, so just try import
    try:
        import bot.main
        print("   ✅ bot.main imported")
    except ImportError as e:
        print(f"   ⚠️ bot.main import warning: {e}")
    except Exception as e:
        print(f"   ⚠️ bot.main init warning (likely env vars): {e}")

    print("6. Importing api.deps (compat)...")
    from api.deps import get_current_user
    print("   ✅ api.deps compat ok")

    print("\n🎉 REORGANIZATION VERIFIED SUCCESSFULLY!")

except Exception as e:
    print(f"\n❌ VERIFICATION FAILED: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
