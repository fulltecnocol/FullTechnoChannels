const hre = require("hardhat");

async function main() {
    console.log("🧹 Cleaning pending nonce...");

    // Config para saltar cache
    const provider = new hre.ethers.JsonRpcProvider(process.env.POLYGON_AMOY_RPC_URL);
    const wallet = new hre.ethers.Wallet(process.env.SIGNER_PRIVATE_KEY, provider);

    const address = wallet.address;

    // Obtener balance y nonce directamente desde RPC, no Hardhat
    const balance = await provider.getBalance(address);
    const nonce = await provider.getTransactionCount(address); // Confirmed tx count

    console.log(`Address: ${address}`);
    console.log(`Balance: ${hre.ethers.formatEther(balance)} MATIC`);
    console.log(`Current Confirmed Nonce: ${nonce}`);

    // Crear y enviar transacción de reemplazo
    // Usamos nonce explícito. Si nonce es 0 y hay pending, lo reemplazamos.
    // Si nonce > 0, ya se minó algo.

    const tx = await wallet.sendTransaction({
        to: address,
        value: 0n,
        nonce: nonce, // Forzamos el nonce actual confirmado (para reemplazar pending si existe)
        // Gas Price MUY ALTO para asegurar reemplazo (200 Gwei)
        // Gas Limit bajo (21000)
        gasLimit: 21000n,
        gasPrice: 200000000000n,
    });

    console.log(`Transaction sent: ${tx.hash}`);

    console.log("Waiting for confirmation...");
    await tx.wait(1);

    console.log("✅ Nonce cleared/advanced!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
