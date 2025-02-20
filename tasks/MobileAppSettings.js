const MobileAppSettingsScope = scope("MobileAppSettings", "Tasks for MobileAppSettings module");
const { upgradeProxy} = require("../utils/deploy")
const { loadContracts} = require("./helpers/load_contract")
const { authByPassword} = require("./helpers/auth")

MobileAppSettingsScope.task("upgrade", "Upgrade MobileAppSettings contract")
.setAction(async function(){
    const User = await upgradeProxy("MobileAppSettings")
    await User.upgrade();
})

MobileAppSettingsScope.task("version", "Version module")
.setAction(async () => {
    try {
        const {MobileAppSettings} = await loadContracts()
        console.log("MobileAppSettings version:",await MobileAppSettings.getVersion())
    } catch (error) {
        console.log(error)
    }
})

MobileAppSettingsScope.task("setConfig", "Set config from hub.config.js")
.addParam("user")
.addParam("password")
.setAction(async (args) => {
    const {MobileAppSettings} = await loadContracts(["MobileAppSettings"])
    const token = await authByPassword(args.user,args.password)

    try {
        var {config} = require(__dirname+"/../hub.config");
    
    } catch (error) {
        console.log("Error open config hub.config.json", error)
        return;
    }
    
    try {
        let tx = await MobileAppSettings.setConfig(token,config.MobileAppSettings)
        await tx.wait();
        console.log("Success")
    } catch (error) {
        console.error(error)
    }
})


