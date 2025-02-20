


module.exports.loadContracts = async function(modules = []){

    const {network, ethers} = require("hardhat");

    if(typeof network.config.networkid == "undefined")
            throw("Please select network")
    
    const config = require("../../hardhat.config");
    
    const accounts = await ethers.getSigners();

    const deployed_addresses = require(`../../${network.name}_proxy_addresses.json`)
    const output = {};

    
    output.hub = await ethers.getContractAt("Hub", deployed_addresses["Hub"], accounts[0])
    const partnerid = await output.hub.getPartnerIdByAddress(accounts[0].address)

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

    output.SMSMessageOracle = await ethers.getContractAt("MessageOracle",deployed_addresses["MessageOracle#SMS"],accounts[0])
    output.EmailMessageOracle = await ethers.getContractAt("MessageOracle",deployed_addresses["MessageOracle#Email"],accounts[0])

    output.hubAddress = deployed_addresses["Hub"]
    output.config = config.networks[network.name]


    return output;
}