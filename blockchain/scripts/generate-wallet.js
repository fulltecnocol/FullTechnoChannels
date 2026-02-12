#!/usr/bin/env node
/**
 * Genera una wallet de desarrollo para firmar contratos
 * Solo para testnet - NUNCA usar en producción
 */
const { ethers } = require('ethers');

console.log('\n🔐 Generando Wallet de Desarrollo...\n');
console.log('═'.repeat(60));

const wallet = ethers.Wallet.createRandom();

console.log('\n📝 Información de la Wallet:\n');
console.log(`Address: ${wallet.address}`);
console.log(`Private Key: ${wallet.privateKey}`);
console.log(`Mnemonic: ${wallet.mnemonic.phrase}`);

console.log('\n' + '═'.repeat(60));
console.log('\n⚠️  IMPORTANTE:\n');
console.log('1. Esta wallet es SOLO para desarrollo/testnet');
console.log('2. Guarda esta información de forma segura');
console.log('3. NUNCA uses esta wallet para fondos reales');
console.log('4. Agrega estas variables a tu .env:\n');

console.log('# Blockchain Wallet (Testnet)');
console.log(`SIGNER_ADDRESS=${wallet.address}`);
console.log(`SIGNER_PRIVATE_KEY=${wallet.privateKey}`);
console.log('');

console.log('📥 Siguiente paso: Obtener MATIC testnet gratis');
console.log('   https://faucet.polygon.technology/');
console.log(`   Pega este address: ${wallet.address}`);
console.log('');
