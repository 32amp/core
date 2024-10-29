const userScope = scope("User", "Tasks for User module");
const { upgradeProxy} = require("../utils/deploy")

userScope.task("userupgrade", "Upgrade User contract")
.setAction(async function(){
    const User = await upgradeProxy("User")
    await User.upgrade();
})

userScope.task("version", "Version module")
.setAction(async () => {
    try {
        const {User} = await loadContract()
        console.log("User version:",await User.getVersion())
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

    console.log("Balance:", ethers.formatEther(balance), "ETH")

    
    const deployed_addresses = require(`../${network.name}_proxy_addresses.json`)

    const hubartifacts = require("../artifacts/contracts/Hub/IHub.sol/IHub.json");
    const UserArtifacts = require("../artifacts/contracts/User/IUser.sol/IUser.json");

    const hub = await new ethers.Contract(deployed_addresses["Hub"],hubartifacts.abi,accounts[0])
    const partnerid = await hub.getPartnerIdByAddress(accounts[0].address)
    
    const userModuleAddress = await hub.getModule("User", partnerid);

    console.log("Module address", userModuleAddress);

    const User = await new ethers.Contract(userModuleAddress,UserArtifacts.abi,accounts[0])

    return {hub, hubAddress:deployed_addresses["Hub"],User, config: config.networks[network.name]};
}