module.exports.deployProxy = async function (contract, init = [], libs = []) {
    const { upgrades, ethers } = require("hardhat");

    const libraries = {}

    if (libs.length) {
        for (let index = 0; index < libs.length; index++) {
            const libname = libs[index];

            const contractFactory = await ethers.getContractFactory(libname)
            const deploy = await contractFactory.deploy()
            const deployed = await deploy.waitForDeployment()
            libraries[libname] = deployed.target
        }
    }

    const contractFactory = await ethers.getContractFactory(contract,{
        libraries 
    })
    const deploy = await upgrades.deployProxy(contractFactory, init, {unsafeAllow: ["external-library-linking"]})

    const deployed = await deploy.waitForDeployment()


    return deployed;
}