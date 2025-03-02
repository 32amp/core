require("@nomicfoundation/hardhat-toolbox");
require('@openzeppelin/hardhat-upgrades');
require("./utils/taskloader");
require("solidity-docgen");

const mnemonic = require('fs').readFileSync('.mnemonic', 'utf8');


module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    testnet: {
      url: "https://node1.portalcharge.ru",
      networkid:544566,
      accounts: {mnemonic: mnemonic}
    },
  },
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: false,
    },
  },
  mocha: {
    timeout: 12000000
  },
  docgen: {
    outputDir: "./docs/contracts",
    pages: "items",
    collapseNewlines: true,
  },
};
