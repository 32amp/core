const evseScope = scope("EVSE", "Tasks for EVSE module");
const { loadContract } = require("./helpers/load_contract");
const { DataTypes } = require("../helpers/Hub");
const inquirer = require("inquirer");



function getEnumName(enumObj, value) {
    const keys = Object.keys(enumObj).filter(k => isNaN(k));
    return keys.find(k => enumObj[k] === value) || 'Unknown';
}


// Helper function to create enum prompts
function createEnumPrompt(name, message, enumValues) {
    return {
        type: "list",
        name,
        message,
        choices: Object.keys(enumValues)
    };
}


// Helper for array inputs
async function promptForArray(promptFunc, itemName) {
    const items = [];
    while (true) {
        const { addMore } = await inquirer.prompt([{
            type: "confirm",
            name: "addMore",
            message: `Add ${itemName}?`,
            default: items.length === 0
        }]);

        if (!addMore) break;
        items.push(await promptFunc());
    }
    return items;
}

evseScope.task("version", "Get contract version")
    .setAction(async (taskArgs, hre) => {
        const { instance: evse } = await loadContract("EVSE", hre);
        console.log("Version: ", await evse.getVersion());
    });

// Task to upgrade of the EVSE contract
evseScope.task("upgrade", "Upgrade of the EVSE contract")
    .setAction(async (taskArgs, hre) => {
        const { instance: evse } = await loadContract("EVSE", hre);

        try {
            const contractFactory = await ethers.getContractFactory("EVSE")
            const deploy = await upgrades.upgradeProxy(evse.target, contractFactory)

            await deploy.waitForDeployment()
            console.log("Success upgrade")
        } catch (error) {
            console.log("Failed upgrade: ", error)
        }

    });


evseScope.task("exist", "Check if EVSE exists")
    .addParam("id", "EVSE ID")
    .setAction(async ({ id }, hre) => {
        const { instance: evse } = await loadContract("EVSE", hre);
        console.log(`EVSE with id ${id} exist:`, await evse.exist(id));
    });

evseScope.task("add", "Add new EVSE")
    .setAction(async (taskArgs, hre) => {
        const { instance: evse, partner_id, signer } = await loadContract("EVSE", hre);

        const responses = await inquirer.prompt([
            {
                type: "input",
                name: "evse_id",
                message: "EVSE ID:"
            },
            {
                type: "input",
                name: "evse_model",
                message: "EVSE Model ID:",
                validate: input => !isNaN(input)
            },
            {
                type: "input",
                name: "physical_reference",
                message: "Physical Reference:"
            },
            {
                type: "input",
                name: "location_id",
                message: "Location ID:",
                validate: input => !isNaN(input)
            }
        ]);

        const directions = await promptForArray(async () => {
            return inquirer.prompt([
                {
                    type: "input",
                    name: "language",
                    message: "Direction language (BCP-47):"
                },
                {
                    type: "input",
                    name: "text",
                    message: "Direction text:"
                }
            ]);
        }, "direction");

        const evseData = {
            evse_id: responses.evse_id,
            evse_model: parseInt(responses.evse_model),
            physical_reference: hre.ethers.encodeBytes32String(responses.physical_reference),
            directions: directions
        };


        try {
            await evse.add(evseData, Number(responses.location_id));
            console.log(`EVSE added by partner ${partner_id}`);
        } catch (error) {
            const decodedError = evse.interface.parseError(error.data);
            console.log("Decoded error:", decodedError);
        }

    });

