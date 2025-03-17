const tariffScope = scope("Tariff", "Tasks for Tariff module");
const { getEventArguments } = require("../utils/utils");
const { DataTypes } = require("../helpers/Hub");
const { loadContract } = require("./helpers/load_contract");
const inquirer = require("inquirer");


function printTariffDetails(tariffDetails, isLight = false) {
    console.log("=== Tariff Details ===");

    if (!isLight) {
        console.log(`Country Code: ${tariffDetails.country_code}`);
        console.log(`Party ID: ${tariffDetails.party_id}`);
        console.log(`Tariff ID: ${tariffDetails.id}`);
        console.log(`Last Updated: ${new Date(Number(tariffDetails.last_updated) * 1000).toISOString()}`);
        console.log(`Start Date Time: ${new Date(Number(tariffDetails.start_date_time) * 1000).toISOString()}`);
        console.log(`End Date Time: ${new Date(Number(tariffDetails.end_date_time) * 1000).toISOString()}`);
    }

    console.log("\n=== Tariff Information ===");
    console.log(`Currency ID: ${tariffDetails.tariff.currency}`);
    console.log(`Tariff Alternative URL: ${tariffDetails.tariff.tariff_alt_url}`);

    if (tariffDetails.tariff.tariff_alt_text && tariffDetails.tariff.tariff_alt_text.length > 0) {
        console.log("\n=== Tariff Alternative Text ===");
        tariffDetails.tariff.tariff_alt_text.forEach((text, index) => {
            console.log(`Text ${index + 1}:`);
            console.log(`  Language: ${text.language}`);
            console.log(`  Text: ${text.text}`);
        });
    }

    if (tariffDetails.tariff.elements && tariffDetails.tariff.elements.length > 0) {
        console.log("\n=== Tariff Elements ===");
        tariffDetails.tariff.elements.forEach((element, index) => {
            console.log(`Element ${index + 1}:`);
            console.log("  Restrictions:");
            console.log(`    Start Time: ${element.restrictions.start_time_hour}:${element.restrictions.start_time_minute}`);
            console.log(`    End Time: ${element.restrictions.end_time_hour}:${element.restrictions.end_time_minute}`);
            console.log(`    Start Date: ${new Date(Number(element.restrictions.start_date) * 1000).toISOString()}`);
            console.log(`    End Date: ${new Date(Number(element.restrictions.end_date) * 1000).toISOString()}`);
            console.log(`    Min kWh: ${element.restrictions.min_kwh}`);
            console.log(`    Max kWh: ${element.restrictions.max_kwh}`);
            console.log(`    Min Current: ${element.restrictions.min_current}`);
            console.log(`    Max Current: ${element.restrictions.max_current}`);
            console.log(`    Min Power: ${element.restrictions.min_power}`);
            console.log(`    Max Power: ${element.restrictions.max_power}`);
            console.log(`    Min Duration: ${element.restrictions.min_duration}`);
            console.log(`    Max Duration: ${element.restrictions.max_duration}`);
            console.log(`    Days of Week: ${element.restrictions.day_of_week.join(", ")}`);
            console.log(`    Reservation: ${element.restrictions.reservation}`);

            if (element.price_components && element.price_components.length > 0) {
                console.log("  Price Components:");
                element.price_components.forEach((component, compIndex) => {
                    console.log(`    Component ${compIndex + 1}:`);
                    console.log(`      Type: ${component._type}`);
                    console.log(`      Price: ${component.price}`);
                    console.log(`      VAT: ${component.vat}%`);
                    console.log(`      Step Size: ${component.step_size}`);
                });
            }
        });
    }

    if (!isLight) {
        console.log("\n=== Price Constraints ===");
        console.log("Minimum Price:");
        console.log(`  Excl VAT: ${tariffDetails.min_price.excl_vat}`);
        console.log(`  Incl VAT: ${tariffDetails.min_price.incl_vat}`);
        console.log("Maximum Price:");
        console.log(`  Excl VAT: ${tariffDetails.max_price.excl_vat}`);
        console.log(`  Incl VAT: ${tariffDetails.max_price.incl_vat}`);

        if (tariffDetails.energy_mix) {
            console.log("\n=== Energy Mix ===");
            console.log(`Is Green Energy: ${tariffDetails.energy_mix.is_green_energy}`);
            console.log(`Supplier Name: ${tariffDetails.energy_mix.supplier_name}`);
            console.log(`Energy Product Name: ${tariffDetails.energy_mix.energy_product_name}`);

            if (tariffDetails.energy_mix.energy_sources && tariffDetails.energy_mix.energy_sources.length > 0) {
                console.log("Energy Sources:");
                tariffDetails.energy_mix.energy_sources.forEach((source, index) => {
                    console.log(`  Source ${index + 1}:`);
                    console.log(`    Type: ${source.source}`);
                    console.log(`    Percentage: ${source.percentage}%`);
                });
            }

            if (tariffDetails.energy_mix.environ_impact && tariffDetails.energy_mix.environ_impact.length > 0) {
                console.log("Environmental Impact:");
                tariffDetails.energy_mix.environ_impact.forEach((impact, index) => {
                    console.log(`  Impact ${index + 1}:`);
                    console.log(`    Category: ${impact.category}`);
                    console.log(`    Amount: ${impact.amount}`);
                });
            }
        }
    }

    console.log("\n=== End of Tariff Details ===");
}


