const userScope = scope("User", "Tasks for User module");
const {deployProxy, upgradeProxy} = require("../utils/deploy")
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



userScope.task("version", "Version module")
.setAction(async () => {
    try {
        const {User} = await loadContract()
        console.log("User version:",await User.getVersion())
    } catch (error) {
        console.log(error)
    }

})




userScope.task("upgrade", "Upgrade module")
.setAction(async () => {
    let v1 = await deployProxy("User", [1,"0xF862ECbf6d78cC5bc3b11Db1940df00fF6e4d6AA", ethers.encodeBytes32String("test"), ethers.encodeBytes32String("test"), ethers.toUtf8Bytes("test")], "prefix", false)

    await upgradeProxy("User","prefix", v1.target)
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

    console.log("Module address", userModuleAddress);

    const User = await new ethers.Contract(userModuleAddress,UserArtifacts.abi,accounts[0])

    return {hub, hubAddress:deployed_addresses["Hub#Hub"],User, config: config.networks[network.name]};
}