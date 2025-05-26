const { loadConfig, saveConfig } = require("./helpers/configs")
const OCPPSwarmScope = scope("OCPPSwarm", "OCPPSwarm service HUB");
const { accountSelection} = require("./helpers/promt_selection");
const inquirer = require("inquirer");
const fs = require('fs/promises');

OCPPSwarmScope.task("deploy", "Deploys a Currencies contract")
    .setAction(async (taskArgs, hre) => {

        var config;

        try {
            config = await loadConfig("config")

        } catch (error) {
            config = {};
        }

        if (typeof config?.deployed?.OCPPSwarm != "undefined")
            throw new Error("Currencies already deployed")



        const questions = [
            {
                type: "input",
                name: "path_psk",
                message: "Enter path to psk key:"
            }, {
                type: "input",
                name: "deposit_amount",
                message: "Enter deposit amount in ether"
            }
        ];

        const answers = await inquirer.prompt(questions);

        const psk = await fs.readFile(answers.path_psk);

        const factory = await hre.ethers.getContractFactory("OCPPSwarm");
        const deploy = await hre.upgrades.deployProxy(factory, [psk, ethers.parseEther(answers.deposit_amount)], { initializer: "initialize" });
        const deployed = await deploy.waitForDeployment();

        if (typeof config?.deployed == "undefined")
            config.deployed = {}

        config.deployed.OCPPSwarm = deployed.target;

        await saveConfig("config", config)

        console.log("The OCPPSwarm contract is deployed at:", deployed.target);
        return deployed.target;
    });

// Task to upgrade of the OCPPSwarm contract
OCPPSwarmScope.task("upgrade", "Upgrade of the OCPPSwarm contract")
    .setAction(async (taskArgs, hre) => {
        // Load the configuration to get the deployed contract address
        const config = await loadConfig("config");
        const address = config.deployed.OCPPSwarm;

        if (!address) {
            throw new Error("Currencies contract not deployed");
        }


        try {
            const contractFactory = await ethers.getContractFactory("OCPPSwarm")
            const deploy = await upgrades.upgradeProxy(address, contractFactory)

            const tx = await deploy.waitForDeployment()
            console.log("Success upgrade", tx)
        } catch (error) {
            console.log("Failed upgrade: ", error)
        }

    });


OCPPSwarmScope.task("get-psk", "Show psk key")
    .setAction(async (taskArgs, hre) => {
        // Load the configuration to get the deployed contract address
        const config = await loadConfig("config");
        const address = config.deployed.OCPPSwarm;
        const signer = await accountSelection(hre);

        if (!address) {
            throw new Error("Currencies contract not deployed");
        }

        const contract = await hre.ethers.getContractAt("OCPPSwarm", address, signer)

        try {

            const key = await contract.getPSK()    

            console.log("PSK key:", key)

        } catch (error) {
            console.log("Failed upgrade: ", error)
        }

    });


OCPPSwarmScope.task("get-active-nodes", "Show active nodes")
.setAction(async (args, hre) => {
    const config = await loadConfig("config");
    const address = config.deployed.OCPPSwarm;
    const signer = await accountSelection(hre);

    if (!address) {
        throw new Error("Currencies contract not deployed");
    }

    const contract = await hre.ethers.getContractAt("OCPPSwarm", address, signer)


    const nodes = await contract.getActiveNodes(1)

    console.log(nodes)
})