// Task to get the version of the Tariff contract
tariffScope.task("version", "Get the version of the Tariff contract")
    .setAction(async (taskArgs, hre) => {
        const { instance : tariff } = await loadContract("Tariff",hre);
        const version = await tariff.getVersion();
        console.log(`Tariff contract version: ${version}`);
    });

// Task to upgrade of the Tariff contract
tariffScope.task("upgrade", "Upgrade of the Tariff contract")
    .setAction(async (taskArgs, hre) => {
        const { instance: tariff } = await loadContract("Tariff", hre);

        try {
            const contractFactory = await ethers.getContractFactory("Tariff")
            const deploy = await upgrades.upgradeProxy(tariff.target, contractFactory)

            await deploy.waitForDeployment()
            console.log("Success upgrade")
        } catch (error) {
            console.log("Failed upgrade: ", error)
        }
        
    });

// Task to check if a tariff exists
tariffScope.task("exist", "Check if a tariff exists")
    .addParam("id", "The tariff ID", undefined, types.int)
    .setAction(async (taskArgs, hre) => {
        const { instance : tariff } = await loadContract("Tariff",hre);
        const exists = await tariff.exist(taskArgs.id);
        console.log(`Tariff with ID ${taskArgs.id} exists: ${exists}`);
    });

// Task to add a new tariff
tariffScope.task("add", "Add a new tariff")
    .setAction(async (taskArgs, hre) => {
        const { tariff, partner_id, signer } = await loadContract("Tariff",hre);

        // Запрос основных данных о тарифе
        const tariffQuestions = [
            {
                type: "input",
                name: "currency",
                message: "Enter the currency ID:",
                validate: (input) => !isNaN(input) && input > 0,
            },
            {
                type: "input",
                name: "tariff_alt_url",
                message: "Enter the tariff alternative URL:",
            },
            {
                type: "input",
                name: "tariff_alt_text_language",
                message: "Enter the language code for tariff alternative text (e.g., 'en'):",
            },
            {
                type: "input",
                name: "tariff_alt_text",
                message: "Enter the tariff alternative text:",
            },
        ];

        const tariffAnswers = await inquirer.prompt(tariffQuestions);

        // Запрос данных о каждом элементе тарифа
        const elements = [];
        let addMoreElements = true;

        while (addMoreElements) {
            const elementQuestions = [
                {
                    type: "input",
                    name: "start_time_hour",
                    message: "Enter the start time hour (0-24):",
                    validate: (input) => !isNaN(input) && input >= 0 && input <= 24,
                },
                {
                    type: "input",
                    name: "start_time_minute",
                    message: "Enter the start time minute (0-59):",
                    validate: (input) => !isNaN(input) && input >= 0 && input <= 59,
                },
                {
                    type: "input",
                    name: "end_time_hour",
                    message: "Enter the end time hour (0-24):",
                    validate: (input) => !isNaN(input) && input >= 0 && input <= 24,
                },
                {
                    type: "input",
                    name: "end_time_minute",
                    message: "Enter the end time minute (0-59):",
                    validate: (input) => !isNaN(input) && input >= 0 && input <= 59,
                },
                {
                    type: "input",
                    name: "start_date",
                    message: "Enter the start date (UNIX timestamp):",
                    validate: (input) => !isNaN(input) && input > 0,
                },
                {
                    type: "input",
                    name: "end_date",
                    message: "Enter the end date (UNIX timestamp):",
                    validate: (input) => !isNaN(input) && input > 0,
                },
                {
                    type: "input",
                    name: "min_kwh",
                    message: "Enter the minimum kWh:",
                    validate: (input) => !isNaN(input) && input >= 0,
                },
                {
                    type: "input",
                    name: "max_kwh",
                    message: "Enter the maximum kWh:",
                    validate: (input) => !isNaN(input) && input >= 0,
                },
                {
                    type: "input",
                    name: "min_current",
                    message: "Enter the minimum current (A):",
                    validate: (input) => !isNaN(input) && input >= 0,
                },
                {
                    type: "input",
                    name: "max_current",
                    message: "Enter the maximum current (A):",
                    validate: (input) => !isNaN(input) && input >= 0,
                },
                {
                    type: "input",
                    name: "min_power",
                    message: "Enter the minimum power (kW):",
                    validate: (input) => !isNaN(input) && input >= 0,
                },
                {
                    type: "input",
                    name: "max_power",
                    message: "Enter the maximum power (kW):",
                    validate: (input) => !isNaN(input) && input >= 0,
                },
                {
                    type: "input",
                    name: "min_duration",
                    message: "Enter the minimum duration (seconds):",
                    validate: (input) => !isNaN(input) && input >= 0,
                },
                {
                    type: "input",
                    name: "max_duration",
                    message: "Enter the maximum duration (seconds):",
                    validate: (input) => !isNaN(input) && input >= 0,
                },
                {
                    type: "checkbox",
                    name: "day_of_week",
                    message: "Select applicable days of the week:",
                    choices: Object.keys(DataTypes.DayOfWeek),
                },
                {
                    type: "list",
                    name: "reservation",
                    message: "Select reservation restriction type:",
                    choices: Object.keys(DataTypes.ReservationRestrictionType),
                },
            ];

            const elementAnswers = await inquirer.prompt(elementQuestions);

            // Преобразование строковых значений DayOfWeek в числовые
            const dayOfWeekNumbers = elementAnswers.day_of_week.map(
                (day) => DataTypes.DayOfWeek[day]
            );

            // Преобразование строкового значения ReservationRestrictionType в числовое
            const reservationValue = DataTypes.ReservationRestrictionType[elementAnswers.reservation];

            // Запрос данных о компонентах цены
            const priceComponents = [];
            let addMoreComponents = true;

            while (addMoreComponents) {
                const componentQuestions = [
                    {
                        type: "list",
                        name: "_type",
                        message: "Select the tariff dimension type:",
                        choices: Object.keys(DataTypes.TariffDimensionType),
                    },
                    {
                        type: "input",
                        name: "price",
                        message: "Enter the price per unit:",
                        validate: (input) => !isNaN(input) && input >= 0,
                    },
                    {
                        type: "input",
                        name: "vat",
                        message: "Enter the VAT percentage (0-100):",
                        validate: (input) => !isNaN(input) && input >= 0 && input <= 100,
                    },
                    {
                        type: "input",
                        name: "step_size",
                        message: "Enter the step size:",
                        validate: (input) => !isNaN(input) && input >= 0,
                    },
                ];

                const componentAnswers = await inquirer.prompt(componentQuestions);

                // Преобразование строкового значения TariffDimensionType в числовое
                const tariffDimensionValue = DataTypes.TariffDimensionType[componentAnswers._type];

                priceComponents.push({
                    _type: tariffDimensionValue,
                    price: parseInt(componentAnswers.price),
                    vat: parseInt(componentAnswers.vat),
                    step_size: parseInt(componentAnswers.step_size),
                });

                const { addMore } = await inquirer.prompt([
                    {
                        type: "confirm",
                        name: "addMore",
                        message: "Add another price component?",
                        default: false,
                    },
                ]);
                addMoreComponents = addMore;
            }

            // Сбор данных об элементе тарифа
            const tariffElement = {
                restrictions: {
                    start_time_hour: parseInt(elementAnswers.start_time_hour),
                    start_time_minute: parseInt(elementAnswers.start_time_minute),
                    end_time_hour: parseInt(elementAnswers.end_time_hour),
                    end_time_minute: parseInt(elementAnswers.end_time_minute),
                    start_date: parseInt(elementAnswers.start_date),
                    end_date: parseInt(elementAnswers.end_date),
                    min_kwh: parseInt(elementAnswers.min_kwh),
                    max_kwh: parseInt(elementAnswers.max_kwh),
                    min_current: parseInt(elementAnswers.min_current),
                    max_current: parseInt(elementAnswers.max_current),
                    min_power: parseInt(elementAnswers.min_power),
                    max_power: parseInt(elementAnswers.max_power),
                    min_duration: parseInt(elementAnswers.min_duration),
                    max_duration: parseInt(elementAnswers.max_duration),
                    day_of_week: dayOfWeekNumbers,
                    reservation: reservationValue,
                },
                price_components: priceComponents,
            };

            elements.push(tariffElement);

            const { addMore } = await inquirer.prompt([
                {
                    type: "confirm",
                    name: "addMore",
                    message: "Add another tariff element?",
                    default: false,
                },
            ]);
            addMoreElements = addMore;
        }

        // Сбор всех данных о тарифе
        const tariffData = {
            currency: parseInt(tariffAnswers.currency),
            tariff_alt_url: tariffAnswers.tariff_alt_url,
            tariff_alt_text: [
                {
                    language: tariffAnswers.tariff_alt_text_language,
                    text: tariffAnswers.tariff_alt_text,
                },
            ],
            elements: elements,
        };

        // Вызов метода контракта
        const tx = await tariff.add(tariffData);
        const eventArgs = await getEventArguments(tx, "AddTariff", 1);
        if (eventArgs) {
            console.log(`Tariff added with ID: ${eventArgs.uid}`);
        } else {
            console.log("Tariff added, but event not found");
        }
    });

