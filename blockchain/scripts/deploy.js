// Script de deployment del ContractRegistry
// Para Polygon Mumbai (testnet) y Polygon Mainnet

const hre = require("hardhat");

async function main() {
    console.log("🚀 Deploying ContractRegistry...");
    console.log("Network:", hre.network.name);

    // Get deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    // Get balance
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", hre.ethers.formatEther(balance), "MATIC");

    // Deploy contract
    const ContractRegistry = await hre.ethers.getContractFactory("ContractRegistry");

    // Forzar nonce actual para reemplazar transacciones atascadas
    const currentNonce = await hre.ethers.provider.getTransactionCount(deployer.address);
    console.log("Using nonce:", currentNonce);

    const registry = await ContractRegistry.deploy({ nonce: currentNonce });

    await registry.waitForDeployment();

    const address = await registry.getAddress();

    console.log("✅ ContractRegistry deployed to:", address);
    console.log("");
    console.log("📝 Save these values to your .env:");
    console.log(`CONTRACT_REGISTRY_ADDRESS=${address}`);
    console.log(`SIGNER_ADDRESS=${deployer.address}`);
    console.log("");
    console.log("🔍 Verify on PolygonScan:");

    if (hre.network.name === "mumbai") {
        console.log(`https://mumbai.polygonscan.com/address/${address}`);
    } else if (hre.network.name === "polygon") {
        console.log(`https://polygonscan.com/address/${address}`);
    }

    console.log("");
    console.log("⏳ Waiting 30 seconds before verification...");
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Verify on Polygonscan
    if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
        console.log("🔍 Verifying contract on PolygonScan...");
        try {
            await hre.run("verify:verify", {
                address: address,
                constructorArguments: [],
            });
            console.log("✅ Contract verified!");
        } catch (error) {
            console.log("❌ Verification failed:", error.message);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
