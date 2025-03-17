const connectorScope = scope("Connector", "Tasks for Connector module");
const { loadContract } = require("./helpers/load_contract");
const { DataTypes } = require("../helpers/Hub");
const inquirer = require("inquirer");

// Helper functions
function mapEnum(type, value) {
    return DataTypes[type][value];
}

function reverseMapEnum(type, value) {
    const entries = Object.entries(DataTypes[type]);
    const found = entries.find(([k, v]) => v === value);
    return found ? found[0] : value;
}

async function promptConnectorParams() {
    return inquirer.prompt([
        {
            type: "list",
            name: "standard",
            message: "Connector type:",
            choices: Object.keys(DataTypes.ConnectorTypes).filter(k => k !== "None"),
        },
        {
            type: "list",
            name: "format",
            message: "Connection format:",
            choices: Object.keys(DataTypes.ConnectorFormat).filter(k => k !== "None"),
        },
        {
            type: "list",
            name: "power_type",
            message: "Power type:",
            choices: Object.keys(DataTypes.PowerType).filter(k => k !== "None"),
        },
        {
            type: "input",
            name: "max_voltage",
            message: "Max voltage (V):",
            validate: v => !isNaN(v) || "Must be a number",
            filter: Number,
        },
        {
            type: "input",
            name: "max_amperage",
            message: "Max amperage (A):",
            validate: v => !isNaN(v) || "Must be a number",
            filter: Number,
        },
        {
            type: "input",
            name: "max_electric_power",
            message: "Max electric power (W):",
            validate: v => !isNaN(v) || "Must be a number",
            filter: Number,
        },
        {
            type: "input",
            name: "terms_and_conditions_url",
            message: "Terms and conditions URL:",
            validate: v => v.startsWith("http") || "Should be valid URL",
        }
    ]);
}


connectorScope.task("version", "Get contract version")
    .setAction(async (_, hre) => {
        const { instance: connector } = await loadContract("Connector",hre);
        const version = await connector.getVersion();
        console.log(`Version: ${version}`);
    });

// Task to upgrade of the Connector contract
connectorScope.task("upgrade", "Upgrade of the Connector contract")
    .setAction(async (taskArgs, hre) => {
        const { instance: connector } = await loadContract("Connector", hre);

        try {
            const contractFactory = await ethers.getContractFactory("Connector")
            const deploy = await upgrades.upgradeProxy(connector.target, contractFactory)

            await deploy.waitForDeployment()
            console.log("Success upgrade")
        } catch (error) {
            console.log("Failed upgrade: ", error)
        }
        
    });

connectorScope.task("add", "Add new connector")
    .addParam("evseid", "EVSE ID to attach connector")
    .setAction(async (taskArgs, hre) => {
        const { instance: connector, partner_id, signer } = await loadContract("Connector",hre);
        const answers = await promptConnectorParams();

        const connectorData = {
            standard: mapEnum("ConnectorTypes", answers.standard),
            format: mapEnum("ConnectorFormat", answers.format),
            power_type: mapEnum("PowerType", answers.power_type),
            max_voltage: answers.max_voltage,
            max_amperage: answers.max_amperage,
            max_electric_power: answers.max_electric_power,
            terms_and_conditions_url: answers.terms_and_conditions_url
        };

        const tx = await connector.add(connectorData, taskArgs.evseid);
        console.log(`Transaction hash: ${tx.hash}`);
        await tx.wait();
        console.log(`Connector added to EVSE ${taskArgs.evseid} by ${signer.address}`);
    });

connectorScope.task("get", "Get connector details")
    .addParam("id", "Connector ID")
    .setAction(async (taskArgs, hre) => {
        const { instance: connector } = await loadContract("Connector",hre);
        const result = await connector.get(taskArgs.id);

        console.log("\nConnector Details:");
        console.log(`- ID: ${result.id}`);
        console.log(`- Last Updated: ${new Date(Number(result.last_updated) * 1000).toISOString()}`);
        console.log(`- Status: ${reverseMapEnum("ConnectorStatus", result.status)}`);

        console.log("\nTechnical Specifications:");
        console.log(`- Type: ${reverseMapEnum("ConnectorTypes", result.connector.standard)}`);
        console.log(`- Format: ${reverseMapEnum("ConnectorFormat", result.connector.format)}`);
        console.log(`- Power Type: ${reverseMapEnum("PowerType", result.connector.power_type)}`);
        console.log(`- Max Voltage: ${result.connector.max_voltage}V`);
        console.log(`- Max Amperage: ${result.connector.max_amperage}A`);
        console.log(`- Max Power: ${result.connector.max_electric_power}W`);
        console.log(`- Terms URL: ${result.connector.terms_and_conditions_url}`);

        console.log("\nAssociated Tariff:");
        if (Number(result.tariff.id) === 0) {
            console.log("- No tariff assigned");
        } else {
            console.log(`- Tariff ID: ${result.tariff.id}`);
        }
    });

connectorScope.task("set-tariffs", "Set connector tariffs")
    .addParam("id", "Connector ID")
    .addParam("tariff", "Tariff ID")
    .setAction(async (taskArgs, hre) => {
        const { instance: connector } = await loadContract("Connector",hre);
        const tx = await connector.setTariffs(taskArgs.id, taskArgs.tariff);
        console.log(`Updating tariffs in tx: ${tx.hash}`);
        const receipt = await tx.wait();
        console.log(`Tariffs updated in block ${receipt.blockNumber}`);
    });

connectorScope.task("exist", "Check connector existence")
    .addParam("id", "Connector ID")
    .setAction(async (taskArgs, hre) => {
        const { instance: connector } = await loadContract("Connector",hre);
        const exists = await connector.exist(taskArgs.id);
        console.log(`Connector ${taskArgs.id} exists: ${exists ? "Yes" : "No"}`);
    });