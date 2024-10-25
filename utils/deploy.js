const fs = require('fs').promises;

module.exports.deployProxy = async function(contract,init = [], prefix="", savetoconfig = true){
    const {upgrades, network, ethers} = require("hardhat");
    const [owner] = await ethers.getSigners();
    var config
    
    if(savetoconfig)
        config = await getDeployConfig();
    else
        config = {};

    let contract_key = contract;

    if(prefix.length){
        prefix = "#"+prefix;
        contract_key = contract_key+prefix;
    }


    if(typeof config[contract_key] != "undefined")
        throw("Already deployed!")


    const contractFactory = await ethers.getContractFactory(contract)
    const deploy = await upgrades.deployProxy(contractFactory,init)

    const deployed = await deploy.waitForDeployment()
    
    config[contract_key] = deployed.target;
    
    if(savetoconfig)
        await updateDeployConfig(config);

    

    return deployed;
}

module.exports.upgradeProxy = async function(contract, prefix="", contract_address = ""){
    const {upgrades, network, ethers} = require("hardhat");
    const [owner] = await ethers.getSigners();

    let contract_key = contract;

    if(prefix.length){
        prefix = "#"+prefix;
        contract_key = contract_key+prefix;
    }

    if(contract_address.length == 0)
        contract_address = await getDeployConfig()[contract_key];
    
    if(contract_address.length == 0)
        throw("Contract address not found")

    const contractFactory = await ethers.getContractFactory(contract)
    const deploy = await upgrades.upgradeProxy(contract_address, contractFactory)

    const deployed = await deploy.waitForDeployment()

    return deployed;
}

async function getDeployConfig(){
    const {network} = require("hardhat");

    try {
        const config = await fs.readFile(__dirname+"/../"+network.name+"_proxy_addresses.json", 'utf8');
        return JSON.parse(config)
    
    } catch (error) {
        return {}
    }

}

async function updateDeployConfig(config){
    const {network} = require("hardhat");
    console.log(config)
    await fs.writeFile(__dirname+"/../"+network.name+"_proxy_addresses.json", JSON.stringify(config, null, "\t"));
}
