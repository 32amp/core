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
      networkid:544566,
      accounts: {mnemonic: mnemonic}
    },
    dev: {
      url: "https://node1.portalcharge.ru",
      networkid:544566,
      accounts: {mnemonic: mnemonic}
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
};
