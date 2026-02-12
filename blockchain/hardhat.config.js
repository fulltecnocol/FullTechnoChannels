require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    },

    networks: {
        // Red local para testing
        hardhat: {
            chainId: 31337
        },

        // Polygon Mumbai Testnet
        mumbai: {
            url: process.env.POLYGON_MUMBAI_RPC_URL || "https://rpc-mumbai.maticvigil.com",
            accounts: process.env.SIGNER_PRIVATE_KEY ? [process.env.SIGNER_PRIVATE_KEY] : [],
            chainId: 80001,
            gasPrice: 20000000000, // 20 gwei
        },

        // Polygon Mainnet
        polygon: {
            url: process.env.POLYGON_RPC_URL || "https://polygon-rpc.com",
            accounts: process.env.SIGNER_PRIVATE_KEY ? [process.env.SIGNER_PRIVATE_KEY] : [],
            chainId: 137,
            gasPrice: 50000000000, // 50 gwei (ajustar según red)
        }
    },

    etherscan: {
        apiKey: {
            polygon: process.env.POLYGONSCAN_API_KEY || "",
            polygonMumbai: process.env.POLYGONSCAN_API_KEY || ""
        }
    },

    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts"
    }
};
