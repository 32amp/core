const userScope = scope("User", "Tasks for User module");
const { loadContract } = require("./helpers/load_contract");
const { accountSelection, partnerSelection } = require("./helpers/promt_selection");
const { loadConfig } = require("./helpers/configs");
const inquirer = require("inquirer");
const { encryptAESGCM, decryptAESGCM } = require("../helpers/aes");


// Function for displaying user information in a readable form
async function printUserInfo(userInfo, aeskey) {
    console.log("User information:");
    console.log(` ID: ${userInfo.id.toString()}`);
    console.log(` Telegram ID: ${await decryptAESGCM(userInfo.tg_id, aeskey)}`);
    console.log(` Phone: ${await decryptAESGCM(userInfo.phone, aeskey)}`);
    console.log(` Email: ${await decryptAESGCM(userInfo.email, aeskey)}`);
    console.log(` Name: ${await decryptAESGCM(userInfo.first_name, aeskey)}`);
    console.log(` Last name: ${await decryptAESGCM(userInfo.last_name, aeskey)}`);
    console.log(` Language code: ${await decryptAESGCM(userInfo.language_code, aeskey)}`);
    console.log(` User type: ${userInfo.user_type === 0 ? "Normal" : "Company"}`);
    console.log(` Enabled: ${userInfo.enable ? "Yes" : "No"}`);
    console.log(` Last updated: ${new Date(Number(userInfo.last_updated.toString()) * 1000).toLocaleString()}`);
}

// Task to get the version of the User contract
userScope.task("version", "Get the version of the User contract")
    .setAction(async (taskArgs, hre) => {
        const { instance: user } = await loadContract("User", hre);
        const version = await user.getVersion();

        console.log(`Contract version: ${version} with address ${user.target}`);
    });

// Task to deploy of the User contract
userScope.task("deploy", "Deploy of the User contract")
    .setAction(async (taskArgs, hre) => {
        const config = await loadConfig("config")
        const signer = await accountSelection(hre);
        const partner_id = await partnerSelection();

        if (typeof config?.deployed?.Hub == "undefined")
            throw new Error("Hub not deployed")

        try {
            const contractFactory = await ethers.getContractFactory("User")
            const contractFactorySigner = contractFactory.connect(signer);
            const deploy = await upgrades.deployProxy(contractFactorySigner, [partner_id, config.deployed.Hub], { initializer: "initialize" })

            const deployed = await deploy.waitForDeployment()
            console.log("Success deploy with address:", deployed.target)
        } catch (error) {
            console.log("Failed deploy: ", error)
        }

    });

// Task to upgrade of the User contract
userScope.task("upgrade", "Upgrade of the User contract")
    .addOptionalParam("force", "Using forceImport")
    .setAction(async (taskArgs, hre) => {
        const { instance: user } = await loadContract("User", hre);

        try {
            const utilsFactory = await ethers.getContractFactory("Utils")
            const utilsDeploy = await utilsFactory.deploy()
            const utilsDeployed = await utilsDeploy.waitForDeployment()

            const contractFactory = await ethers.getContractFactory("User", {libraries:{Utils: utilsDeployed.target}})

            var deploy 
 
            if(taskArgs?.force)
                deploy = await upgrades.forceImport(user.target, contractFactory,{unsafeAllow: ["external-library-linking"]})
            else
                deploy = await upgrades.upgradeProxy(user.target, contractFactory,{unsafeAllow: ["external-library-linking"]})

            await deploy.waitForDeployment()
            console.log("Success upgrade")
        } catch (error) {
            console.log("Failed upgrade: ", error)
        }

    });


// Task to add a new user
userScope.task("add-user", "Add a new user")
    .addParam("account", "The address of the user to add")
    .setAction(async (taskArgs, hre) => {
        const { instance: user } = await loadContract("User", hre);

        try {
            const tx = await user.addUser(taskArgs.account);
            await tx.wait();
            console.log(`User added with address: ${taskArgs.account}`);
        } catch (error) {
            const decodedError = user.interface.parseError(error.data);
            console.log("Decoded error:", decodedError);
        }

    });

// Task to get the current user's information
userScope.task("whoami", "Get the current user's information")
    .setAction(async (taskArgs, hre) => {
        const { instance: user } = await loadContract("User", hre);
        const questions = [
            {
                type: 'input',
                name: 'aeskey',
                message: 'Enter aeskey:'
            },
        ];
        const answers = await inquirer.prompt(questions);
        try {
            const userInfo = await user.whoami();
            console.log("Current user information:", await printUserInfo(userInfo, answers.aeskey));
        } catch (error) {
            const decodedError = user.interface.parseError(error.data);
            console.log("Decoded error:", decodedError);
        }

    });