// Task to set the minimum price for a tariff
tariffScope.task("set-min-price", "Set the minimum price for a tariff")
    .addParam("id", "The tariff ID", undefined, types.int)
    .setAction(async (taskArgs, hre) => {
        const { instance : tariff } = await loadContract("Tariff",hre);

        const questions = [
            {
                type: "input",
                name: "excl_vat",
                message: "Enter the minimum price excluding VAT:",
                validate: (input) => !isNaN(input) && input > 0,
            },
            {
                type: "input",
                name: "incl_vat",
                message: "Enter the minimum price including VAT:",
                validate: (input) => !isNaN(input) && input > 0,
            },
        ];

        const answers = await inquirer.prompt(questions);

        const minPrice = {
            excl_vat: parseInt(answers.excl_vat),
            incl_vat: parseInt(answers.incl_vat),
        };

        await tariff.setMinPrice(taskArgs.id, minPrice);
        console.log(`Minimum price set for tariff ID ${taskArgs.id}`);
    });

// Task to set the maximum price for a tariff
tariffScope.task("set-max-price", "Set the maximum price for a tariff")
    .addParam("id", "The tariff ID", undefined, types.int)
    .setAction(async (taskArgs, hre) => {
        const { instance : tariff } = await loadContract("Tariff",hre);

        const questions = [
            {
                type: "input",
                name: "excl_vat",
                message: "Enter the maximum price excluding VAT:",
                validate: (input) => !isNaN(input) && input > 0,
            },
            {
                type: "input",
                name: "incl_vat",
                message: "Enter the maximum price including VAT:",
                validate: (input) => !isNaN(input) && input > 0,
            },
        ];

        const answers = await inquirer.prompt(questions);

        const maxPrice = {
            excl_vat: parseInt(answers.excl_vat),
            incl_vat: parseInt(answers.incl_vat),
        };

        await tariff.setMaxPrice(taskArgs.id, maxPrice);
        console.log(`Maximum price set for tariff ID ${taskArgs.id}`);
    });

