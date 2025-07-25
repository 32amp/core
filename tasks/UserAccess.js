const userAccessScope = scope("UserAccess", "Tasks for UserAccess module");
const { loadContract } = require("./helpers/load_contract");
const { accountSelection, partnerSelection } = require("./helpers/promt_selection");
const { loadConfig } = require("./helpers/configs");
const { deployProxy } = require("../utils/deploy");
const inquirer = require("inquirer");


userAccessScope
    .task("version", "Get contract version")
    .setAction(async (_, hre) => {
        const { instance: userAccess } = await loadContract("UserAccess", hre);
        const version = await userAccess.getVersion();
        console.log(`UserAccess contract version: ${version}`);
    });

userAccessScope.task("deploy", "Deploy contract")
.setAction(async (args, hre) => {
    const config = await loadConfig("config")
    const signer = await accountSelection(hre);
    const partner_id = await partnerSelection();

    if (typeof config?.deployed?.Hub == "undefined")
        throw new Error("Hub not deployed")

    const deployed = await deployProxy("UserAccess",[partner_id, config.deployed.Hub], [], signer);

    console.log("Module deployed by address", deployed.target)
})

// Task to upgrade of the UserAccess contract
userAccessScope
    .task("upgrade", "Upgrade of the UserAccess contract")
    .setAction(async (taskArgs, hre) => {
        const { instance: userAccess } = await loadContract("UserAccess", hre);

        try {
            const contractFactory = await ethers.getContractFactory("UserAccess")
            const deploy = await upgrades.upgradeProxy(userAccess.target, contractFactory)

            await deploy.waitForDeployment()
            console.log("Success upgrade")
        } catch (error) {
            console.log("Failed upgrade: ", error)
        }

    });

userAccessScope
    .task("set-module-access", "Set access level for account in module")
    .addOptionalParam("account", "Target account address")
    .addOptionalParam("module", "Module name")
    .addOptionalParam("accesslevel", "Access level (0-6)")
    .setAction(async (taskArgs, hre) => {
        const { instance: userAccess } = await loadContract("UserAccess", hre);
        let { account, module, accesslevel } = taskArgs;

        if (!account || !module || !accesslevel) {
            const answers = await inquirer.prompt([
                { type: "input", name: "account", message: "Enter account address:" },
                { type: "input", name: "module", message: "Enter module name:" },
                {
                    type: "list",
                    name: "accesslevel",
                    message: "Select access level:",
                    choices: [
                        { name: "ZERO (No access)", value: 0 },
                        { name: "FIRST (View only)", value: 1 },
                        { name: "SECOND (View+Execute)", value: 2 },
                        { name: "THIRD (View+Execute+Edit)", value: 3 },
                        { name: "FOURTH (View+Edit+Add)", value: 4 },
                        { name: "FIFTH (Full CRUD)", value: 5 },
                        { name: "GOD (Full privileges)", value: 6 },
                    ],
                },
            ]);
            ({ account, module, accesslevel } = answers);
        }

        try {
            const tx = await userAccess.setAccessLevelToModule(
                account,
                module,
                accesslevel
            );
            await tx.wait();
            console.log(`Access level set in transaction: ${tx.hash}`);
        } catch (error) {
            const decodedError = userAccess.interface.parseError(error.data);
            console.log("Decoded error:", decodedError);
        }
    });

userAccessScope
    .task("get-module-access", "Get access level for account in module")
    .addOptionalParam("account", "Target account address")
    .addOptionalParam("module", "Module name")
    .setAction(async (taskArgs, hre) => {
        const { instance: userAccess } = await loadContract("UserAccess", hre);
        let { account, module } = taskArgs;

        if (!account || !module) {
            const answers = await inquirer.prompt([
                { type: "input", name: "account", message: "Enter account address:" },
                { type: "input", name: "module", message: "Enter module name:" },
            ]);
            ({ account, module } = answers);
        }

        const level = await userAccess.getModuleAccessLevel(module, account);
        console.log(`Access level for ${account} in ${module}: ${level}`);
    });

userAccessScope
    .task("set-object-access", "Set access level for account in module object")
    .addOptionalParam("objectid", "Object ID string")
    .addOptionalParam("account", "Target account address")
    .addOptionalParam("module", "Module name")
    .addOptionalParam("accesslevel", "Access level (0-6)")
    .setAction(async (taskArgs, hre) => {
        const { instance: userAccess } = await loadContract("UserAccess", hre);
        let { objectid, account, module, accesslevel } = taskArgs;

        if (!objectid || !account || !module || !accesslevel) {
            const answers = await inquirer.prompt([
                { type: "input", name: "objectid", message: "Enter object ID:" },
                { type: "input", name: "account", message: "Enter account address:" },
                { type: "input", name: "module", message: "Enter module name:" },
                {
                    type: "list",
                    name: "accesslevel",
                    message: "Select access level:",
                    choices: [
                        { name: "ZERO (No access)", value: 0 },
                        { name: "FIRST (View only)", value: 1 },
                        { name: "SECOND (View+Execute)", value: 2 },
                        { name: "THIRD (View+Execute+Edit)", value: 3 },
                        { name: "FOURTH (View+Edit+Add)", value: 4 },
                        { name: "FIFTH (Full CRUD)", value: 5 },
                        { name: "GOD (Full privileges)", value: 6 },
                    ],
                },
            ]);
            ({ objectid, account, module, accesslevel } = answers);
        }

        const objectBytes32 = hre.ethers.encodeBytes32String(objectid);
        
        try {
            const tx = await userAccess.setAccessLevelToModuleObject(
                objectBytes32,
                account,
                module,
                accesslevel
            );
            await tx.wait();
            console.log(`Object access set in transaction: ${tx.hash}`);
        } catch (error) {
            const decodedError = userAccess.interface.parseError(error.data);
            console.log("Decoded error:", decodedError);
        }
    });

userAccessScope
    .task("check-module-access", "Check account access for module")
    .addOptionalParam("account", "Target account address")
    .addOptionalParam("module", "Module name")
    .addOptionalParam("level", "Required access level (0-6)")
    .setAction(async (taskArgs, hre) => {
        const { instance: userAccess } = await loadContract("UserAccess", hre);
        let { account, module, level } = taskArgs;

        if (!account || !module || !level) {
            const answers = await inquirer.prompt([
                { type: "input", name: "account", message: "Enter account address:" },
                { type: "input", name: "module", message: "Enter module name:" },
                {
                    type: "input",
                    name: "level",
                    message: "Enter required access level (0-6):",
                    validate: (input) => parseInt(input) >= 0 && parseInt(input) <= 6,
                },
            ]);
            ({ account, module, level } = answers);
        }

        try {
            await userAccess.checkAccessModule(account, module, level);
            console.log(`Access granted to ${account} for ${module} at level ${level}`);
        } catch (error) {
            const decodedError = userAccess.interface.parseError(error.data);
            console.log(`Error: `, decodedError);
        }
    });

userAccessScope
    .task("my-access", "Get current account's module access levels")
    .setAction(async (_, hre) => {
        const { instance: userAccess, signer } = await loadContract("UserAccess", hre);
        const [modules, levels] = await userAccess.getMyModulesAccess();

        console.log("Access levels for", await signer.getAddress());
        modules.forEach((module, index) => {
            console.log(`- ${module}: ${levels[index]}`);
        });
    });
