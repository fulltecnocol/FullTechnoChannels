const hre = require("hardhat");

async function main() {
    console.log("🔍 Checking account status...");

    // Configura provider explícitamente si hardhat falla
    // const provider = new hre.ethers.JsonRpcProvider(process.env.POLYGON_AMOY_RPC_URL);
    const provider = hre.ethers.provider;

    const [signer] = await hre.ethers.getSigners();
    const address = signer.address;

    console.log("Account:", address);

    const balance = await provider.getBalance(address);
    console.log("Balance:", hre.ethers.formatEther(balance), "MATIC");

    const nonce = await provider.getTransactionCount(address);
    console.log("Confirmed Nonce:", nonce);

    // Intenta ver pending transactions (a veces no funciona en JSON-RPC genérico)
    // const pendingNonce = await provider.getTransactionCount(address, "pending");
    // console.log("Pending Nonce:", pendingNonce);

    console.log("\nIf Confirmed Nonce is 0, no transactions have been mined.");
    console.log("If Pending Nonce > Confirmed Nonce, transactions are stuck.");

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
