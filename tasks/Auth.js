const authScope = scope("Auth", "Tasks for Auth module");
const { upgradeProxy } = require("../utils/deploy")
const { loadContracts } = require("./helpers/load_contract")

authScope.task("authupgrade", "Upgrade Auth contract")
.setAction(async function(){
    const Auth = await upgradeProxy("Auth")
    await Auth.upgrade();
})


authScope.task("setTestUserByEmail", "Add test email for testing auth")
.addParam("email", "Email")
.addParam("code", "Code verification")
.setAction(async (args) =>{
    const {Auth} = await loadContracts()
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
    const {Auth} = await loadContracts()
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
        const {Auth} = await loadContracts()
        console.log("Auth version:",await Auth.getVersion())
    } catch (error) {
        console.log(error)
    }
})
