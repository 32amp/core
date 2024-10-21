const userScope = scope("User", "Tasks for User module");

userScope.task("setTestUserByEmail", "Add test email for testing auth")
.addParam("email", "Email")
.addParam("code", "Code verification")
.setAction(async (args) =>{
    const {User} = await loadContract()
    try {
        await User.setTestUserByEmail(ethers.encodeBytes32String(args.email), ethers.encodeBytes32String(args.code))
        console.log("Success!")
    } catch (error) {
        console.error(error)
    }
})

userScope.task("setTestUserByPhone", "Add test phone for testing auth")
.addParam("phone", "Phone")
.addParam("code", "Code verification")
.setAction(async (args) =>{
    const {User} = await loadContract()
    try {
        await User.setTestUserByPhone(ethers.encodeBytes32String(args.phone), ethers.encodeBytes32String(args.code))
        console.log("Success!")
    } catch (error) {
        console.error(error)
    }
})

async function loadContract(){

    const {network, ethers} = require("hardhat");

    if(typeof network.config.networkid == "undefined")
            throw("Please select network")
    
    const config = require("../hardhat.config");
    
    const accounts = await ethers.getSigners();

    const balance = await ethers.provider.getBalance(accounts[0].address)

    console.log("Balance:", ethers.formatEther(balance), "ETH")

    const deployed_addresses = require(`../ignition/deployments/chain-${network.config.networkid}/deployed_addresses.json`)

    const hubartifacts = require("../artifacts/contracts/Hub/IHub.sol/IHub.json");
    const UserArtifacts = require("../artifacts/contracts/User/IUser.sol/IUser.json");

    const hub = await new ethers.Contract(deployed_addresses["Hub#Hub"],hubartifacts.abi,accounts[0])
    const partnerid = await hub.getPartnerIdByAddress(accounts[0].address)
    
    const userModuleAddress = await hub.getModule("User", partnerid);


    const User = await new ethers.Contract(userModuleAddress,UserArtifacts.abi,accounts[0])

    return {hub, hubAddress:deployed_addresses["Hub#Hub"],User, config: config.networks[network.name]};
}