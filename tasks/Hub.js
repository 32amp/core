const { getEventArguments } = require("../utils/utils");
const { formatPartner, formatPartners } = require("../helpers/Hub");
const hubScope = scope("Hub", "Tasks for HUB");
const { loadConfig, saveConfig } = require("./helpers/configs")
const { accountSelection, partnerSelection, currencySelection } = require("./helpers/promt_selection");



hubScope.task("deploy", "Deploys a Hub contract with initial services")
    .setAction(async (taskArgs, hre) => {
        const config = await loadConfig("config")
        const signer = await accountSelection(hre);

        if (typeof config?.deployed?.Currencies == "undefined")
            throw new Error("Currencies not deployed")

        if (typeof config?.deployed?.Hub != "undefined")
            throw new Error("Hub already deployed")


        const servicesArray = [
            {
                name: "Currencies",
                contract_address: config.deployed.Currencies
            }
        ]

        const HubFactory = await hre.ethers.getContractFactory("Hub");
        const HubFactorySigner = HubFactory.connect(signer);
        const hub = await hre.upgrades.deployProxy(HubFactorySigner, [servicesArray], { initializer: "initialize" });
        const deployed = await hub.waitForDeployment();

        if (typeof config?.deployed == "undefined")
            config.deployed = {}

        config.deployed.Hub = deployed.target;

        await saveConfig("config", config)

        console.log("The Hub contract is deployed at:", deployed.target);
        return deployed.target;
    });

hubScope.task("register-partner", "Registers a new partner")
    .addParam("name", "Partner name (minimum 3 characters)")
    .addParam("country", "Country code (2 characters)")
    .addParam("party", "Party ID (3 characters)")
    .setAction(async (taskArgs, hre) => {
        const { name, country, party } = taskArgs;
        const signer = await accountSelection(hre);
        const config = await loadConfig("config")

        if (typeof config?.deployed?.Hub == "undefined")
            throw new Error("Hub not deployed")

        // Input validation
        if (name.length < 3) throw new Error("Name must be at least 3 characters long");
        if (country.length !== 2) throw new Error("Country code must be exactly 2 characters long");
        if (party.length !== 3) throw new Error("Party ID must be exactly 3 characters long");

        const hub = await hre.ethers.getContractAt("Hub", config.deployed.Hub, signer);

        const tx = await hub.registerPartner(ethers.encodeBytes32String(name), ethers.toUtf8Bytes(country), ethers.toUtf8Bytes(party), {
            value: hre.ethers.parseEther("1"),
        });
        const { id } = await getEventArguments(tx, "AddPartner");

        console.log("Partner registered, transaction:", tx.hash);
        console.log("Partner ID:", id);

        if (typeof config?.partners == "undefined")
            config.partners = []

        config.partners.push({
            name, country, party, id: Number(id)
        })

        await saveConfig("config", config)
    });


hubScope.task("add-partner-modules", "Add modules to partner")
    .setAction(async (taskArgs, hre) => {
        const config = await loadConfig("config")
        const signer = await accountSelection(hre);
        const partner_id = await partnerSelection();

        if (typeof config?.deployed?.Hub == "undefined")
            throw new Error("Hub not deployed")

        const hub = await hre.ethers.getContractAt("Hub", config.deployed.Hub, signer);

        const modules = [
            "Location",
            "LocationSearch",
            "EVSE",
            "Connector",
            "MobileAppSettings",
            "Cards",
            "Balance",
            "Tariff",
            "UserSupportChat",
            "User",
            "UserGroups",
            "UserAccess"
        ]

        for (let index = 0; index < modules.length; index++) {
            const mod = modules[index];


            const moduleAddress = await hub.getModule(mod, partner_id);

            if (moduleAddress == hre.ethers.ZeroAddress) {


                console.log(`Module "${mod}" not exist, try to deploy`);
                var initialize = [partner_id, config.deployed.Hub];


                if (mod == "Balance") {
                    const currency = await currencySelection(hre);
                    var initialize = [partner_id, config.deployed.Hub, currency];
                }


                const contractFactory = await hre.ethers.getContractFactory(mod);
                const contractFactorySigner = contractFactory.connect(signer);
                const module = await hre.upgrades.deployProxy(contractFactorySigner, initialize, { initializer: "initialize" });
                const deployed = await module.waitForDeployment();



                if (typeof deployed?.target != "undefined") {
                    console.log(`Module "${mod}" success deployed to ${deployed.target}`)
                    let txadd = await hub.addModule(mod, deployed.target)

                    await txadd.wait()

                    console.log(`Module "${mod}" success added to hub`)

                }
            } else {
                console.log(`Module ${mod} already deployed`)
            }

        }
    });

