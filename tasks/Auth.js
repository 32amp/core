const authScope = scope("Auth", "Tasks for Auth module");
const { upgradeProxy} = require("../utils/deploy")

authScope.task("authupgrade", "Upgrade Auth contract")
.setAction(async function(){
    const Auth = await upgradeProxy("Auth")
    await Auth.upgrade();
})


authScope.task("setTestUserByEmail", "Add test email for testing auth")
.addParam("email", "Email")
.addParam("code", "Code verification")
.setAction(async (args) =>{
    const {Auth} = await loadContract()
    try {
        await Auth.setTestUserByEmail(ethers.encodeBytes32String(args.email), ethers.encodeBytes32String(args.code))
        console.log("Success!")
    } catch (error) {
        console.error(error)
    }
})

authScope.task("setTestUserByPhone", "Add test phone for testing auth")
.addParam("phone", "Phone")
.addParam("code", "Code verification")
.setAction(async (args) =>{
    const {Auth} = await loadContract()
    try {
        await Auth.setTestUserByPhone(ethers.encodeBytes32String(args.phone), ethers.encodeBytes32String(args.code))
        console.log("Success!")
    } catch (error) {
        console.error(error)
    }
})



authScope.task("version", "Version module")
.setAction(async () => {
    try {
        const {Auth} = await loadContract()
        console.log("Auth version:",await Auth.getVersion())
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
    const AuthArtifacts = require("../artifacts/contracts/User/IAuth.sol/IAuth.json");

    const hub = await new ethers.Contract(deployed_addresses["Hub"],hubartifacts.abi,accounts[0])
    const partnerid = await hub.getPartnerIdByAddress(accounts[0].address)
    
    const userModuleAddress = await hub.getModule("Auth", partnerid);

    console.log("Module address", userModuleAddress);

    const Auth = await new ethers.Contract(userModuleAddress,AuthArtifacts.abi,accounts[0])

    return {hub, hubAddress:deployed_addresses["Hub"],Auth, config: config.networks[network.name]};
}