// Task to set the start date and time for a tariff
tariffScope.task("set-start-date-time", "Set the start date and time for a tariff")
    .addParam("id", "The tariff ID", undefined, types.int)
    .setAction(async (taskArgs, hre) => {
        const { instance : tariff } = await loadContract("Tariff",hre);

        const questions = [
            {
                type: "input",
                name: "start_date_time",
                message: "Enter the start date and time (UNIX timestamp):",
                validate: (input) => !isNaN(input) && input > 0,
            },
        ];

        const answers = await inquirer.prompt(questions);

        await tariff.setStartDateTime(taskArgs.id, parseInt(answers.start_date_time));
        console.log(`Start date and time set for tariff ID ${taskArgs.id}`);
    });

// Task to set the end date and time for a tariff
tariffScope.task("set-end-date-time", "Set the end date and time for a tariff")
    .addParam("id", "The tariff ID", undefined, types.int)
    .setAction(async (taskArgs, hre) => {
        const { instance : tariff } = await loadContract("Tariff",hre);

        const questions = [
            {
                type: "input",
                name: "end_date_time",
                message: "Enter the end date and time (UNIX timestamp):",
                validate: (input) => !isNaN(input) && input > 0,
            },
        ];

        const answers = await inquirer.prompt(questions);

        await tariff.setEndDateTime(taskArgs.id, parseInt(answers.end_date_time));
        console.log(`End date and time set for tariff ID ${taskArgs.id}`);
    });

