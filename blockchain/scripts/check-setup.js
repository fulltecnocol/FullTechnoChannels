#!/usr/bin/env node
/**
 * Setup verification script
 * Verifica que todo esté listo para deploy
 */
const { ethers } = require('ethers');
require('dotenv').config({ path: '../.env' });

async function checkSetup() {
    console.log('\n🔍 Verificando Setup de Smart Contract...\n');
    console.log('═'.repeat(60));

    let allGood = true;

    // 1. Check environment variables
    console.log('\n📋 Variables de Entorno:');

    const requiredVars = {
        'POLYGON_MUMBAI_RPC_URL': process.env.POLYGON_MUMBAI_RPC_URL,
        'SIGNER_PRIVATE_KEY': process.env.SIGNER_PRIVATE_KEY,
        'SIGNER_ADDRESS': process.env.SIGNER_ADDRESS,
    };

    const optionalVars = {
        'POLYGONSCAN_API_KEY': process.env.POLYGONSCAN_API_KEY,
    };

    for (const [key, value] of Object.entries(requiredVars)) {
        if (value) {
            console.log(`   ✅ ${key}: configurado`);
        } else {
            console.log(`   ❌ ${key}: NO CONFIGURADO`);
            allGood = false;
        }
    }

    for (const [key, value] of Object.entries(optionalVars)) {
        if (value) {
            console.log(`   ✅ ${key}: configurado`);
        } else {
            console.log(`   ⚠️  ${key}: no configurado (opcional)`);
        }
    }

    if (!allGood) {
        console.log('\n❌ Faltan variables de entorno. Revisa .env');
        process.exit(1);
    }

    // 2. Check RPC connection
    console.log('\n🌐 Conectividad RPC:');

    try {
        const provider = new ethers.JsonRpcProvider(process.env.POLYGON_MUMBAI_RPC_URL);
        const network = await provider.getNetwork();
        const blockNumber = await provider.getBlockNumber();

        console.log(`   ✅ Conectado a: ${network.name || 'Mumbai'}`);
        console.log(`   ✅ Chain ID: ${network.chainId}`);
        console.log(`   ✅ Último bloque: ${blockNumber.toLocaleString()}`);
    } catch (error) {
        console.log(`   ❌ Error de conexión: ${error.message}`);
        allGood = false;
    }

    // 3. Check wallet
    console.log('\n👛 Wallet de Firma:');

    try {
        const wallet = new ethers.Wallet(process.env.SIGNER_PRIVATE_KEY);

        if (wallet.address.toLowerCase() !== process.env.SIGNER_ADDRESS.toLowerCase()) {
            console.log(`   ⚠️  WARNING: SIGNER_ADDRESS no coincide con private key`);
            console.log(`      Configurado: ${process.env.SIGNER_ADDRESS}`);
            console.log(`      Real: ${wallet.address}`);
            console.log(`      Usando el address real...`);
        } else {
            console.log(`   ✅ Address: ${wallet.address}`);
        }

        // Check balance
        const provider = new ethers.JsonRpcProvider(process.env.POLYGON_MUMBAI_RPC_URL);
        const balance = await provider.getBalance(wallet.address);
        const balanceMatic = ethers.formatEther(balance);

        console.log(`   Balance: ${parseFloat(balanceMatic).toFixed(4)} MATIC`);

        if (parseFloat(balanceMatic) < 0.1) {
            console.log(`   ⚠️  Balance bajo! Necesitas al menos 0.1 MATIC`);
            console.log(`   📥 Obtén MATIC gratis en: https://faucet.polygon.technology/`);
            allGood = false;
        } else {
            console.log(`   ✅ Balance suficiente para deploy`);
        }

        // Estimate deploy cost
        const estimatedGas = 500000n; // ~500k gas para deploy
        const gasPrice = (await provider.getFeeData()).gasPrice || 30000000000n;
        const estimatedCost = estimatedGas * gasPrice;
        const estimatedCostMatic = ethers.formatEther(estimatedCost);

        console.log(`   📊 Costo estimado deploy: ~${parseFloat(estimatedCostMatic).toFixed(4)} MATIC`);

    } catch (error) {
        console.log(`   ❌ Error con wallet: ${error.message}`);
        allGood = false;
    }

    // 4. Summary
    console.log('\n' + '═'.repeat(60));

    if (allGood) {
        console.log('\n🎉 ¡Todo listo para deploy!');
        console.log('\n📝 Siguiente paso:');
        console.log('   npm run deploy:mumbai');
        console.log('');
        return true;
    } else {
        console.log('\n❌ Setup incompleto. Revisa los errores arriba.');
        console.log('\n📚 Guía: blockchain/DEPLOYMENT_GUIDE.md');
        console.log('');
        return false;
    }
}

// Run
checkSetup()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
        console.error('\n❌ Error inesperado:', error);
        process.exit(1);
    });