evseScope.task("set-meta", "Set EVSE metadata")
    .addParam("evseid", "EVSE ID")
    .setAction(async ({ evseid: evse_id }, hre) => {
        const { instance: evse } = await loadContract("EVSE", hre);

        const statusSchedule = await promptForArray(async () => {
            const response = await inquirer.prompt([
                {
                    type: "input",
                    name: "begin",
                    message: "Schedule begin timestamp:",
                    validate: input => !isNaN(input)
                },
                {
                    type: "input",
                    name: "end",
                    message: "Schedule end timestamp:",
                    validate: input => !isNaN(input)
                },
                createEnumPrompt("status", "Select status:", DataTypes.EVSEStatus)
            ]);

            return {
                begin: response.begin,
                end: response.end,
                status: DataTypes.EVSEStatus[response.status]
            };
        }, "status schedule");

        const capabilities = await inquirer.prompt([{
            type: "checkbox",
            name: "capabilities",
            message: "Select capabilities:",
            choices: Object.keys(DataTypes.Capabilities)
        }]);

        const coordinates = await inquirer.prompt([
            {
                type: "input",
                name: "latitude",
                message: "Latitude:",
                validate: input => !isNaN(input)
            },
            {
                type: "input",
                name: "longitude",
                message: "Longitude:",
                validate: input => !isNaN(input)
            }
        ]);

        const parkingRestrictions = await inquirer.prompt([{
            type: "checkbox",
            name: "parking_restrictions",
            message: "Select parking restrictions:",
            choices: Object.keys(DataTypes.ParkingRestriction)
        }]);

        const floorLevel = await inquirer.prompt([{
            type: "input",
            name: "floor_level",
            message: "Floor level:",
            validate: input => !isNaN(input)
        }]);

        const meta = {
            status_schedule: statusSchedule,
            capabilities: capabilities.capabilities.map(c => DataTypes.Capabilities[c]),
            parking_restrictions: parkingRestrictions.parking_restrictions.map(p => DataTypes.ParkingRestriction[p]),
            coordinates: {
                latitude: ethers.parseEther(coordinates.latitude),
                longitude: ethers.parseEther(coordinates.longitude)
            },
            floor_level: parseInt(floorLevel.floor_level)
        };

        await evse.setMeta(evse_id, meta);
        console.log(`Metadata set for EVSE ${evse_id}`);

        try {
            await evse.setMeta(evse_id, meta);
            console.log(`Metadata set for EVSE ${evse_id}`);
        } catch (error) {
            const decodedError = evse.interface.parseError(error.data);
            console.log("Decoded error:", decodedError);
        }
    });


// Task: add-image
evseScope.task("add-image", "Add image to EVSE")
    .addParam("evseid", "EVSE ID")
    .setAction(async ({ evseid: evse_id }, hre) => {
        const { instance: evse } = await loadContract("EVSE", hre);

        const responses = await inquirer.prompt([
            {
                type: "input",
                name: "url",
                message: "Image URL:"
            },
            {
                type: "input",
                name: "ipfs_cid",
                message: "IPFS CID:"
            },
            createEnumPrompt("category", "Image category:", DataTypes.ImageCategory),
            createEnumPrompt("type", "Image type:", DataTypes.ImageType),
            {
                type: "input",
                name: "width",
                message: "Image width:",
                validate: input => !isNaN(input)
            },
            {
                type: "input",
                name: "height",
                message: "Image height:",
                validate: input => !isNaN(input)
            }
        ]);

        const image = {
            url: responses.url,
            ipfs_cid: responses.ipfs_cid,
            category: DataTypes.ImageCategory[responses.category],
            _type: DataTypes.ImageType[responses.type],
            width: parseInt(responses.width),
            height: parseInt(responses.height)
        };


        try {
            await evse.addImage(evse_id, image);
            console.log(`Image added to EVSE ${evse_id}`);
        } catch (error) {
            const decodedError = evse.interface.parseError(error.data);
            console.log("Decoded error:", decodedError);
        }
    });

// Task: remove-image
evseScope.task("remove-image", "Remove image from EVSE")
    .addParam("evseid", "EVSE ID")
    .addParam("imageid", "Image ID")
    .setAction(async ({ evseid: evse_id, imageid: image_id }, hre) => {
        const { instance: evse } = await loadContract("EVSE", hre);

        try {
            await evse.removeImage(evse_id, image_id);
            console.log(`Image ${image_id} removed from EVSE ${evse_id}`);
        } catch (error) {
            const decodedError = evse.interface.parseError(error.data);
            console.log("Decoded error:", decodedError);
        }
    });

