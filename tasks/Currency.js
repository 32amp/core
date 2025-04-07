const { loadConfig, saveConfig } = require("./helpers/configs")
const currencyScope = scope("Currencies", "Currency for HUB");


currencyScope.task("deploy", "Deploys a Currencies contract")
    .setAction(async (taskArgs, hre) => {

        var config;

        try {
            config = await loadConfig("config")

        } catch (error) {
            config = {};
        }

        if (typeof config?.deployed?.Currencies != "undefined")
            throw new Error("Currencies already deployed")

        const CurrencyFactory = await hre.ethers.getContractFactory("Currencies");
        const deploy = await hre.upgrades.deployProxy(CurrencyFactory, [], { initializer: "initialize" });
        const deployed = await deploy.waitForDeployment();

        if (typeof config?.deployed == "undefined")
            config.deployed = {}

        config.deployed.Currencies = deployed.target;

        await saveConfig("config", config)

        console.log("The Currencies contract is deployed at:", deployed.target);
        return deployed.target;
    });


// Task to upgrade of the Currency contract
currencyScope.task("upgrade", "Upgrade of the Currency contract")
    .setAction(async (taskArgs, hre) => {
        // Load the configuration to get the deployed contract address
        const config = await loadConfig("config");
        const currenciesAddress = config.deployed.Currencies;

        if (!currenciesAddress) {
            throw new Error("Currencies contract not deployed");
        }


        try {
            const contractFactory = await ethers.getContractFactory("Currency")
            const deploy = await upgrades.upgradeProxy(currenciesAddress, contractFactory)

            await deploy.waitForDeployment()
            console.log("Success upgrade")
        } catch (error) {
            console.log("Failed upgrade: ", error)
        }

    });

// Task to add a new currency
currencyScope
    .task("add", "Add a new currency")
    .addParam("country", "Country name")
    .addParam("currency", "Currency name")
    .addParam("alphabeticcode", "Alphabetic code")
    .addParam("symbol", "Currency symbol")
    .addParam("numericcode", "Numeric code", undefined, types.int)
    .addParam("minorunit", "Minor unit", undefined, types.int)
    .setAction(async (taskArgs, hre) => {
        // Load the configuration to get the deployed contract address
        const config = await loadConfig("config");
        const currenciesAddress = config.deployed.Currencies;

        if (!currenciesAddress) {
            throw new Error("Currencies contract not deployed");
        }

        // Get the contract instance
        const currencies = await hre.ethers.getContractAt("Currencies", currenciesAddress);

        // Construct the currency object
        const currency = {
            country: taskArgs.country,
            currency: taskArgs.currency,
            alphabetic_code: taskArgs.alphabeticcode,
            symbol: taskArgs.symbol,
            numeric_code: taskArgs.numericcode,
            minor_unit: taskArgs.minorunit,
        };

        try {
            // Send the transaction to add the currency
            const tx = await currencies.add(currency);
            console.log(`Transaction hash: ${tx.hash}`);
            await tx.wait();
            console.log("Currency added successfully");
        } catch (error) {
            const decodedError = currencies.interface.parseError(error.data);
            console.log("Decoded error:", decodedError);
        }
    });

// Task to get currency details by ID
currencyScope
    .task("get", "Get currency by ID")
    .addParam("id", "Currency ID", undefined, types.int)
    .setAction(async (taskArgs, hre) => {
        const config = await loadConfig("config");
        const currenciesAddress = config.deployed.Currencies;

        if (!currenciesAddress) {
            throw new Error("Currencies contract not deployed");
        }

        const currencies = await hre.ethers.getContractAt("Currencies", currenciesAddress);



        try {
            const currency = await currencies.get(taskArgs.id);

            console.log("Currency details:");
            console.log(`Country: ${currency.country}`);
            console.log(`Currency: ${currency.currency}`);
            console.log(`Alphabetic Code: ${currency.alphabetic_code}`);
            console.log(`Symbol: ${currency.symbol}`);
            console.log(`Numeric Code: ${currency.numeric_code.toString()}`);
            console.log(`Minor Unit: ${currency.minor_unit.toString()}`);
        } catch (error) {
            const decodedError = currencies.interface.parseError(error.data);
            console.log("Decoded error:", decodedError);
        }
    });

// Task to check if a currency exists by ID
currencyScope
    .task("exist", "Check if currency exists by ID")
    .addParam("id", "Currency ID", undefined, types.int)
    .setAction(async (taskArgs, hre) => {
        const config = await loadConfig("config");
        const currenciesAddress = config.deployed.Currencies;

        if (!currenciesAddress) {
            throw new Error("Currencies contract not deployed");
        }

        const currencies = await hre.ethers.getContractAt("Currencies", currenciesAddress);
        const exists = await currencies.exist(taskArgs.id);

        console.log(`Currency with ID ${taskArgs.id} exists: ${exists}`);
    });

// Task to list all currencies
currencyScope
    .task("list", "List all currencies")
    .setAction(async (taskArgs, hre) => {
        const config = await loadConfig("config");
        const currenciesAddress = config.deployed.Currencies;

        if (!currenciesAddress) {
            throw new Error("Currencies contract not deployed");
        }

        const currencies = await hre.ethers.getContractAt("Currencies", currenciesAddress);
        const currencyList = await currencies.list();

        console.log("List of currencies:");
        for (let i = 0; i < currencyList.length; i++) {
            const currency = currencyList[i];
            console.log(`ID: ${i + 1}`);
            console.log(`Country: ${currency.country}`);
            console.log(`Currency: ${currency.currency}`);
            console.log(`Alphabetic Code: ${currency.alphabetic_code}`);
            console.log(`Symbol: ${currency.symbol}`);
            console.log(`Numeric Code: ${currency.numeric_code.toString()}`);
            console.log(`Minor Unit: ${currency.minor_unit.toString()}`);
            console.log("---");
        }
    });