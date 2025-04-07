const userGroupsScope = scope("UserGroups", "Tasks for UserGroups module");
const { getEventArguments } = require("../utils/utils");
const { loadContract } = require("./helpers/load_contract");
const inquirer = require("inquirer");


// Task to get the version of the UserGroups contract
userGroupsScope.task("version", "Get the version of the UserGroups contract")
    .setAction(async (taskArgs, hre) => {
        const { instance } = await loadContract("UserGroups", hre);
        const version = await instance.getVersion();
        console.log(`UserGroups contract version: ${version}`);
    });

// Task to upgrade of the UserGroups contract
userGroupsScope
    .task("upgrade", "Upgrade of the UserGroups contract")
    .setAction(async (taskArgs, hre) => {
        const { instance } = await loadContract("UserGroups", hre);

        try {
            const contractFactory = await ethers.getContractFactory("UserGroups")
            const deploy = await upgrades.upgradeProxy(instance.target, contractFactory)

            await deploy.waitForDeployment()
            console.log("Success upgrade")
        } catch (error) {
            console.log("Failed upgrade: ", error)
        }

    });

// Task to add a new group
userGroupsScope.task("add-group", "Add a new group to the UserGroups contract")
    .setAction(async (taskArgs, hre) => {
        const { instance } = await loadContract("UserGroups", hre);

        const answers = await inquirer.prompt([
            {
                type: "input",
                name: "name",
                message: "Enter the name of the group:",
                validate: (input) => input.length > 0 ? true : "Group name cannot be empty"
            }
        ]);

        try {
            const tx = await instance.addGroup(answers.name);
            console.log(`Transaction hash: ${tx.hash}`);

            const eventArgs = await getEventArguments(tx, "GroupAdded", 1);
            if (eventArgs) {
                console.log(`Group added with ID: ${eventArgs.id}, Name: ${eventArgs.name}`);
            } else {
                console.log("Group added, but no event was emitted.");
            }
        } catch (error) {
            const decodedError = instance.interface.parseError(error.data);
            console.log(`Access denied: `, decodedError);
        }
    });

// Task to get all groups owned by the caller
userGroupsScope.task("get-my-groups", "Get all groups owned by the caller")
    .setAction(async (taskArgs, hre) => {
        const { instance } = await loadContract("UserGroups", hre);
        const groups = await instance.getMyGroups();

        if (groups.length === 0) {
            console.log("No groups found.");
        } else {
            console.log("Your groups:");
            groups.forEach((group) => {
                console.log(`ID: ${group.id}, Name: ${group.name}, Owner: ${group.owner}, Deleted: ${group.deleted}`);
            });
        }
    });
