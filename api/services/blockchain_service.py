"""
Servicio de integración con Polygon blockchain
Maneja almacenamiento de contratos en el smart contract
"""
from web3 import Web3
from web3.middleware import geth_poa_middleware
import os
import json
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

# ABI del smart contract (simplificado - las funciones que usamos)
CONTRACT_ABI = [
    {
        "inputs": [
            {"internalType": "bytes32", "name": "_contractHash", "type": "bytes32"},
            {"internalType": "uint256", "name": "_ownerId", "type": "uint256"}
        ],
        "name": "storeContract",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "bytes32", "name": "_contractHash", "type": "bytes32"}
        ],
        "name": "verifyContract",
        "outputs": [
            {"internalType": "bool", "name": "exists", "type": "bool"},
            {"internalType": "uint256", "name": "ownerId", "type": "uint256"},
            {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
            {"internalType": "address", "name": "signer", "type": "address"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint256", "name": "_ownerId", "type": "uint256"}
        ],
        "name": "getContractsByOwner",
        "outputs": [
            {"internalType": "bytes32[]", "name": "", "type": "bytes32[]"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getTotalContracts",
        "outputs": [
            {"internalType": "uint256", "name": "", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
    }
]


class BlockchainService:
    """Servicio para interactuar con Polygon blockchain"""
    
    def __init__(self):
        """Inicializa la conexión con Polygon"""
        # RPC URL
        self.rpc_url = os.getenv("POLYGON_RPC_URL", "https://polygon-rpc.com")
        
        # Connect to Polygon
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
        
        # Agregar middleware para Polygon (PoS chain)
        self.w3.middleware_onion.inject(geth_poa_middleware, layer=0)
        
        # Contract address
        self.contract_address = os.getenv("CONTRACT_REGISTRY_ADDRESS")
        
        # Signer credentials
        self.signer_address = os.getenv("SIGNER_ADDRESS")
        self.signer_private_key = os.getenv("SIGNER_PRIVATE_KEY")
        
        # Initialize contract
        if self.contract_address:
            self.contract = self.w3.eth.contract(
                address=Web3.to_checksum_address(self.contract_address),
                abi=CONTRACT_ABI
            )
        else:
            self.contract = None
            logger.warning("CONTRACT_REGISTRY_ADDRESS not set - blockchain features disabled")
    
    def is_connected(self) -> bool:
        """Verifica si está conectado a la red"""
        try:
            return self.w3.is_connected()
        except Exception as e:
            logger.error(f"Blockchain connection check failed: {e}")
            return False
    
    def get_network_info(self) -> dict:
        """Obtiene información de la red"""
        try:
            return {
                "connected": self.is_connected(),
                "chain_id": self.w3.eth.chain_id,
                "latest_block": self.w3.eth.block_number,
                "contract_address": self.contract_address,
                "signer_address": self.signer_address
            }
        except Exception as e:
            logger.error(f"Failed to get network info: {e}")
            return {"connected": False, "error": str(e)}
    
    async def store_contract(self, contract_hash: str, owner_id: int) -> dict:
        """
        Almacena un contrato en blockchain
        
        Args:
            contract_hash: Hash SHA-256 del contrato (formato: 0x...)
            owner_id: ID del owner en la base de datos
            
        Returns:
            dict: Información de la transacción
        """
        if not self.contract:
            raise ValueError("Blockchain contract not initialized")
        
        if not self.signer_private_key:
            raise ValueError("SIGNER_PRIVATE_KEY not configured")
        
        try:
            # Validar formato del hash
            if not contract_hash.startswith("0x") or len(contract_hash) != 66:
                raise ValueError(f"Invalid contract hash format: {contract_hash}")
            
            # Convertir hash a bytes32
            hash_bytes = bytes.fromhex(contract_hash[2:])
            
            # Build transaction
            nonce = self.w3.eth.get_transaction_count(
                Web3.to_checksum_address(self.signer_address)
            )
            
            # Estimate gas
            gas_estimate = self.contract.functions.storeContract(
                hash_bytes,
                owner_id
            ).estimate_gas({
                'from': Web3.to_checksum_address(self.signer_address)
            })
            
            # Get current gas price
            gas_price = self.w3.eth.gas_price
            
            # Build transaction
            transaction = self.contract.functions.storeContract(
                hash_bytes,
                owner_id
            ).build_transaction({
                'from': Web3.to_checksum_address(self.signer_address),
                'nonce': nonce,
                'gas': gas_estimate + 10000,  # Add buffer
                'gasPrice': gas_price,
                'chainId': self.w3.eth.chain_id
            })
            
            # Sign transaction
            signed_tx = self.w3.eth.account.sign_transaction(
                transaction,
                private_key=self.signer_private_key
            )
            
            # Send transaction
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
          
            logger.info(f"Transaction sent: {tx_hash.hex()}")
            
            # Wait for receipt (timeout 60 seconds)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
            
            # Check if transaction succeeded
            if receipt['status'] != 1:
                raise Exception("Transaction failed on blockchain")
            
            return {
                "success": True,
                "tx_hash": receipt['transactionHash'].hex(),
                "block_number": receipt['blockNumber'],
                "gas_used": receipt['gasUsed'],
                "confirmed": True
            }
            
        except Exception as e:
            logger.error(f"Failed to store contract on blockchain: {e}")
            return {
                "success": False,
                "error": str(e),
                "confirmed": False
            }
    
    def verify_contract(self, contract_hash: str) -> dict:
        """
        Verifica si un contrato existe en blockchain
        
        Args:
            contract_hash: Hash del contrato
            
        Returns:
            dict: Información del contrato
        """
        if not self.contract:
            raise ValueError("Blockchain contract not initialized")
        
        try:
            hash_bytes = bytes.fromhex(contract_hash[2:])
            
            result = self.contract.functions.verifyContract(hash_bytes).call()
            
            exists, owner_id, timestamp, signer = result
            
            return {
                "exists": exists,
                "owner_id": owner_id,
                "timestamp": timestamp,
                "signer": signer
            }
            
        except Exception as e:
            logger.error(f"Failed to verify contract: {e}")
            return {
                "exists": False,
                "error": str(e)
            }
    
    def get_contracts_by_owner(self, owner_id: int) -> list:
        """
        Obtiene todos los contratos de un owner
        
        Args:
            owner_id: ID del owner
            
        Returns:
            list: Lista de hashes de contratos
        """
        if not self.contract:
            raise ValueError("Blockchain contract not initialized")
        
        try:
            hashes = self.contract.functions.getContractsByOwner(owner_id).call()
            return [f"0x{h.hex()}" for h in hashes]
        except Exception as e:
            logger.error(f"Failed to get contracts by owner: {e}")
            return []
    
    def get_total_contracts(self) -> int:
        """Obtiene el total de contratos en blockchain"""
        if not self.contract:
            return 0
        
        try:
            return self.contract.functions.getTotalContracts().call()
        except Exception as e:
            logger.error(f"Failed to get total contracts: {e}")
            return 0


# Singleton instance
_blockchain_service = None

def get_blockchain_service() -> BlockchainService:
    """Obtiene la instancia singleton del servicio de blockchain"""
    global _blockchain_service
    if _blockchain_service is None:
        _blockchain_service = BlockchainService()
    return _blockchain_service
