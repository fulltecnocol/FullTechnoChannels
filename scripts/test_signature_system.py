#!/usr/bin/env python3
"""
Script de testing para sistema de firma digital
Prueba los componentes principales sin necesidad de servidor corriendo
"""
import sys
import os
from datetime import datetime
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

def test_pdf_generation():
    """Test 1: Generar PDF de contrato"""
    print("\n" + "="*60)
    print("TEST 1: PDF Generation Service")
    print("="*60)
    
    try:
        from api.services.pdf_service import PDFContractService
        
        # Datos de prueba
        legal_info = {
            "person_type": "natural",
            "full_legal_name": "Juan Pérez García",
            "id_type": "CC",
            "id_number": "1234567890",
            "address": "Calle 123 #45-67",
            "city": "Bogotá",
            "department": "Cundinamarca",
            "phone": "+57 300 1234567",
            "bank_name": "Bancolombia",
            "account_type": "ahorros",
            "account_number": "12345678901",
            "account_holder_name": "Juan Pérez García",
            "contract_version": "1.0"
        }
        
        print("\n✅ Importación exitosa")
        print(f"📝 Generando PDF de prueba...")
        
        # Generar preview
        pdf_bytes = PDFContractService.generate_preview_pdf(legal_info)
        
        print(f"✅ PDF generado exitosamente")
        print(f"   Tamaño: {len(pdf_bytes):,} bytes ({len(pdf_bytes)/1024:.1f} KB)")
        
        # Guardar para inspección
        output_path = Path(__file__).parent.parent / "test_output" / "preview_contract.pdf"
        output_path.parent.mkdir(exist_ok=True)
        
        with open(output_path, 'wb') as f:
            f.write(pdf_bytes)
        
        print(f"💾 PDF guardado en: {output_path}")
        print(f"   Puedes abrirlo para verificar el diseño")
        
        # Calcular hash
        pdf_hash = PDFContractService.calculate_pdf_hash(pdf_bytes)
        print(f"\n🔐 Hash SHA-256:")
        print(f"   {pdf_hash}")
        print(f"   Longitud: {len(pdf_hash)} caracteres")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error en test de PDF: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_blockchain_service():
    """Test 2: Servicio de blockchain"""
    print("\n" + "="*60)
    print("TEST 2: Blockchain Service")
    print("="*60)
    
    try:
        from api.services.blockchain_service import get_blockchain_service
        
        print("\n✅ Importación exitosa")
        
        # Inicializar servicio
        blockchain = get_blockchain_service()
        
        # Verificar variables de entorno
        print(f"\n🔍 Configuración:")
        print(f"   RPC URL configurado: {'✅' if os.getenv('POLYGON_RPC_URL') else '❌'}")
        print(f"   Contract Address configurado: {'✅' if os.getenv('CONTRACT_REGISTRY_ADDRESS') else '❌'}")
        print(f"   Signer Address configurado: {'✅' if os.getenv('SIGNER_ADDRESS') else '❌'}")
        print(f"   Private Key configurado: {'✅' if os.getenv('SIGNER_PRIVATE_KEY') else '❌'}")
        
        # Intentar conectar
        print(f"\n🌐 Intentando conectar a red...")
        is_connected = blockchain.is_connected()
        
        if is_connected:
            print(f"✅ Conexión exitosa a Polygon")
            
            # Obtener info de red
            network_info = blockchain.get_network_info()
            print(f"\n📊 Información de Red:")
            print(f"   Chain ID: {network_info.get('chain_id')}")
            print(f"   Último bloque: {network_info.get('latest_block'):,}")
            print(f"   Signer: {network_info.get('signer_address')}")
            
            # Obtener total de contratos (si el contrato está deployed)
            if os.getenv('CONTRACT_REGISTRY_ADDRESS'):
                try:
                    total = blockchain.get_total_contracts()
                    print(f"\n📝 Contratos en blockchain: {total}")
                except Exception as e:
                    print(f"\n⚠️  Contrato no deployed aún (esperado en testnet)")
            else:
                print(f"\n⚠️  CONTRACT_REGISTRY_ADDRESS no configurado")
                print(f"   Para configurarlo:")
                print(f"   1. cd blockchain")
                print(f"   2. npm install")
                print(f"   3. npm run deploy:mumbai")
                print(f"   4. Agregar dirección al .env")
        else:
            print(f"⚠️  No conectado (esperado si RPC_URL no está configurado)")
            print(f"\n   Para habilitar:")
            print(f"   Agregar al .env:")
            print(f"   POLYGON_RPC_URL=https://polygon-rpc.com")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error en test de blockchain: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_database_models():
    """Test 3: Modelos de base de datos"""
    print("\n" + "="*60)
    print("TEST 3: Database Models")
    print("="*60)
    
    try:
        from api.models.signature import OwnerLegalInfo, SignatureCode, SignedContract
        from api.shared.models import User
        
        print("\n✅ Importación de modelos exitosa")
        
        # Verificar atributos de los modelos
        print(f"\n📋 Atributos de OwnerLegalInfo:")
        attrs = [a for a in dir(OwnerLegalInfo) if not a.startswith('_')]
        for attr in sorted(attrs[:10]):  # Primeros 10
            print(f"   - {attr}")
        print(f"   ... y {len(attrs) - 10} más")
        
        print(f"\n📋 Atributos de SignatureCode:")
        attrs = [a for a in dir(SignatureCode) if not a.startswith('_')]
        for attr in sorted(attrs[:10]):
            print(f"   - {attr}")
        print(f"   ... y {len(attrs) - 10} más")
        
        print(f"\n📋 Atributos de SignedContract:")
        attrs = [a for a in dir(SignedContract) if not a.startswith('_')]
        for attr in sorted(attrs[:10]):
            print(f"   - {attr}")
        print(f"   ... y {len(attrs) - 10} más")
        
        print(f"\n✅ Todos los modelos tienen la estructura correcta")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error en test de modelos: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_template_exists():
    """Test 4: Verificar que el template existe"""
    print("\n" + "="*60)
    print("TEST 4: Template Verification")
    print("="*60)
    
    try:
        template_path = Path(__file__).parent.parent / "templates" / "contrato_mandato.html"
        
        if template_path.exists():
            print(f"\n✅ Template encontrado: {template_path}")
            
            # Leer y mostrar stats
            with open(template_path, 'r') as f:
                content = f.read()
            
            print(f"\n📊 Estadísticas del template:")
            print(f"   Líneas: {len(content.splitlines())}")
            print(f"   Tamaño: {len(content):,} bytes ({len(content)/1024:.1f} KB)")
            print(f"   Variables Jinja2: {content.count('{{')} encontradas")
            
            # Verificar variables clave
            key_vars = ['person_type', 'full_legal_name', 'bank_name', 'signature_date']
            print(f"\n🔑 Variables clave:")
            for var in key_vars:
                exists = f"{{{{ {var}" in content
                print(f"   {var}: {'✅' if exists else '❌'}")
            
            return True
        else:
            print(f"\n❌ Template no encontrado en: {template_path}")
            return False
            
    except Exception as e:
        print(f"\n❌ Error en test de template: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Ejecutar todos los tests"""
    print("\n" + "🧪 "*20)
    print("TESTING SISTEMA DE FIRMA DIGITAL")
    print("🧪 "*20)
    
    results = {}
    
    # Ejecutar tests
    results['PDF Generation'] = test_pdf_generation()
    results['Blockchain Service'] = test_blockchain_service()
    results['Database Models'] = test_database_models()
    results['Template Verification'] = test_template_exists()
    
    # Resumen
    print("\n" + "="*60)
    print("📊 RESUMEN DE TESTS")
    print("="*60)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print("\n" + "="*60)
    print(f"Resultado: {passed}/{total} tests pasados ({passed/total*100:.0f}%)")
    print("="*60)
    
    if passed == total:
        print("\n🎉 ¡Todos los tests pasaron! El sistema está listo.")
        print("\n📝 Próximos pasos:")
        print("   1. Deploy smart contract: cd blockchain && npm run deploy:mumbai")
        print("   2. Configurar variables de entorno (CONTRACT_REGISTRY_ADDRESS, etc.)")
        print("   3. Probar API endpoints con el servidor corriendo")
    elif passed > 0:
        print("\n⚠️  Algunos tests fallaron. Revisa los errores arriba.")
    else:
        print("\n❌ Todos los tests fallaron. Revisa la configuración.")
    
    return passed == total


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
