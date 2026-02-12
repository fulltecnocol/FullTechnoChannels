import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

def test_imports():
    print("Testing imports for bot integration...")
    try:
        from bot.states.signature_states import SignatureFlow
        print("✅ SignatureFlow imported")
        
        from bot.handlers.signature_handlers import signature_router
        print("✅ signature_router imported")
        
        print("🎉 All imports successful!")
        return True
    except Exception as e:
        print(f"❌ Import failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_imports()
