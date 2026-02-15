#!/usr/bin/env python3
"""
Test simplificado del sistema de firma (sin WeasyPrint)
Solo testa componentes que no dependen de librerías del sistema
"""

import sys
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))


def test_template_exists():
    """Test: Template HTML"""
    print("\n" + "=" * 60)
    print("TEST 1: Template Verification")
    print("=" * 60)

    try:
        template_path = (
            Path(__file__).parent.parent / "templates" / "contrato_mandato.html"
        )

        if template_path.exists():
            print("\n✅ Template encontrado")

            with open(template_path, "r") as f:
                content = f.read()

            print("📊 Estadísticas:")
            print(f"   Líneas: {len(content.splitlines())}")
            print(f"   Tamaño: {len(content) / 1024:.1f} KB")
            print(f"   Variables Jinja2: {content.count('{{')} encontradas")

            # Verificar variables clave
            key_vars = ["person_type", "full_legal_name", "bank_name", "signature_date"]
            all_ok = True
            for var in key_vars:
                exists = f"{{{{ {var}" in content
                if not exists:
                    all_ok = False
                    print(f"   ⚠️  Variable {var} no encontrada")

            if all_ok:
                print("✅ Todas las variables clave presentes")

            return True
        else:
            print("\n❌ Template no encontrado")
            return False

    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False


def test_blockchain_import():
    """Test: Import blockchain service"""
    print("\n" + "=" * 60)
    print("TEST 2: Blockchain Service Import")
    print("=" * 60)

    try:
        from api.services.blockchain_service import get_blockchain_service

        print("\n✅ Import exitoso")

        get_blockchain_service()
        print("✅ Servicio inicializado")

        print("\n🔍 Configuración:")
        print(
            f"   RPC URL: {'✅ configurado' if os.getenv('POLYGON_RPC_URL') else '❌ no configurado'}"
        )
        print(
            f"   Contract Address: {'✅ configurado' if os.getenv('CONTRACT_REGISTRY_ADDRESS') else '❌ no configurado (normal en desarrollo)'}"
        )

        return True

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback

        traceback.print_exc()
        return False


def test_models_import():
    """Test: Import database models"""
    print("\n" + "=" * 60)
    print("TEST 3: Database Models Import")
    print("=" * 60)

    try:
        from api.models.signature import OwnerLegalInfo, SignatureCode, SignedContract

        print("\n✅ Imports exitosos")
        print(f"   - OwnerLegalInfo: {OwnerLegalInfo.__tablename__}")
        print(f"   - SignatureCode: {SignatureCode.__tablename__}")
        print(f"   - SignedContract: {SignedContract.__tablename__}")

        return True

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback

        traceback.print_exc()
        return False


def test_requirements():
    """Test: Verificar dependencias instaladas"""
    print("\n" + "=" * 60)
    print("TEST 4: Dependencies Check")
    print("=" * 60)

    deps = {
        "web3": "Web3 (blockchain)",
        "jinja2": "Jinja2 (templates)",
    }

    all_ok = True
    for module, name in deps.items():
        try:
            __import__(module)
            print(f"✅ {name}")
        except ImportError:
            print(f"❌ {name} - NO INSTALADO")
            all_ok = False

    # WeasyPrint - opcional por problemas en macOS
    try:
        __import__("weasyprint")
        print("✅ WeasyPrint (PDF generation)")
    except Exception as e:
        print(f"⚠️  WeasyPrint - {str(e)[:50]}...")
        print("   (Requiere librerías del sistema en macOS)")
        print(
            "   Puedes usar alternativas como wkhtml topdf o usar en producción (Linux)"
        )

    return all_ok


def test_smart_contract():
    """Test: Verificar smart contract files"""
    print("\n" + "=" * 60)
    print("TEST 5: Smart Contract Files")
    print("=" * 60)

    blockchain_dir = Path(__file__).parent.parent / "blockchain"

    files_to_check = {
        "contracts/ContractRegistry.sol": "Smart Contract",
        "scripts/deploy.js": "Deployment Script",
        "hardhat.config.js": "Hardhat Config",
        "package.json": "Package JSON",
    }

    all_ok = True
    for file_path, name in files_to_check.items():
        full_path = blockchain_dir / file_path
        if full_path.exists():
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - NO ENCONTRADO")
            all_ok = False

    return all_ok


def main():
    """Ejecutar todos los tests"""
    print("\n" + "🧪 " * 20)
    print("TESTING SISTEMA DE FIRMA DIGITAL (SIMPLIFIED)")
    print("🧪 " * 20)

    results = {
        "Template": test_template_exists(),
        "Blockchain Import": test_blockchain_import(),
        "Models Import": test_models_import(),
        "Dependencies": test_requirements(),
        "Smart Contract Files": test_smart_contract(),
    }

    # Resumen
    print("\n" + "=" * 60)
    print("📊 RESUMEN")
    print("=" * 60)

    passed = sum(1 for v in results.values() if v)
    total = len(results)

    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")

    print("\n" + "=" * 60)
    print(f"Resultado: {passed}/{total} tests pasados ({passed / total * 100:.0f}%)")
    print("=" * 60)

    if passed >= 4:  # Al menos 4/5
        print("\n🎉 Sistema base funcional!")
        print("\n📝 Próximos pasos:")
        print("   1. Instalar Hardhat: cd blockchain && npm install")
        print("   2. Deploy smart contract: npm run deploy:mumbai")
        print("   3. Configurar .env con CONTRACT_REGISTRY_ADDRESS")
        print("   4. Para PDFs en producción: usar servidor Linux con WeasyPrint")

    return passed >= 4


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
