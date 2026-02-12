const { ethers } = require("ethers");
require('dotenv').config({ path: '../.env' });

async function main() {
    console.log("🕵️‍♂️ Buscando contratos desplegados...");

    const provider = new ethers.JsonRpcProvider(process.env.POLYGON_AMOY_RPC_URL);
    const sender = process.env.SIGNER_ADDRESS;

    console.log(`Sender: ${sender}`);

    // Check nonces 1 to 5
    for (let nonce = 1; nonce <= 5; nonce++) {
        const address = ethers.getCreateAddress({ from: sender, nonce });
        console.log(`Checking Nonce ${nonce} -> ${address}`);

        const code = await provider.getCode(address);

        if (code !== "0x") {
            console.log(`✅ ¡ENCONTRADO! Contrato en Nonce ${nonce}`);
            console.log(`📍 ADDRESS: ${address}`);
            console.log(`🔗 Ver: https://amoy.polygonscan.com/address/${address}`);

            // Si es nonce 1, seguramente es el primero que intentamos
            // Nonce 0 fue la limpieza (self-transfer, no crea contrato)
            // Nonce 2 fue otro intento...

            return;
        } else {
            console.log("❌ Vacío");
        }
    }

    console.log("No se encontraron contratos en los primeros 5 nonces.");
}

main();
