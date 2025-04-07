const locationScope = scope("Location", "Tasks for Location module");
const { loadContract } = require("./helpers/load_contract");
const inquirer = require("inquirer");
const { getEventArguments, hex2string } = require("../utils/utils");


locationScope.task("version", "Get the version of the Location contract")
    .setAction(async (taskArgs, hre) => {
        const { instance: location } = await loadContract("Location", hre);
        const version = await location.getVersion();
        console.log(`Version: ${version}`);
    });

// Task to upgrade of the Location contract
locationScope.task("upgrade", "Upgrade of the Location contract")
    .setAction(async (taskArgs, hre) => {
        const { instance: location } = await loadContract("Location", hre);

        try {
            const contractFactory = await ethers.getContractFactory("Location")
            const deploy = await upgrades.upgradeProxy(location.target, contractFactory)

            await deploy.waitForDeployment()
            console.log("Success upgrade")
        } catch (error) {
            console.log("Failed upgrade: ", error)
        }

    });


locationScope.task("add-location", "Add a new location")
    .setAction(async (taskArgs, hre) => {
        const { instance: location } = await loadContract("Location", hre);

        // Enum choices
        const parkingTypeChoices = [
            { name: "None", value: 0 },
            { name: "AlongMotorway", value: 1 },
            { name: "ParkingGarage", value: 2 },
            { name: "ParkingLot", value: 3 },
            { name: "OnDriveway", value: 4 },
            { name: "OnStreet", value: 5 },
            { name: "UndergroundGarage", value: 6 }
        ];
        const facilityChoices = [
            { name: "None", value: 0 },
            { name: "Hotel", value: 1 },
            { name: "Restaurant", value: 2 },
            { name: "Cafe", value: 3 },
            { name: "Mall", value: 4 },
            { name: "Supermarket", value: 5 },
            { name: "Sport", value: 6 },
            { name: "RecreationArea", value: 7 },
            { name: "Nature", value: 8 },
            { name: "Museum", value: 9 },
            { name: "BikeSharing", value: 10 },
            { name: "BusStop", value: 11 },
            { name: "TaxiStand", value: 12 },
            { name: "TramStop", value: 13 },
            { name: "MetroStation", value: 14 },
            { name: "TrainStation", value: 15 },
            { name: "Airport", value: 16 },
            { name: "ParkingLot", value: 17 },
            { name: "CarpoolParking", value: 18 },
            { name: "FuelStation", value: 19 },
            { name: "Wifi", value: 20 }
        ];

        // Prompt user
        const questions = [
            { type: "input", name: "name", message: "Enter location name:" },
            { type: "input", name: "_address", message: "Enter address:" },
            { type: "input", name: "city", message: "Enter city (max 32 bytes):" },
            { type: "input", name: "postal_code", message: "Enter postal code (max 32 bytes):" },
            { type: "input", name: "state", message: "Enter state (max 32 bytes):" },
            { type: "input", name: "country", message: "Enter country (max 32 bytes):" },
            { type: "input", name: "latitude", message: "Enter latitude (e.g., '41.40338'):" },
            { type: "input", name: "longitude", message: "Enter longitude (e.g., '2.17403'):" },
            { type: "list", name: "parking_type", message: "Select parking type:", choices: parkingTypeChoices },
            { type: "checkbox", name: "facilities", message: "Select facilities:", choices: facilityChoices },
            { type: "input", name: "time_zone", message: "Enter time zone (e.g., 'Europe/Berlin'):" },
            { type: "confirm", name: "charging_when_closed", message: "Charging when closed?" },
            { type: "confirm", name: "publish", message: "Publish location?" }
        ];

        const answers = await inquirer.prompt(questions);

        // Convert strings to bytes32
        const city = ethers.encodeBytes32String(answers.city);
        const postal_code = ethers.encodeBytes32String(answers.postal_code);
        const state = ethers.encodeBytes32String(answers.state);
        const country = ethers.encodeBytes32String(answers.country);

        // Construct Add struct
        const add = {
            name: answers.name,
            _address: answers._address,
            city,
            postal_code,
            state,
            country,
            coordinates: { latitude: answers.latitude, longitude: answers.longitude },
            parking_type: answers.parking_type,
            facilities: answers.facilities,
            time_zone: answers.time_zone,
            charging_when_closed: answers.charging_when_closed,
            publish: answers.publish
        };

        try {
            const tx = await location.addLocation(add);
            const { uid } = await getEventArguments(tx, "AddLocation")
            console.log(`Location added with id ${uid}. Transaction hash: ${tx.hash}`);
        } catch (error) {
            const decodedError = location.interface.parseError(error.data);
            console.log("Decoded error:", decodedError);
        }

    });


