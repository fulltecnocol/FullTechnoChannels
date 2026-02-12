# 🔐 Smart Contract Setup Guide

## 📋 Prerequisites

1. **Crear una wallet de firma** (solo para transacciones del smart contract)
2. **Obtener MATIC gratuito** de testnet faucet
3. **Configurar variables de entorno**

---

## 🛠️ Setup Paso a Paso

### 1. Crear Wallet de Firma

```bash
# Opción A: Crear nueva wallet con Node.js
node -e "const ethers = require('ethers'); const wallet = ethers.Wallet.createRandom(); console.log('Address:', wallet.address); console.log('Private Key:', wallet.privateKey);"

# Opción B: Usar MetaMask
# - Crear nueva cuenta en MetaMask
# - Exportar private key (Settings -> Security & Privacy -> Reveal Private Key)
```

**⚠️ IMPORTANTE:** 
- Esta wallet es SOLO para firmar contratos (no para fondos de usuarios)
- Guarda la private key de forma SEGURA
- Nunca commites la private key al repositorio

---

### 2. Obtener MATIC Testnet (Mumbai)

**Faucets disponibles:**

1. **Polygon Faucet** (recomendado)
   - URL: https://faucet.polygon.technology/
   - Da: 0.5 MATIC
   - Frecuencia: Cada 24h

2. **Alchemy Faucet**
   - URL: https://mumbaifaucet.com/
   - Da: 0.5 MATIC
   - Frecuencia: Cada 24h

3. **QuickNode Faucet**
   - URL: https://faucet.quicknode.com/polygon/mumbai
   - Da: 0.1 MATIC
   - Frecuencia: Ilimitado (con rate limit)

**Pasos:**
1. Copia tu wallet address (la que creaste en paso 1)
2. Ve a uno de los faucets
3. Pega tu address
4. Solicita MATIC
5. Espera ~30 segundos
6. Verifica balance en: https://mumbai.polygonscan.com/address/TU_ADDRESS

---

### 3. Obtener API Keys

#### PolygonScan API Key (para verificación)

1. Ve a: https://polygonscan.com/register
2. Crea cuenta gratuita
3. Ve a "API Keys" en tu perfil
4. Crea un nuevo API key
5. Copia el key

**Nota:** Este API key es para verificar el contrato en PolygonScan (opcional pero recomendado)

---

### 4. Configurar Variables de Entorno

Crea/actualiza `.env` en la raíz del proyecto:

```bash
# Polygon Blockchain
POLYGON_MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
POLYGON_RPC_URL=https://polygon-rpc.com

# Wallet de Firma (⚠️ MANTENER SEGURO)
SIGNER_PRIVATE_KEY=0xTU_PRIVATE_KEY_AQUI  # De paso 1
SIGNER_ADDRESS=0xTU_ADDRESS_AQUI          # De paso 1

# PolygonScan (opcional, para verificación)
POLYGONSCAN_API_KEY=TU_API_KEY_AQUI       # De paso 3

# Smart Contract (se llenará después del deploy)
# CONTRACT_REGISTRY_ADDRESS=              # Se obtiene después del deploy
```

**Ejemplo completo:**
```bash
POLYGON_MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
SIGNER_PRIVATE_KEY=0xa1b2c3d4e5f6...  # 66 caracteres (0x + 64 hex)
SIGNER_ADDRESS=0x1234567890AbCdEf...   # 42 caracteres (0x + 40 hex)
POLYGONSCAN_API_KEY=ABC123XYZ456
```

---

### 5. Verificar Setup

```bash
# En la carpeta blockchain/
npm run check-setup
```

Esto verificará:
- ✅ Wallet configurada
- ✅ RPC conectado
- ✅ Balance de MATIC suficiente (>0.1 MATIC)

---

## 🚀 Deployment

### Deploy a Mumbai Testnet

```bash
cd blockchain
npm run deploy:mumbai
```

**Esperado:**
```
🚀 Deploying ContractRegistry...
  Network: mumbai (Chain ID: 80001)
  Deployer: 0x1234...
  Balance: 0.5 MATIC

✅ ContractRegistry deployed to: 0xABCD1234...
  Transaction: 0x9876...
  Block: #12345678
  Gas used: ~500,000

🔍 Verifying contract on PolygonScan...
✅ Contract verified successfully!
  View on: https://mumbai.polygonscan.com/address/0xABCD1234...
```

### Guardar Contract Address

Después del deploy, actualiza `.env`:

```bash
CONTRACT_REGISTRY_ADDRESS=0xABCD1234...  # El address que salió arriba
```

### Verificar Deployment

```bash
# Ver contrato en PolygonScan
https://mumbai.polygonscan.com/address/CONTRACT_REGISTRY_ADDRESS

# Probar desde Python
python3 -c "from api.services.blockchain_service import get_blockchain_service; bc = get_blockchain_service(); print('Total contracts:', bc.get_total_contracts())"
```

---

## 📊 Costos Estimados

### Mumbai Testnet (Gratis)
- Deploy: 0.01 MATIC (~$0.00)
- Store contract: 0.0001 MATIC por contrato (~$0.00)
- **Total: GRATIS** (usando MATIC de faucet)

### Polygon Mainnet (Producción)
- Deploy: ~0.01 MATIC (~$0.01 USD)
- Store contract: ~0.0001 MATIC por firma (~$0.0001 USD)
- **1000 firmas/mes: ~$0.10 USD/mes**

---

## 🔧 Troubleshooting

### Error: "Insufficient funds"
```bash
# Verifica balance
curl -X POST https://rpc-mumbai.maticvigil.com \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["TU_ADDRESS","latest"],"id":1}'

# Obtén más MATIC de faucet
```

### Error: "nonce too low"
```bash
# Reinicia Hardhat
rm -rf cache/ artifacts/
npx hardhat clean
npm run deploy:mumbai
```

### Error: "network not found"
```bash
# Verifica que POLYGON_MUMBAI_RPC_URL esté en .env
echo $POLYGON_MUMBAI_RPC_URL

# Si está vacío, exportalo:
export POLYGON_MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
```

### Verificación manual de contrato
```bash
npx hardhat verify --network mumbai CONTRACT_ADDRESS
```

---

## 📚 Recursos

- **Polygon Mumbai Explorer:** https://mumbai.polygonscan.com/
- **Faucet:** https://faucet.polygon.technology/
- **Docs Polygon:** https://docs.polygon.technology/
- **Hardhat Docs:** https://hardhat.org/getting-started/

---

## ✅ Checklist Final

- [ ] Wallet creada y private key guardada
- [ ] MATIC obtenido de faucet (>0.1 MATIC)
- [ ] Variables .env configuradas
- [ ] `npm install` ejecutado
- [ ] Contrato deployed exitosamente
- [ ] CONTRACT_REGISTRY_ADDRESS agregado al .env
- [ ] Verificación en PolygonScan confirmada
- [ ] Test desde Python exitoso

---

**Siguiente paso:** Integrar el smart contract con el backend API ✅
