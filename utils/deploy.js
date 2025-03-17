module.exports.deployProxy = async function(contract,init = []){
    const {upgrades, ethers} = require("hardhat");

    const contractFactory = await ethers.getContractFactory(contract)
    const deploy = await upgrades.deployProxy(contractFactory,init)

    const deployed = await deploy.waitForDeployment()
  

    return deployed;
}