locationScope.task("get-location", "Get location details")
    .addParam("id", "Location ID")
    .setAction(async (taskArgs, hre) => {
        const { instance: location } = await loadContract("Location", hre);
        const outLocation = await location.getLocation(taskArgs.id);
        const loc = outLocation.location;

        // Enum mappings
        const parkingTypeNames = ["None", "AlongMotorway", "ParkingGarage", "ParkingLot", "OnDriveway", "OnStreet", "UndergroundGarage"];
        const facilityNames = ["None", "Hotel", "Restaurant", "Cafe", "Mall", "Supermarket", "Sport", "RecreationArea", "Nature", "Museum", "BikeSharing", "BusStop", "TaxiStand", "TramStop", "MetroStation", "TrainStation", "Airport", "ParkingLot", "CarpoolParking", "FuelStation", "Wifi"];

        console.log("Location Details:");
        console.log(`  UID: ${loc.uid}`);
        console.log(`  Country Code: ${hex2string(loc.country_code)}`);
        console.log(`  Party ID: ${hex2string(loc.party_id)}`);
        console.log(`  Publish: ${loc.publish}`);
        console.log(`  Publish Allowed To: ${loc.publish_allowed_to.join(", ")}`);
        console.log(`  Name: ${loc.name}`);
        console.log(`  Address: ${loc._address}`);
        console.log(`  City: ${hex2string(loc.city)}`);
        console.log(`  Postal Code: ${hex2string(loc.postal_code)}`);
        console.log(`  State: ${hex2string(loc.state)}`);
        console.log(`  Country: ${hex2string(loc.country)}`);
        console.log(`  Coordinates: ${Number(loc.coordinates.latitude) / 1e7}, ${Number(loc.coordinates.longitude) / 1e7}`);
        console.log(`  Parking Type: ${parkingTypeNames[loc.parking_type]}`);
        console.log(`  Facilities: ${loc.facilities.map(f => facilityNames[f]).join(", ")}`);
        console.log(`  Time Zone: ${loc.time_zone}`);
        console.log(`  Charging When Closed: ${loc.charging_when_closed}`);
        console.log(`  Last Updated: ${loc.last_updated}`);

        console.log("\nRelated Locations:");
        outLocation.related_locations.forEach((rl, i) => {
            console.log(`  ${i + 1}: ${Number(rl.latitude) / 1e7}, ${Number(rl.longitude) / 1e7} - Names: ${rl.name.map(n => `${n.language}: ${n.text}`).join("; ")}`);
        });

        console.log("\nImages:");
        outLocation.images.forEach((img, i) => {
            console.log(`  ${i + 1}: ${img.url} (Category: ${img.category}, Type: ${img._type})`);
        });

        console.log("\nOpening Times:");
        console.log(`  24/7: ${outLocation.opening_times.twentyfourseven}`);
        outLocation.opening_times.regular_hours.forEach((h, i) => {
            console.log(`  Regular ${i + 1}: Day ${h.week_day}, ${h.period_begin} - ${h.period_end}`);
        });

        console.log("\nDirections:");
        outLocation.directions.forEach((d, i) => {
            console.log(`  ${i + 1}: ${d.language} - ${d.text}`);
        });

        console.log("\nEVSEs:");
        outLocation.evses.forEach((e, i) => {
            console.log(`  ${i + 1}: [EVSE Data]`); // Placeholder, as outEVSE struct is not fully specified
        });
    });

locationScope.task("exist", "Check if location exists")
    .addParam("id", "Location ID")
    .setAction(async (taskArgs, hre) => {
        const { instance: location } = await loadContract("Location", hre);
        const exists = await location.exist(taskArgs.id);
        console.log(`Location ${taskArgs.id} exists: ${exists}`);
    });

locationScope.task("add-related-location", "Add a related location")
    .addParam("locationid", "Location ID")
    .setAction(async (taskArgs, hre) => {
        const { instance: location } = await loadContract("Location", hre);

        const questions = [
            { type: "input", name: "latitude", message: "Enter latitude (decimal degrees):", validate: v => !isNaN(parseFloat(v)) || "Must be a number" },
            { type: "input", name: "longitude", message: "Enter longitude (decimal degrees):", validate: v => !isNaN(parseFloat(v)) || "Must be a number" },
            { type: "input", name: "numNames", message: "How many names to add?", validate: v => /^\d+$/.test(v) || "Must be a non-negative integer" }
        ];

        const answers = await inquirer.prompt(questions);
        const latitude = hre.ethers.toBigInt(Math.floor(parseFloat(answers.latitude) * 1e7));
        const longitude = hre.ethers.toBigInt(Math.floor(parseFloat(answers.longitude) * 1e7));

        const names = [];
        for (let i = 0; i < parseInt(answers.numNames); i++) {
            const nameAnswers = await inquirer.prompt([
                { type: "input", name: "language", message: `Name ${i + 1} language:` },
                { type: "input", name: "text", message: `Name ${i + 1} text:` }
            ]);
            names.push({ language: nameAnswers.language, text: nameAnswers.text });
        }

        try {
            const add = { latitude, longitude: longitude, name: names };
            const tx = await location.addRelatedLocation(taskArgs.locationid, add);
            await tx.wait();
            console.log(`Related location added. Transaction hash: ${tx.hash}`);
        } catch (error) {
            const decodedError = location.interface.parseError(error.data);
            console.log("Decoded error:", decodedError);
        }

    });


