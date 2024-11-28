const messageOracleScope = scope("MessageOracle", "Tasks for MessageOracle service");

messageOracleScope.task("version", "Version module")
.setAction(async () => {
    try {
        const {EmailService, SMSService} = await loadContract()
        console.log("EmailService version:",await EmailService.getVersion())
        console.log("SMSService version:",await SMSService.getVersion())
    } catch (error) {
        console.log(error)
    }

})


messageOracleScope.task("refill", "Refill balance for service")
.addParam("partnerid", "Partner id")
.addParam("amount", "Amount of ETH what you want to send")
.addParam("service", "EmailService or SMSService")
.setAction(async (args) => {
    try {
        const {EmailService, SMSService, hub} = await loadContract()
        const moduleAddress = hub.getModule("Auth",args.partnerid)
        
        if(args.service == "EmailService"){    
            await EmailService.refill(moduleAddress,{value:ethers.parseEther(args.amount)})
        }else if (args.service == "SMSService"){
            await SMSService.refill(moduleAddress,{value:ethers.parseEther(args.amount)})
        }

    } catch (error) {
        console.log(error)
    }

})



async function loadContract(){

    const {network, ethers} = require("hardhat");

    if(typeof network.config.networkid == "undefined")
            throw("Please select network")
    
    const config = require("../hardhat.config");
    
    const accounts = await ethers.getSigners();

    const balance = await ethers.provider.getBalance(accounts[0].address)

    console.log("Account:",accounts[0].address)
    console.log("Balance:", ethers.formatEther(balance), "ETH")

    const deployed_addresses = require(`../${network.name}_proxy_addresses.json`)

    const hubartifacts = require("../artifacts/contracts/Hub/IHub.sol/IHub.json");
    const IMessageOracleArtifacts = require("../artifacts/contracts/Services/IMessageOracle.sol/IMessageOracle.json");

    const hub = await new ethers.Contract(deployed_addresses["Hub"],hubartifacts.abi,accounts[0])
    
    const EmailServiceAddress = await hub.getService("EmailService");
    const SMSServiceAddress = await hub.getService("SMSService");


    const EmailService = await new ethers.Contract(EmailServiceAddress,IMessageOracleArtifacts.abi,accounts[0])
    const SMSService = await new ethers.Contract(SMSServiceAddress,IMessageOracleArtifacts.abi,accounts[0])

    return {hub, hubAddress:deployed_addresses["Hub"],EmailService, SMSService, config: config.networks[network.name]};
}