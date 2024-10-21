require("@nomicfoundation/hardhat-toolbox");
require("./utils/taskloader");

const mnemonic = require('fs').readFileSync('.mnemonic', 'utf8');

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    testnet: {
      url: "https://node1.portalcharge.tech",
     // gasPrice: 21000,
      //skipDryRun: true,
      //timeout:10000000,
      networkid:544566,
      //gas: 1,
      accounts: {mnemonic: mnemonic},
      ignition: {
        requiredConfirmations: 1,
      },
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
    timeout: 300000
  },
  ignition: {
    requiredConfirmations: 1,
  },
};
