module.exports.deployProxy = async function (contract, init = [], libs = [], signer = null) {
    const { upgrades, ethers } = require("hardhat");

    const libraries = {}

    if (libs.length) {
        for (let index = 0; index < libs.length; index++) {
            const libname = libs[index];

            var contractFactory = await ethers.getContractFactory(libname)

            if(signer != null){
                contractFactory = contractFactory.connect(signer);
            }

            const deploy = await contractFactory.deploy()
            const deployed = await deploy.waitForDeployment()
            libraries[libname] = deployed.target
        }
    }

    var contractFactory = await ethers.getContractFactory(contract, {
        libraries 
    })

    if(signer != null){
        contractFactory = contractFactory.connect(signer);
    }
    
    const deploy = await upgrades.deployProxy(contractFactory, init, {
        unsafeAllow: ["external-library-linking"]
    })

    const deployed = await deploy.waitForDeployment()

    return deployed;
}