// Task to set the energy mix for a tariff
tariffScope.task("set-energy-mix", "Set the energy mix for a tariff")
    .addParam("id", "The tariff ID", undefined, types.int)
    .setAction(async (taskArgs, hre) => {
        const { instance : tariff } = await loadContract("Tariff",hre);

        // Запрос основных данных о EnergyMix
        const energyMixQuestions = [
            {
                type: "confirm",
                name: "is_green_energy",
                message: "Is this green energy?",
                default: false,
            },
            {
                type: "input",
                name: "supplier_name",
                message: "Enter the supplier name:",
            },
            {
                type: "input",
                name: "energy_product_name",
                message: "Enter the energy product name:",
            },
        ];

        const energyMixAnswers = await inquirer.prompt(energyMixQuestions);

        
        const energySources = [];
        let addMoreSources = true;

        while (addMoreSources) {
            const sourceQuestions = [
                {
                    type: "list",
                    name: "source",
                    message: "Select the energy source category:",
                    choices: Object.keys(DataTypes.EnergySourceCategory),
                },
                {
                    type: "input",
                    name: "percentage",
                    message: "Enter the percentage (0-100):",
                    validate: (input) => !isNaN(input) && input >= 0 && input <= 100,
                },
            ];

            const sourceAnswers = await inquirer.prompt(sourceQuestions);

            
            const sourceValue = DataTypes.EnergySourceCategory[sourceAnswers.source];

            energySources.push({
                source: sourceValue,
                percentage: parseInt(sourceAnswers.percentage),
            });

            const { addMore } = await inquirer.prompt([
                {
                    type: "confirm",
                    name: "addMore",
                    message: "Add another energy source?",
                    default: false,
                },
            ]);
            addMoreSources = addMore;
        }

        
        const environmentalImpacts = [];
        let addMoreImpacts = true;

        while (addMoreImpacts) {
            const impactQuestions = [
                {
                    type: "list",
                    name: "category",
                    message: "Select the environmental impact category:",
                    choices: Object.keys(DataTypes.EnvironmentalImpactCategory),
                },
                {
                    type: "input",
                    name: "amount",
                    message: "Enter the amount:",
                    validate: (input) => !isNaN(input) && input >= 0,
                },
            ];

            const impactAnswers = await inquirer.prompt(impactQuestions);

            
            const categoryValue = DataTypes.EnvironmentalImpactCategory[impactAnswers.category];

            environmentalImpacts.push({
                category: categoryValue,
                amount: parseInt(impactAnswers.amount),
            });

            const { addMore } = await inquirer.prompt([
                {
                    type: "confirm",
                    name: "addMore",
                    message: "Add another environmental impact?",
                    default: false,
                },
            ]);
            addMoreImpacts = addMore;
        }

        
        const energyMix = {
            is_green_energy: energyMixAnswers.is_green_energy,
            energy_sources: energySources,
            environ_impact: environmentalImpacts,
            supplier_name: energyMixAnswers.supplier_name,
            energy_product_name: energyMixAnswers.energy_product_name,
        };

        
        await tariff.setEnergyMix(taskArgs.id, energyMix);
        console.log(`Energy mix set for tariff ID ${taskArgs.id}`);
    });

    
// Task to get the full details of a tariff
tariffScope.task("get", "Get the full details of a tariff")
    .addParam("id", "The tariff ID", undefined, types.int)
    .setAction(async (taskArgs, hre) => {
        const { instance : tariff } = await loadContract("Tariff",hre);
        const output = await tariff.get(taskArgs.id);
        printTariffDetails(output, false);
    });

// Task to get the light details of a tariff
tariffScope.task("get-light", "Get the light details of a tariff")
    .addParam("id", "The tariff ID", undefined, types.int)
    .setAction(async (taskArgs, hre) => {
        const { instance : tariff } = await loadContract("Tariff",hre);
        const outputLight = await tariff.getLight(taskArgs.id);
        printTariffDetails(outputLight, true);
    });