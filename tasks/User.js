const userScope = scope("User", "Tasks for User module");
const { upgradeProxy } = require("../utils/deploy")
const { loadContracts } = require("./helpers/load_contract")

userScope.task("userupgrade", "Upgrade User contract")
.setAction(async function(){
    const User = await upgradeProxy("User")
    await User.upgrade();
})

userScope.task("version", "Version module")
.setAction(async () => {
    try {
        const {User} = await loadContracts()
        console.log("User version:",await User.getVersion())
    } catch (error) {
        console.log(error)
    }
})