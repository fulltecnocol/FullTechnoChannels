# 🔐 TeleGate - Smart Contracts

Sistema de registro inmutable de contratos firmados en Polygon blockchain.

## 📋 Contenido

- **ContractRegistry.sol** - Smart contract principal
- **deploy.js** - Script de deployment
- **hardhat.config.js** - Configuración de Hardhat

---

## 🚀 Setup Inicial

### 1. Instalar Dependencias

```bash
cd blockchain
npm install
```

### 2. Configurar Variables de Entorno

Agrega estas variables al archivo `.env` en la raíz del proyecto:

```bash
# Polygon RPC URLs
POLYGON_MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
POLYGON_RPC_URL=https://polygon-rpc.com

# Private Key (crear nueva wallet para esto)
SIGNER_PRIVATE_KEY=0x...

# PolygonScan API Key (para verificación)
POLYGONSCAN_API_KEY=...

# Contract Address (después del deploy)
CONTRACT_REGISTRY_ADDRESS=0x...
SIGNER_ADDRESS=0x...
```

### 3. Crear Wallet de Firma

**Opción A: Usar MetaMask**
1. Crea una nueva cuenta en MetaMask
2. Exporta la private key
3. Guárdala en `.env` como `SIGNER_PRIVATE_KEY`

**Opción B: Generar con Hardhat**
```bash
npx hardhat node
# Copia una de las private keys que muestra
```

### 4. Obtener MATIC de Testnet

Para Mumbai testnet:
https://faucet.polygon.technology/

---

## 🔨 Comandos

### Compilar Contratos
```bash
npm run compile
```

### Testing Local
```bash
npm test
```

### Deploy a Mumbai (Testnet)
```bash
npm run deploy:mumbai
```

### Deploy a Polygon Mainnet
```bash
npm run deploy:polygon
```

---

## 📊 Costos Estimados

### Mumbai (Testnet)
- Deploy: GRATIS (MATIC de faucet)
- Store contract: GRATIS

### Polygon Mainnet
- Deploy: ~$0.50 USD (una sola vez)
- Store contract: ~$0.001 USD por contrato

**Total para 1000 contratos/mes:** ~$1 USD

---

## 🔍 Verificación en PolygonScan

Después del deploy, el contrato se verifica automáticamente.

Si falla, verificar manualmente:

```bash
npx hardhat verify --network mumbai CONTRACT_ADDRESS
```

---

## 📝 Uso del Smart Contract

### Desde Python (Backend)

```python
from web3 import Web3

# Conectar a Polygon
w3 = Web3(Web3.HTTPProvider(os.getenv("POLYGON_RPC_URL")))

# Cargar contrato
contract_address = os.getenv("CONTRACT_REGISTRY_ADDRESS")
contract_abi = [...]  # ABI del contrato

contract = w3.eth.contract(address=contract_address, abi=contract_abi)

# Calcular hash del PDF
import hashlib
pdf_hash = hashlib.sha256(pdf_bytes).hexdigest()

# Guardar en blockchain
tx = contract.functions.storeContract(
    bytes.fromhex(pdf_hash),
    owner_id
).build_transaction({
    'from': os.getenv("SIGNER_ADDRESS"),
    'nonce': w3.eth.get_transaction_count(os.getenv("SIGNER_ADDRESS")),
    'gas': 200000,
    'gasPrice': w3.eth.gas_price
})

# Firmar y enviar
signed_tx = w3.eth.account.sign_transaction(
    tx, 
    private_key=os.getenv("SIGNER_PRIVATE_KEY")
)

tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

print(f"✅ Contrato guardado en blockchain!")
print(f"TX Hash: {receipt['transactionHash'].hex()}")
print(f"Block: {receipt['blockNumber']}")
```

### Verificar Contrato

```python
# Leer del blockchain
result = contract.functions.verifyContract(
    bytes.fromhex(pdf_hash)
).call()

exists, owner_id, timestamp, signer = result

if exists:
    print(f"✅ Contrato verificado!")
    print(f"Owner ID: {owner_id}")
    print(f"Timestamp: {timestamp}")
    print(f"Signer: {signer}")
else:
    print("❌ Contrato no encontrado")
```

---

## 🔐 Seguridad

### Best Practices

1. **NUNCA** commitear private keys al repo
2. **NUNCA** usar la misma wallet para dev y producción
3. **SIEMPRE** testear en Mumbai antes de mainnet
4. **LIMITAR** fondos en la wallet de firma (solo lo necesario)
5. **ROTAR** private keys periódicamente

### Wallet de Firma

La wallet usada para `SIGNER_PRIVATE_KEY` debe:
- Tener solo MATIC suficiente para transacciones
- No tener otros assets
- Ser diferente de wallets personales
- Tener backup seguro de la private key

---

## 📚 Recursos

- **Polygon Docs:** https://docs.polygon.technology/
- **Hardhat Docs:** https://hardhat.org/docs
- **Mumbai Explorer:** https://mumbai.polygonscan.com/
- **Polygon Explorer:** https://polygonscan.com/
- **Faucet Mumbai:** https://faucet.polygon.technology/

---

## ✅ Checklist de Deployment

- [ ] Instalar dependencias (`npm install`)
- [ ] Compilar contratos (`npm run compile`)
- [ ] Configurar `.env` con RPC URLs y private key
- [ ] Obtener MATIC de testnet
- [ ] Deploy a Mumbai (`npm run deploy:mumbai`)
- [ ] Verificar en Mumbai que funciona
- [ ] Obtener MATIC de mainnet (~5 MATIC)
- [ ] Deploy a Polygon (`npm run deploy:polygon`)
- [ ] Actualizar `.env` con `CONTRACT_REGISTRY_ADDRESS`
- [ ] Testear desde backend Python

---

**¿Preguntas?** Contacta al equipo de desarrollo.
