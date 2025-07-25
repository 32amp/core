const seedrsScope = scope("Seedrs", "Seed demo data for some module");
const inquirer = require("inquirer");
const { capitalsBounds, accountSelection, partnerSelection } = require("./helpers/promt_selection");
const {location: locationData,  direction: directionData}  = require("./../test/lib/location_data");
const {EVSEdata, connector: connectorData} = require("./../test/lib/evse_data");
const {tariff_array} = require("./../test/lib/tariff_data");
const { generateGeoPoints,generateLocationName, generateLocationAddress, generatePhysicalReference, generateOpeningTimes, generateLocationDescription, generateEVSEDescription, generateFacilities, generateParkingType, generateTimeZone, generatePostalCode, generateChargingWhenClosed, generateState, generateCountry, generateEVSEmeta, getEventArguments } = require("./../utils/utils");
const { loadContract } = require("./helpers/load_contract");

seedrsScope.task("generate-locations", "Generate locations with random EVSEs inside and random connectors, random description")
.setAction(async (args,hre) => {

    const {capital,bounds} = await capitalsBounds()
    const signer = await accountSelection(hre);
    const partner_id = await partnerSelection();
    const { instance: location } = await loadContract("Location", hre, signer, partner_id);
    const { instance: tariff } = await loadContract("Tariff", hre, signer, partner_id);
    const { instance: evse } = await loadContract("EVSE", hre, signer, partner_id);
    const { instance: connector } = await loadContract("Connector", hre, signer, partner_id);
    
    const questions = [
        {
            type: "input",
            name: "count_location",
            message: "Enter count of location:",
            validate: (input) => !isNaN(input) && input > 0,
        },
        {
            type: "input",
            name: "min_evse",
            message: "Enter minimum EVSE in location:",
            validate: (input) => !isNaN(input) && input > 0,
        },
        {
            type: "input",
            name: "max_evse",
            message: "Enter maximum EVSE in location:",
            validate: (input) => !isNaN(input) && input > 0,
        },
        {
            type: "input",
            name: "min_connectors",
            message: "Enter minimum conectors in EVSE:",
            validate: (input) => !isNaN(input) && input > 0,
        },
        {
            type: "input",
            name: "max_connectors",
            message: "Enter maximum conectors in EVSE:",
            validate: (input) => !isNaN(input) && input > 0,
        },
    ];

    const answers = await inquirer.prompt(questions);
    
    const geo_points = generateGeoPoints(bounds.sw, bounds.ne, Number(answers.count_location));


    for (let index = 0; index < tariff_array.length; index++) {
        const tariffEl = tariff_array[index];

        await tariff.add(tariffEl)
        
    }

    console.log("geo_points", geo_points)

    for (let loci = 0; loci < geo_points.length; loci++) {
        const geo_point = geo_points[loci];
        const locationel = locationData;

        locationel.city = ethers.encodeBytes32String(capital);
        locationel.name = generateLocationName(capital);
        locationel.facilities = generateFacilities();
        locationel._address = generateLocationAddress(capital);
        locationel.coordinates = geo_point;
        locationel.parking_type = generateParkingType();
        locationel.time_zone = generateTimeZone(capital);
        locationel.postal_code = generatePostalCode(capital);
        locationel.charging_when_closed = generateChargingWhenClosed();
        locationel.state = ethers.encodeBytes32String(generateState(capital));
        locationel.country = ethers.encodeBytes32String(generateCountry(capital));

        
        const tx = await location.addLocation(locationel);
        const { uid: locationId } = await getEventArguments(tx, "AddLocation")
        console.log("locationel", locationId, locationel)
        
        const direction = directionData
        direction.language = "en"
        direction.text = generateLocationDescription(capital);


        await location.addDirection(locationId, direction)


        const openingTimes = generateOpeningTimes();
        await location.setOpeningTimes(locationId, openingTimes);


        const evse_count = getRandomNumber(Number(answers.min_evse), Number(answers.max_evse))
        console.log("evse_count", evse_count)

        for (let evsei = 0; evsei < evse_count; evsei++) {
            const direction_evse = directionData
            direction_evse.language = "en"
            direction_evse.text = generateEVSEDescription();


            const evsel = EVSEdata;
            evsel.hardware_id = `evse-${loci}-${evsei}`;

            evsel.directions = [direction_evse];
            
            evsel.physical_reference = generatePhysicalReference();
            const meta = generateEVSEmeta(locationel.coordinates);
            var evseId;
            try {
                const tx = await evse.add(evsel, locationId);
                const { uid } = await getEventArguments(tx, "AddEVSE")
                evseId = uid;
            } catch (error) {
                const tx = await evse.add(evsel, locationId);
                const { uid } = await getEventArguments(tx, "AddEVSE")
                evseId = uid;
            }

            try {
                let txmeta = await evse.setMeta(evseId, meta)
                await txmeta.wait();
            } catch (error) {
                let txmeta = await evse.setMeta(evseId, meta)
                await txmeta.wait();

            }



            const connector_count = getRandomNumber(Number(answers.min_connectors), Number(answers.max_connectors))
            console.log("connector_count", connector_count)

            for (let connecti = 0; connecti < connector_count; connecti++) {
                const connectorEl = connectorData
                connectorEl.standard = getRandomNumber(1, 7);
                connectorEl.format = 2;
                connectorEl.power_type = (connectorEl.standard == 1 || connectorEl.standard == 2 || connectorEl.standard == 7) ? 4 : 5;
                connectorEl.max_voltage = (connectorEl.power_type == 4) ? 220 : 950;
                connectorEl.max_amperage = (connectorEl.power_type == 4) ? 32 : 250;
                connectorEl.max_electric_power = (connectorEl.power_type == 4) ? 22 : 150;
                connectorEl.terms_and_conditions_url = "https://google.com";


                var connectorId;
                try {
                    const tx = await connector.add(connectorEl, evseId);
                    const { uid } = await getEventArguments(tx, "AddConnector")
                    connectorId = uid;
                } catch (error) {
                    const tx = await connector.add(connectorEl, evseId);
                    const { uid } = await getEventArguments(tx, "AddConnector")
                    connectorId = uid;
                }

                try {
                    
                    await connector.setTariffs(connectorId, getRandomNumber(1, tariff_array.length));
                    await connector.setStatus(connectorId,getRandomNumber(1, 5))
                } catch (error) {
                    await connector.setTariffs(connectorId, getRandomNumber(1, tariff_array.length));
                    await connector.setStatus(connectorId,getRandomNumber(1, 5))

                }

                
                
            }
        }
        
    }

})

function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}