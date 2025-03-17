const {deployProxy} = require("../../utils/deploy")
const {getEventArguments} = require("../../utils/utils");

module.exports.deploy = async function(modules, showlog = false) {
    const retmodules = {};
    const accounts = await ethers.getSigners();
    const balance = await ethers.provider.getBalance(accounts[0].address);

    if (showlog) {
        console.log("Balance:", ethers.formatEther(balance), "ETH");
        console.log("Deploying Contracts...");
    }

    const Currencies = await deployProxy("Currencies", []);
    retmodules.Hub = await deployProxy("Hub", [[{
        name: "Currencies",
        contract_address: Currencies.target
    }]]);

    if (showlog) console.log("Hub deployed to:", retmodules.Hub.target);

    const tx = await retmodules.Hub.registerPartner(
        ethers.encodeBytes32String("PortalEnergy"),
        ethers.toUtf8Bytes("RU"),
        ethers.toUtf8Bytes("POE"), {
            value: ethers.parseEther("2")
        }
    );

    const partner = await getEventArguments(tx, "AddPartner");

    
    const deployModule = async (moduleName, additionalArgs = []) => {
        if (typeof modules?.[moduleName] !== "undefined") {
            retmodules[moduleName] = await deployProxy(moduleName, [partner.id, retmodules.Hub.target, ...additionalArgs]);
            const tx = await retmodules.Hub.addModule(moduleName, retmodules[moduleName].target);
            await tx.wait();
            if (showlog) console.log(`${moduleName} deployed to:`, retmodules[moduleName].target);
        }
    };

    
    await deployModule("MobileApp");
    await deployModule("User");
    await deployModule("UserGroups");
    await deployModule("Tariff");
    await deployModule("Location");
    await deployModule("LocationSearch");
    await deployModule("EVSE");
    await deployModule("Connector");
    await deployModule("UserSupportChat");
    await deployModule("MobileAppSettings");
    await deployModule("Balance", [1]);
    await deployModule("Cards");

    retmodules.UserAccess = await deployProxy("UserAccess", [partner.id, retmodules.Hub.target]);
    const tx11 = await retmodules.Hub.addModule("UserAccess", retmodules.UserAccess.target);
    await tx11.wait();

    if (retmodules?.Connector?.target) {
        await retmodules.UserAccess.setAccessLevelToModule(retmodules.Connector.target, "EVSE", 6);
    }

    if (retmodules?.EVSE?.target) {
        await retmodules.UserAccess.setAccessLevelToModule(retmodules.EVSE.target, "Location", 6);
    }

    if (showlog) console.log("UserAccess deployed to:", retmodules.UserAccess.target);

    return retmodules;
};