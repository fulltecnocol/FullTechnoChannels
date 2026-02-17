// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ContractRegistry
 * @dev Registro inmutable de contratos firmados en TeleGate
 * @notice Este contrato almacena hashes SHA-256 de contratos PDF firmados
 * @author FGate / FGate
 */
contract ContractRegistry {
    
    // Estructura de un contrato registrado
    struct Contract {
        bytes32 contractHash;      // SHA-256 del PDF
        uint256 ownerId;           // ID del owner en la base de datos
        uint256 timestamp;         // Timestamp de firma (block.timestamp)
        address signer;            // Dirección que firmó la transacción
        bool exists;               // Flag de existencia
    }
    
    // Mapping: hash SHA-256 => Contract
    mapping(bytes32 => Contract) public contracts;
    
    // Array de todos los hashes (para enumerar)
    bytes32[] public contractHashes;
    
    // Contador de contratos totales
    uint256 public totalContracts;
    
    // Owner del contrato (para admin/upgrades futuros)
    address public owner;
    
    // ============================================================================
    // EVENTS
    // ============================================================================
    
    event ContractStored(
        bytes32 indexed contractHash,
        uint256 indexed ownerId,
        uint256 timestamp,
        address indexed signer
    );
    
    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );
    
    // ============================================================================
    // MODIFIERS
    // ============================================================================
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    // ============================================================================
    // CONSTRUCTOR
    // ============================================================================
    
    constructor() {
        owner = msg.sender;
        totalContracts = 0;
    }
    
    // ============================================================================
    // MAIN FUNCTIONS
    // ============================================================================
    
    /**
     * @dev Almacena un nuevo contrato en el blockchain
     * @param _contractHash Hash SHA-256 del PDF del contrato
     * @param _ownerId ID del owner en la base de datos de TeleGate
     * @notice Esta función puede ser llamada solo por el owner del smart contract
     */
    function storeContract(
        bytes32 _contractHash,
        uint256 _ownerId
    ) external onlyOwner {
        // Validar que el contrato no exista ya
        require(!contracts[_contractHash].exists, "Contract already exists");
        
        // Validar que el hash no sea vacío
        require(_contractHash != bytes32(0), "Contract hash cannot be empty");
        
        // Validar que ownerId sea válido
        require(_ownerId > 0, "Owner ID must be greater than 0");
        
        // Crear el contrato
        contracts[_contractHash] = Contract({
            contractHash: _contractHash,
            ownerId: _ownerId,
            timestamp: block.timestamp,
            signer: msg.sender,
            exists: true
        });
        
        // Agregar a la lista de hashes
        contractHashes.push(_contractHash);
        
        // Incrementar contador
        totalContracts++;
        
        // Emitir evento
        emit ContractStored(
            _contractHash,
            _ownerId,
            block.timestamp,
            msg.sender
        );
    }
    
    /**
     * @dev Verifica si un contrato existe y retorna su información
     * @param _contractHash Hash del contrato a verificar
     * @return exists Si el contrato existe
     * @return ownerId ID del owner
     * @return timestamp Timestamp de firma
     * @return signer Dirección que firmó
     */
    function verifyContract(bytes32 _contractHash) 
        external 
        view 
        returns (
            bool exists,
            uint256 ownerId,
            uint256 timestamp,
            address signer
        ) 
    {
        Contract memory c = contracts[_contractHash];
        return (
            c.exists,
            c.ownerId,
            c.timestamp,
            c.signer
        );
    }
    
    /**
     * @dev Obtiene un contrato completo por su hash
     * @param _contractHash Hash del contrato
     * @return Estructura completa del contrato
     */
    function getContract(bytes32 _contractHash) 
        external 
        view 
        returns (Contract memory) 
    {
        require(contracts[_contractHash].exists, "Contract does not exist");
        return contracts[_contractHash];
    }
    
    /**
     * @dev Obtiene todos los contratos de un owner específico
     * @param _ownerId ID del owner
     * @return Array de hashes de contratos del owner
     */
    function getContractsByOwner(uint256 _ownerId) 
        external 
        view 
        returns (bytes32[] memory) 
    {
        // Contar cuántos contratos tiene el owner
        uint256 count = 0;
        for (uint256 i = 0; i < contractHashes.length; i++) {
            if (contracts[contractHashes[i]].ownerId == _ownerId) {
                count++;
            }
        }
        
        // Crear array del tamaño correcto
        bytes32[] memory ownerContracts = new bytes32[](count);
        uint256 index = 0;
        
        // Llenar el array
        for (uint256 i = 0; i < contractHashes.length; i++) {
            if (contracts[contractHashes[i]].ownerId == _ownerId) {
                ownerContracts[index] = contractHashes[i];
                index++;
            }
        }
        
        return ownerContracts;
    }
    
    /**
     * @dev Obtiene el número total de contratos almacenados
     * @return Número total de contratos
     */
    function getTotalContracts() external view returns (uint256) {
        return totalContracts;
    }
    
    /**
     * @dev Obtiene el hash de un contrato por su índice
     * @param _index Índice del contrato
     * @return Hash del contrato
     */
    function getContractHashByIndex(uint256 _index) 
        external 
        view 
        returns (bytes32) 
    {
        require(_index < contractHashes.length, "Index out of bounds");
        return contractHashes[_index];
    }
    
    // ============================================================================
    // ADMIN FUNCTIONS
    // ============================================================================
    
    /**
     * @dev Transfiere el ownership del contrato
     * @param newOwner Nueva dirección del owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
    
    /**
     * @dev Verifica si una dirección es el owner
     * @param _address Dirección a verificar
     * @return True si es el owner
     */
    function isOwner(address _address) external view returns (bool) {
        return _address == owner;
    }
}