// Task to check if a user exists
userScope.task("exist", "Check if a user exists")
    .addParam("account", "The address of the user to check")
    .setAction(async (taskArgs, hre) => {
        const { instance: user } = await loadContract("User", hre);
        try {
            await user.exist(taskArgs.account);

            console.log(`User with address ${taskArgs.account} exist`);
        } catch (error) {
            console.error(`User with address ${taskArgs.account} does not exist`)
        }

    });

// Task to get a user's information
userScope.task("get-user", "Get a user's information")
    .addParam("account", "The address of the user")
    .setAction(async (taskArgs, hre) => {
        const { instance: user } = await loadContract("User", hre);

        console.log("User address: ", user.target)
        const questions = [
            {
                type: 'input',
                name: 'aeskey',
                message: 'Enter aeskey:'
            },
        ];
        const answers = await inquirer.prompt(questions);
        try {
            const userInfo = await user.getUser(taskArgs.account);
            console.log("User information:", await printUserInfo(userInfo,answers.aeskey));
        } catch (error) {
            const decodedError = user.interface.parseError(error.data);
            console.log("Decoded error:", decodedError);
        }

    });



// Task to add a car for a user
userScope.task("add-car", "Add a car for a user")
    .addOptionalParam("account", "The address of the user")
    .setAction(async (taskArgs, hre) => {
        const { instance: user } = await loadContract("User", hre);
        const questions = [
            {
                type: 'input',
                name: 'brand',
                message: 'Enter the car brand:'
            },
            {
                type: 'input',
                name: 'model',
                message: 'Enter the car model:'
            },
            {
                type: 'input',
                name: 'connectors',
                message: 'Enter the connectors (comma-separated uint8 values, e.g., 1,2,3):'
            },
            {
                type: 'input',
                name: 'aeskey',
                message: 'Enter aeskey:'
            },
        ];
        const answers = await inquirer.prompt(questions);
        const connectors = answers.connectors.split(',').map(Number);
        const carData = {
            brand: await encryptAESGCM(answers.brand, answers.aeskey),
            model: await encryptAESGCM(answers.model, answers.aeskey),
            connectors: connectors
        };

        try {
            const tx = await user.addCar(taskArgs.account, carData);
            await tx.wait();
            console.log(`Car added for user ${taskArgs.account}`);
        } catch (error) {
            const decodedError = user.interface.parseError(error.data);
            console.log("Decoded error:", decodedError);

        }

    });

// Task to remove a car for a user
userScope.task("remove-car", "Remove a car for a user")
    .addParam("account", "The address of the user")
    .addParam("index", "The index of the car to remove")
    .setAction(async (taskArgs, hre) => {
        const { instance: user } = await loadContract("User", hre);
        try {

            const tx = await user.removeCar(taskArgs.account, taskArgs.index);
            await tx.wait();
            console.log(`Car at index ${taskArgs.index} removed for user ${taskArgs.account}`);
        } catch (error) {
            const decodedError = user.interface.parseError(error.data);
            console.log("Decoded error:", decodedError);
        }


    });

// Task to get the list of cars for a user
userScope.task("get-cars", "Get the list of cars for a user")
    .addParam("account", "The address of the user")
    .setAction(async (taskArgs, hre) => {
        const { instance: user } = await loadContract("User", hre);
        try {
            const cars = await user.getCars(taskArgs.account);
            console.log("Cars:", cars);
        } catch (error) {
            const decodedError = user.interface.parseError(error.data);
            console.log("Decoded error:", decodedError);
        }

    });


// Task to update company information for a user
userScope.task("update-user-info", "Update user information")
    .addParam("account", "The address of the user")
    .setAction(async (taskArgs, hre) => {
        const { instance: user } = await loadContract("User", hre);
        const questions = [
            {
                type: 'input',
                name: 'aeskey',
                message: 'Enter aeskey:'
            },
            {
                type: 'input',
                name: 'account',
                message: 'Enter account address:'
            },
            {
                type: 'input',
                name: 'first_name',
                message: 'Enter first name:'
            },
            {
                type: 'input',
                name: 'second_name',
                message: 'Enter second name:'
            },
            {
                type: 'list',
                name: 'lang',
                message: 'Select lang:',
                choices:[
                    {
                        name: "EN",
                        value: "en"
                    },
                    {
                        name: "RU",
                        value: "ru"
                    }
                ]
            }
        ];
        const answers = await inquirer.prompt(questions);

        let tx = await user.updateBaseData(answers.account, await encryptAESGCM(answers.first_name,answers.aeskey), await encryptAESGCM(answers.second_name,answers.aeskey),await encryptAESGCM(answers.lang,answers.aeskey))
    
    })