hubScope.task("add-module", "Adds a new module for a partner")
    .addParam("name", "Module name")
    .addParam("address", "Module contract address")
    .setAction(async (taskArgs, hre) => {
        const { name, address: moduleAddress } = taskArgs;
        const config = await loadConfig("config")
        const signer = await accountSelection(hre);
        const partner_id = await partnerSelection();

        if (typeof config?.deployed?.Hub == "undefined")
            throw new Error("Hub not deployed")

        const hub = await hre.ethers.getContractAt("Hub", config.deployed.Hub, signer);

        if (!hre.ethers.isAddress(moduleAddress)) throw new Error("Invalid module address");

        const exist = await hub.getModule(name, partner_id);

        if (exist == hre.ethers.ZeroAddress) {

            const tx = await hub.addModule(name, moduleAddress);
            await tx.wait();

            console.log("Module added, transaction:", tx.hash);
        } else {
            throw new Error(`Module ${name} already exist with address ${exist}`)
        }

    });

hubScope.task("change-module-address", "Changes the address of an existing module")
    .addParam("name", "Module name")
    .addParam("address", "New module contract address")
    .setAction(async (taskArgs, hre) => {
        const { name, address: moduleAddress } = taskArgs;
        const config = await loadConfig("config")
        const signer = await accountSelection(hre);
        const partner_id = await partnerSelection();

        if (!hre.ethers.isAddress(moduleAddress)) throw new Error("Invalid module address");

        if (typeof config?.deployed?.Hub == "undefined")
            throw new Error("Hub not deployed")

        const hub = await hre.ethers.getContractAt("Hub", config.deployed.Hub, signer);

        const exist = await hub.getModule(name, partner_id);

        if (exist != hre.ethers.ZeroAddress)
            throw new Error(`Module ${name} does not exist`)

        const tx = await hub.changeModuleAddress(name, moduleAddress);
        await tx.wait();

        console.log("Module address changed, transaction:", tx.hash);
    });

hubScope.task("get-partner-by-address", "Получает информацию о партнере по адресу кошелька")
    .addParam("address", "Адрес кошелька партнера")
    .setAction(async (taskArgs, hre) => {
        const { address: partnerAddress } = taskArgs;
        const config = await loadConfig("config")

        if (!hre.ethers.isAddress(partnerAddress)) throw new Error("Неверный адрес партнера");

        if (typeof config?.deployed?.Hub == "undefined")
            throw new Error("Hub not deployed")

        const hub = await hre.ethers.getContractAt("Hub", config?.deployed?.Hub);
        const partner = await hub.getPartnerByAddress(partnerAddress);

        console.log(formatPartner(partner))
    });


hubScope.task("get-partner-by-id", "Gets partner information by ID")
    .addParam("id", "Partner ID", "number")
    .setAction(async (taskArgs, hre) => {
        const { id } = taskArgs;

        const config = await loadConfig("config")

        if (typeof config?.deployed?.Hub == "undefined")
            throw new Error("Hub not deployed")

        const hub = await hre.ethers.getContractAt("Hub", config?.deployed?.Hub);
        const partner = await hub.getPartner(id);

        console.log(formatPartner(partner))
    });

hubScope.task("list-partners", "Lists all registered partners")
    .setAction(async (taskArgs, hre) => {

        const config = await loadConfig("config")

        if (typeof config?.deployed?.Hub == "undefined")
            throw new Error("Hub not deployed")

        const hub = await hre.ethers.getContractAt("Hub", config?.deployed?.Hub);
        const partners = await hub.getPartners();

        console.log("Registered partners:");
        console.log(formatPartners(partners))
    });

// 8. Getting module address
hubScope.task("get-module-address", "Gets module address by partner name and ID")
    .addParam("name", "Module name")
    .setAction(async (taskArgs, hre) => {
        const { name } = taskArgs;

        const config = await loadConfig("config")
        const partner_id = await partnerSelection();

        if (typeof config?.deployed?.Hub == "undefined")
            throw new Error("Hub not deployed")

        const hub = await hre.ethers.getContractAt("Hub", config?.deployed?.Hub);
        const moduleAddress = await hub.getModule(name, partner_id);

        console.log(`Module address '${name}' for partner with ID ${partner_id}:`, moduleAddress);
    });

hubScope.task("list-partner-modules", "Lists all partner modules")
    .addParam("partnerid", "Partner ID", "number")
    .setAction(async (taskArgs, hre) => {
        const { partnerid } = taskArgs;
        const config = await loadConfig("config")

        if (typeof config?.deployed?.Hub == "undefined")
            throw new Error("Hub not deployed")

        const hub = await hre.ethers.getContractAt("Hub", config?.deployed?.Hub);
        const modules = await hub.getPartnerModules(partnerid);

        console.log(`Modules for partner with ID ${partnerid}:`, modules);
    });

hubScope.task("get-service", "Gets service address by name")
    .addParam("name", "Service name")
    .setAction(async (taskArgs, hre) => {
        const { hub: hubAddress, name } = taskArgs;

        const config = await loadConfig("config")

        if (typeof config?.deployed?.Hub == "undefined")
            throw new Error("Hub not deployed")

        const hub = await hre.ethers.getContractAt("Hub", config?.deployed?.Hub);

        const serviceAddress = await hub.getService(name);

        console.log(`Service Address '${name}':`, serviceAddress);
    });