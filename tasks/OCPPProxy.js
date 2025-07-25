const emulatorScope = scope("OCPPProxy", "Tasks for OCPP proxy module");
const { accountSelection, partnerSelection } = require("./helpers/promt_selection");
const { loadConfig } = require("./helpers/configs");
const { deployProxy } = require("../utils/deploy");

emulatorScope.task("deploy", "Deploy contract")
.setAction(async (args, hre) => {
    const config = await loadConfig("config")
    const signer = await accountSelection(hre);
    const partner_id = await partnerSelection();

    if (typeof config?.deployed?.Hub == "undefined")
        throw new Error("Hub not deployed")

    const deployed = await deployProxy("OCPPProxy",[partner_id, config.deployed.Hub], [], signer);

    console.log("Module deployed by address", deployed.target)
})