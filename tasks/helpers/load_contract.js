


module.exports.loadContracts = async function(modules = []){

    const {network, ethers} = require("hardhat");

    if(typeof network.config.networkid == "undefined")
            throw("Please select network")
    
    const config = require("../../hardhat.config");
    
    const accounts = await ethers.getSigners();

    const balance = await ethers.provider.getBalance(accounts[0].address)

    //console.log("Balance:", ethers.formatEther(balance), "ETH")

    
    const deployed_addresses = require(`../../${network.name}_proxy_addresses.json`)
    const output = {};

    const hubartifacts = require("../../artifacts/contracts/Hub/IHub.sol/IHub.json");
    output.hub = await new ethers.Contract(deployed_addresses["Hub"],hubartifacts.abi,accounts[0])
    const partnerid = await output.hub.getPartnerIdByAddress(accounts[0].address)

    //console.log("partnerid", partnerid)


    var partnerModules = await output.hub.getPartnerModules(partnerid)

    if(modules.length)
        partnerModules = modules;


    for (let index = 0; index < partnerModules.length; index++) {
        const module = partnerModules[index];

        try {
            let address = await output.hub.getModule(module, partnerid);
            output[module] = await ethers.getContractAt(module, address, accounts[0])
        } catch (error) {
            console.error("Cannot load module", module, error)
        }

    }

    output.hubAddress = deployed_addresses["Hub"]
    output.config = config.networks[network.name]


    return output;
}