locationScope.task("remove-related-location", "Remove a related location")
    .addParam("locationid", "Location ID")
    .addParam("relatedlocid", "Related location ID")
    .setAction(async (taskArgs, hre) => {
        const { instance: location } = await loadContract("Location", hre);

        try {
            const tx = await location.removeRelatedLocation(taskArgs.locationid, taskArgs.relatedlocid);
            await tx.wait();
            console.log(`Related location removed. Transaction hash: ${tx.hash}`);
        } catch (error) {
            const decodedError = location.interface.parseError(error.data);
            console.log("Decoded error:", decodedError);
        }
    });

locationScope.task("add-image", "Add an image to a location")
    .addParam("locationid", "Location ID")
    .setAction(async (taskArgs, hre) => {
        const { instance: location } = await loadContract("Location", hre);

        const imageCategoryChoices = [
            { name: "None", value: 0 },
            { name: "Charger", value: 1 },
            { name: "Entrance", value: 2 },
            { name: "Location", value: 3 },
            { name: "Network", value: 4 },
            { name: "Operator", value: 5 },
            { name: "Other", value: 6 },
            { name: "Owner", value: 7 }
        ];
        const imageTypeChoices = [
            { name: "None", value: 0 },
            { name: "JPG", value: 1 },
            { name: "PNG", value: 2 },
            { name: "GIF", value: 3 },
            { name: "SVG", value: 4 }
        ];

        const questions = [
            { type: "input", name: "url", message: "Enter image URL:" },
            { type: "input", name: "ipfs_cid", message: "Enter IPFS CID:" },
            { type: "list", name: "category", message: "Select image category:", choices: imageCategoryChoices },
            { type: "list", name: "_type", message: "Select image type:", choices: imageTypeChoices },
            { type: "input", name: "width", message: "Enter width:", validate: v => /^\d+$/.test(v) || "Must be an integer" },
            { type: "input", name: "height", message: "Enter height:", validate: v => /^\d+$/.test(v) || "Must be an integer" }
        ];

        const answers = await inquirer.prompt(questions);
        const add = {
            url: answers.url,
            ipfs_cid: answers.ipfs_cid,
            category: answers.category,
            _type: answers._type,
            width: parseInt(answers.width),
            height: parseInt(answers.height)
        };

        try {
            const tx = await location.addImage(taskArgs.locationid, add);
            await tx.wait();
            console.log(`Image added. Transaction hash: ${tx.hash}`);
        } catch (error) {
            const decodedError = location.interface.parseError(error.data);
            console.log("Decoded error:", decodedError);
        }
    });

locationScope.task("remove-image", "Remove an image from a location")
    .addParam("locationid", "Location ID")
    .addParam("imageid", "Image ID")
    .setAction(async (taskArgs, hre) => {
        const { instance: location } = await loadContract("Location", hre);

        try {
            const tx = await location.removeImage(taskArgs.locationid, taskArgs.imageid);
            await tx.wait();
            console.log(`Image removed. Transaction hash: ${tx.hash}`);
        } catch (error) {
            const decodedError = location.interface.parseError(error.data);
            console.log("Decoded error:", decodedError);
        }
    });

locationScope.task("add-direction", "Add a direction to a location")
    .addParam("locationid", "Location ID")
    .setAction(async (taskArgs, hre) => {
        const { instance: location } = await loadContract("Location", hre);

        const questions = [
            { type: "input", name: "language", message: "Enter language (e.g., 'en-US'):" },
            { type: "input", name: "text", message: "Enter direction text:" }
        ];


        const answers = await inquirer.prompt(questions);
        const add = { language: answers.language, text: answers.text };

        try {
            const tx = await location.addDirection(taskArgs.locationid, add);
            await tx.wait();
            console.log(`Direction added. Transaction hash: ${tx.hash}`);
        } catch (error) {
            const decodedError = location.interface.parseError(error.data);
            console.log("Decoded error:", decodedError);
        }
    });

