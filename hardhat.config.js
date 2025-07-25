require("@nomicfoundation/hardhat-toolbox");
require('@openzeppelin/hardhat-upgrades');
require("./utils/taskloader");
require("solidity-docgen");
require("hardhat-contract-sizer");
require("hardhat-gas-reporter");

const mnemonic = require('fs').readFileSync('.mnemonic', 'utf8');


module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    testnet: {
      url: "https://node1.portalcharge.ru",
      networkid: 544566,
      accounts: { mnemonic: mnemonic }
    },
    dev: {
      url: "https://node1.portalcharge.ru",
      networkid: 544566,
      accounts: { mnemonic: mnemonic },
    },
    superchainL2: {
      url: "http://127.0.0.1:9545",
      networkid: 901,
      accounts:["0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a", "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a"]
    },
    opsepolia: {
      url: "https://sepolia.optimism.io",
      networkid: 11155420,
      accounts: { mnemonic: mnemonic },
    }
  },
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  mocha: {
    timeout: 12000000
  },
  allowUnsafeLinkedLibraries: true,
  gasReporter: {
    enabled: true,
    etherscan: (process.env.ETHERSCAN_API_KEY) ? process.env.ETHERSCAN_API_KEY : "",
    coinmarketcap: (process.env.COINMARKETCAP_API_KEY) ? process.env.COINMARKETCAP_API_KEY : "",
    L2: "optimism",
    L1: "ethereum",
    currencyDisplayPrecision: 5,
    currency: 'USD',
  },
  docgen: {
    outputDir: "./docs/contracts",
    pages: "items",
    collapseNewlines: true,
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: true,
    disambiguatePaths: false,
  },
  defender: {
    "apiKey": (process.env.DEFENDER_API_KEY) ? process.env.DEFENDER_API_KEY : "",
    "apiSecret": (process.env.DEFENDER_API_SECRET) ? process.env.DEFENDER_API_SECRET : ""
  }
};