// Task to update company information for a user
userScope.task("update-company-info", "Update company information for a user")
    .addParam("account", "The address of the user")
    .setAction(async (taskArgs, hre) => {
        const { instance: user } = await loadContract("User", hre);
        const questions = [
            {
                type: 'input',
                name: 'aeskey',
                message: 'Enter aeskey:'
            },
            {
                type: 'input',
                name: 'name',
                message: 'Enter the company name:'
            },
            {
                type: 'input',
                name: 'description',
                message: 'Enter the company description:'
            },
            {
                type: 'input',
                name: 'inn',
                message: 'Enter the company INN:'
            },
            {
                type: 'input',
                name: 'kpp',
                message: 'Enter the company KPP:'
            },
            {
                type: 'input',
                name: 'ogrn',
                message: 'Enter the company OGRN:'
            },
            {
                type: 'input',
                name: 'bank_account',
                message: 'Enter the bank account number:'
            },
            {
                type: 'input',
                name: 'bank_name',
                message: 'Enter the bank name:'
            },
            {
                type: 'input',
                name: 'bank_bik',
                message: 'Enter the bank BIK:'
            },
            {
                type: 'input',
                name: 'bank_corr_account',
                message: 'Enter the bank correspondent account:'
            },
            {
                type: 'input',
                name: 'bank_inn',
                message: 'Enter the bank INN:'
            },
            {
                type: 'input',
                name: 'bank_kpp_account',
                message: 'Enter the bank KPP account:'
            }
        ];
        const answers = await inquirer.prompt(questions);
        const companyData = {
            name: await encryptAESGCM(answers.name, answers.aeskey),
            description: await encryptAESGCM(answers.description, answers.aeskey),
            inn: await encryptAESGCM(answers.inn, answers.aeskey),
            kpp: await encryptAESGCM(answers.kpp, answers.aeskey),
            ogrn: await encryptAESGCM(answers.ogrn, answers.aeskey),
            bank_account: await encryptAESGCM(answers.bank_account, answers.aeskey),
            bank_name: await encryptAESGCM(answers.bank_name, answers.aeskey),
            bank_bik: await encryptAESGCM(answers.bank_bik, answers.aeskey),
            bank_corr_account: await encryptAESGCM(answers.bank_corr_account, answers.aeskey),
            bank_inn: await encryptAESGCM(answers.bank_inn, answers.aeskey),
            bank_kpp_account: await encryptAESGCM(answers.bank_kpp_account, answers.aeskey)
        };

        try {
            const tx = await user.updateCompanyInfo(taskArgs.account, companyData);
            await tx.wait();
            console.log(`Company information updated for user ${taskArgs.account}`);
        } catch (error) {
            const decodedError = user.interface.parseError(error.data);
            console.log("Decoded error:", decodedError);
        }

    });

// Task to get company information for a user
userScope.task("get-company-info", "Get the company information for a user")
    .addParam("account", "The address of the user")
    .setAction(async (taskArgs, hre) => {
        const { instance: user } = await loadContract("User", hre);
        const questions = [
            {
                type: 'input',
                name: 'aeskey',
                message: 'Enter aeskey:'
            },
        ];
        const answers = await inquirer.prompt(questions);
        try {

            const companyInfo = await user.getCompanyInfo(taskArgs.account);

            console.log("Company information:")
            console.log(`   Name: ${await decryptAESGCM(companyInfo.name, answers.aeskey)}`)
            console.log(`   Description: ${await decryptAESGCM(companyInfo.description, answers.aeskey)}`)
            console.log(`   INN: ${await decryptAESGCM(companyInfo.inn, answers.aeskey)}`)
            console.log(`   KPP: ${await decryptAESGCM(companyInfo.kpp, answers.aeskey)}`)
            console.log(`   OGRN: ${await decryptAESGCM(companyInfo.ogrn, answers.aeskey)}`)
            console.log(`   Bank account: ${await decryptAESGCM(companyInfo.bank_account, answers.aeskey)}`)
            console.log(`   Bank name: ${await decryptAESGCM(companyInfo.bank_name, answers.aeskey)}`)
            console.log(`   Bank bik: ${await decryptAESGCM(companyInfo.bank_bik, answers.aeskey)}`)
            console.log(`   Bank corr account: ${await decryptAESGCM(companyInfo.bank_corr_account, answers.aeskey)}`)
            console.log(`   Bank inn: ${await decryptAESGCM(companyInfo.bank_inn, answers.aeskey)}`)
            console.log(`   Bank kpp account: ${await decryptAESGCM(companyInfo.bank_kpp_account, answers.aeskey)}`)

        } catch (error) {
            const decodedError = user.interface.parseError(error.data);
            console.log("Decoded error:", decodedError);
        }



    });
