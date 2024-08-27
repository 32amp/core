require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  //solidity: "0.8.24",
  solidity: {
    compilers: [
      {
        version: "0.8.24",
      },
      {
        version: "0.4.9",
        settings: {},
      },
    ],
  },
};