// Task: set-status
evseScope.task("set-status", "Set EVSE status")
    .addParam("evseid", "EVSE ID")
    .setAction(async ({ evseid: evse_id }, hre) => {
        const { instance: evse } = await loadContract("EVSE", hre);

        const { status } = await inquirer.prompt(
            createEnumPrompt("status", "Select new status:", DataTypes.EVSEStatus)
        );

        
        try {
            await evse.setStatus(evse_id, DataTypes.EVSEStatus[status]);
            console.log(`Status updated for EVSE ${evse_id}`);
        } catch (error) {
            const decodedError = evse.interface.parseError(error.data);
            console.log("Decoded error:", decodedError);
        }
        
    });

// Task: add-connector
evseScope.task("add-connector", "Add connector to EVSE")
    .addParam("evseid", "EVSE ID")
    .addParam("connectorid", "Connector ID")
    .setAction(async ({ evseid: evse_id, connectorid: connector_id }, hre) => {
        const { instance: evse } = await loadContract("EVSE", hre);

        try {
            await evse.addConnector(evse_id, connector_id);
            console.log(`Connector ${connector_id} added to EVSE ${evse_id}`);
        } catch (error) {
            const decodedError = evse.interface.parseError(error.data);
            console.log("Decoded error:", decodedError);
        }
    });

// Task: remove-connector
evseScope.task("remove-connector", "Remove connector from EVSE")
    .addParam("evseid", "EVSE ID")
    .addParam("connectorid", "Connector ID")
    .setAction(async ({ evseid: evse_id, connectorid: connector_id }, hre) => {
        const { instance: evse } = await loadContract("EVSE", hre);

        try {
            await evse.removeConnector(evse_id, connector_id);
            console.log(`Connector ${connector_id} removed from EVSE ${evse_id}`);
        } catch (error) {
            const decodedError = evse.interface.parseError(error.data);
            console.log("Decoded error:", decodedError);
        }
    });

// Updated get task with human-readable output
evseScope.task("get", "Get EVSE details")
    .addParam("id", "EVSE ID")
    .setAction(async ({ id }, hre) => {
        const { instance: evse } = await loadContract("EVSE", hre);
        const details = await evse.get(id);

        const formatEVSE = (data) => ({
            "EVSE ID": data.evse.evse_id,
            "Model ID": data.evse.evse_model.toString(),
            "Physical Reference": hre.ethers.decodeBytes32String(data.evse.physical_reference),
            "Directions": data.evse.directions.map(d => `${d.language}: ${d.text}`),
            "Status": getEnumName(DataTypes.EVSEStatus, data.evses_status),
            "Location ID": data.location_id.toString(),
            "Last Updated": new Date(Number(data.last_updated) * 1000).toISOString(),
            "Metadata": {
                "Capabilities": data.meta.capabilities.map(c =>
                    getEnumName(DataTypes.Capabilities, c)),
                "Parking Restrictions": data.meta.parking_restrictions.map(p =>
                    getEnumName(DataTypes.ParkingRestriction, p)),
                "Coordinates": `Lat: ${ethers.formatEther(data.meta.coordinates.latitude)}, Lon: ${ethers.formatEther(data.meta.coordinates.longitude)}`,
                "Floor Level": data.meta.floor_level.toString()
            },
            "Images": data.images.map(img => ({
                "Type": getEnumName(DataTypes.ImageType, img._type),
                "Category": getEnumName(DataTypes.ImageCategory, img.category),
                "URL": img.url,
                "IPFS": img.ipfs_cid,
                "Dimensions": `${img.width}x${img.height}`
            })),
            "Connectors": data.connectors.map(con => ({
                "ID": con.id.toString(),
                "Status": getEnumName(DataTypes.ConnectorStatus, con.status),
                "Last Updated": new Date(Number(con.last_updated) * 1000).toISOString(),
                "Tariff ID": con.tariff?.id?.toString() || 'N/A'
            }))
        });

        const formatted = formatEVSE(details);
        console.log("EVSE Details:");
        console.dir(formatted, { depth: null, colors: true });
        return formatted;
    });