locationScope.task("remove-direction", "Remove a direction from a location")
    .addParam("locationid", "Location ID")
    .addParam("directionid", "Direction ID")
    .setAction(async (taskArgs, hre) => {
        const { instance: location } = await loadContract("Location", hre);

        try {
            const tx = await location.removeDirection(taskArgs.locationid, taskArgs.directionid);
            await tx.wait();
            console.log(`Direction removed. Transaction hash: ${tx.hash}`);
        } catch (error) {
            const decodedError = location.interface.parseError(error.data);
            console.log("Decoded error:", decodedError);
        }
    });

locationScope.task("set-opening-times", "Set opening times for a location")
    .addParam("locationid", "Location ID")
    .setAction(async (taskArgs, hre) => {
        const { instance: location } = await loadContract("Location", hre);

        const initialQuestions = [
            { type: "confirm", name: "twentyfourseven", message: "Open 24/7?" }
        ];
        const initialAnswers = await inquirer.prompt(initialQuestions);

        let regular_hours = [];
        let exceptional_openings = [];
        let exceptional_closings = [];

        if (!initialAnswers.twentyfourseven) {
            const counts = await inquirer.prompt([
                { type: "input", name: "numRegular", message: "Number of regular hours?", validate: v => /^\d+$/.test(v) || "Must be an integer" },
                { type: "input", name: "numOpenings", message: "Number of exceptional openings?", validate: v => /^\d+$/.test(v) || "Must be an integer" },
                { type: "input", name: "numClosings", message: "Number of exceptional closings?", validate: v => /^\d+$/.test(v) || "Must be an integer" }
            ]);

            for (let i = 0; i < parseInt(counts.numRegular); i++) {
                const rh = await inquirer.prompt([
                    { type: "input", name: "week_day", message: `Regular ${i + 1} weekday (0-6):`, validate: v => /^[0-6]$/.test(v) || "0-6 only" },
                    { type: "input", name: "period_begin", message: `Regular ${i + 1} begin (HH:MM):` },
                    { type: "input", name: "period_end", message: `Regular ${i + 1} end (HH:MM):` }
                ]);
                regular_hours.push({ week_day: parseInt(rh.week_day), period_begin: rh.period_begin, period_end: rh.period_end });
            }

            for (let i = 0; i < parseInt(counts.numOpenings); i++) {
                const eo = await inquirer.prompt([
                    { type: "input", name: "begin", message: `Opening ${i + 1} begin (timestamp):`, validate: v => /^\d+$/.test(v) || "Must be an integer" },
                    { type: "input", name: "end", message: `Opening ${i + 1} end (timestamp):`, validate: v => /^\d+$/.test(v) || "Must be an integer" }
                ]);
                exceptional_openings.push({ begin: parseInt(eo.begin), end: parseInt(eo.end) });
            }

            for (let i = 0; i < parseInt(counts.numClosings); i++) {
                const ec = await inquirer.prompt([
                    { type: "input", name: "begin", message: `Closing ${i + 1} begin (timestamp):`, validate: v => /^\d+$/.test(v) || "Must be an integer" },
                    { type: "input", name: "end", message: `Closing ${i + 1} end (timestamp):`, validate: v => /^\d+$/.test(v) || "Must be an integer" }
                ]);
                exceptional_closings.push({ begin: parseInt(ec.begin), end: parseInt(ec.end) });
            }
        }

        const add = {
            twentyfourseven: initialAnswers.twentyfourseven,
            regular_hours,
            exceptional_openings,
            exceptional_closings
        };

        try {
            const tx = await location.setOpeningTimes(taskArgs.locationid, add);
            await tx.wait();
            console.log(`Opening times set. Transaction hash: ${tx.hash}`);
        } catch (error) {
            const decodedError = location.interface.parseError(error.data);
            console.log("Decoded error:", decodedError);
        }
    });


locationScope.task("add-evse", "Add an EVSE to a location")
    .addParam("locationid", "Location ID")
    .addParam("evseid", "EVSE ID")
    .setAction(async (taskArgs, hre) => {
        const { instance: location } = await loadContract("Location", hre);

        try {
            const tx = await location.addEVSE(taskArgs.locationid, taskArgs.evseid);
            await tx.wait();
            console.log(`EVSE added. Transaction hash: ${tx.hash}`);
        } catch (error) {
            const decodedError = location.interface.parseError(error.data);
            console.log("Decoded error:", decodedError);
        }
    });


locationScope.task("remove-evse", "Remove an EVSE from a location")
    .addParam("locationid", "Location ID")
    .addParam("evseid", "EVSE ID")
    .setAction(async (taskArgs, hre) => {
        const { instance: location } = await loadContract("Location", hre);
        
        try {
            const tx = await location.removeEVSE(taskArgs.locationid, taskArgs.evseid);
            await tx.wait();
            console.log(`EVSE removed. Transaction hash: ${tx.hash}`);
        } catch (error) {
            const decodedError = location.interface.parseError(error.data);
            console.log("Decoded error:", decodedError);
        }
    });