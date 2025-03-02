const connectorScope = scope("Connector", "Tasks for Connector module");
const { loadConfig } = require("./helpers/configs")
const { accountSelection, partnerSelection } = require("./helpers/promt_selection");
const { DataTypes } = require("../helpers/Hub");
const inquirer = require("inquirer");


// Helper function to initialize the Connector contract
async function getConnectorContract(hre) {
    const config = await loadConfig("config");
    if (typeof config?.deployed?.Hub === "undefined") {
        throw new Error("Hub not deployed");
    }
    const signer = await accountSelection(hre);
    const hub = await hre.ethers.getContractAt("Hub", config.deployed.Hub, signer);
    const partner_id = await partnerSelection();
    const exist = await hub.getModule("Connector", partner_id);
    if (exist === hre.ethers.ZeroAddress) {
        throw new Error(`Module Connector does not exist for partner_id ${partner_id}`);
    }
    const connector = await hre.ethers.getContractAt("Connector", exist, signer);
    return { connector, partner_id, signer };
}


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
        const { connector } = await getConnectorContract(hre);
        const version = await connector.getVersion();
        console.log(`Version: ${version}`);
    });

connectorScope.task("add", "Add new connector")
    .addParam("evseid", "EVSE ID to attach connector")
    .setAction(async (taskArgs, hre) => {
        const { connector, partner_id, signer } = await getConnectorContract(hre);
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
        const { connector } = await getConnectorContract(hre);
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
        const { connector } = await getConnectorContract(hre);
        const tx = await connector.setTariffs(taskArgs.id, taskArgs.tariff);
        console.log(`Updating tariffs in tx: ${tx.hash}`);
        const receipt = await tx.wait();
        console.log(`Tariffs updated in block ${receipt.blockNumber}`);
    });

connectorScope.task("exist", "Check connector existence")
    .addParam("id", "Connector ID")
    .setAction(async (taskArgs, hre) => {
        const { connector } = await getConnectorContract(hre);
        const exists = await connector.exist(taskArgs.id);
        console.log(`Connector ${taskArgs.id} exists: ${exists ? "Yes" : "No"}`);
    });