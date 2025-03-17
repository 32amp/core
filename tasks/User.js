const userScope = scope("User", "Tasks for User module");
const { loadContract } = require("./helpers/load_contract");
const inquirer = require("inquirer");


// Function for displaying user information in a readable form
function printUserInfo(userInfo) {
    console.log("User information:");
    console.log(` ID: ${userInfo.id.toString()}`);
    console.log(` Telegram ID: ${userInfo.tg_id}`);
    console.log(` Phone: ${userInfo.phone}`);
    console.log(` Email: ${userInfo.email}`);
    console.log(` Name: ${userInfo.first_name}`);
    console.log(` Last name: ${userInfo.last_name}`);
    console.log(` Language code: ${userInfo.language_code}`);
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

// Task to get the version of the User contract
userScope.task("upgrade", "Upgrade of the User contract")
    .setAction(async (taskArgs, hre) => {
        const { instance: user } = await loadContract("User", hre);

        try {
            const contractFactory = await ethers.getContractFactory("User")
            const deploy = await upgrades.upgradeProxy(user.target, contractFactory)

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
        const userInfo = await user.whoami();
        console.log("Current user information:", printUserInfo(userInfo));
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
        const userInfo = await user.getUser(taskArgs.account);
        console.log("User information:", printUserInfo(userInfo));
    });

// Task to add a car for a user
userScope.task("add-car", "Add a car for a user")
    .addParam("account", "The address of the user")
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
            }
        ];
        const answers = await inquirer.prompt(questions);
        const connectors = answers.connectors.split(',').map(Number);
        const carData = {
            brand: answers.brand,
            model: answers.model,
            connectors: connectors
        };
        const tx = await user.addCar(taskArgs.account, carData);
        await tx.wait();
        console.log(`Car added for user ${taskArgs.account}`);
    });

// Task to remove a car for a user
userScope.task("remove-car", "Remove a car for a user")
    .addParam("account", "The address of the user")
    .addParam("index", "The index of the car to remove")
    .setAction(async (taskArgs, hre) => {
        const { instance: user } = await loadContract("User", hre);
        const tx = await user.removeCar(taskArgs.account, taskArgs.index);
        await tx.wait();
        console.log(`Car at index ${taskArgs.index} removed for user ${taskArgs.account}`);
    });

// Task to get the list of cars for a user
userScope.task("get-cars", "Get the list of cars for a user")
    .addParam("account", "The address of the user")
    .setAction(async (taskArgs, hre) => {
        const { instance: user } = await loadContract("User", hre);
        const cars = await user.getCars(taskArgs.account);
        console.log("Cars:", cars);
    });

// Task to update company information for a user
userScope.task("update-company-info", "Update company information for a user")
    .addParam("account", "The address of the user")
    .setAction(async (taskArgs, hre) => {
        const { instance: user } = await loadContract("User", hre);
        const questions = [
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
            name: answers.name,
            description: answers.description,
            inn: answers.inn,
            kpp: answers.kpp,
            ogrn: answers.ogrn,
            bank_account: answers.bank_account,
            bank_name: answers.bank_name,
            bank_bik: answers.bank_bik,
            bank_corr_account: answers.bank_corr_account,
            bank_inn: answers.bank_inn,
            bank_kpp_account: answers.bank_kpp_account
        };
        const tx = await user.updateCompanyInfo(taskArgs.account, companyData);
        await tx.wait();
        console.log(`Company information updated for user ${taskArgs.account}`);
    });

// Task to get company information for a user
userScope.task("get-company-info", "Get the company information for a user")
    .addParam("account", "The address of the user")
    .setAction(async (taskArgs, hre) => {
        const { instance: user } = await loadContract("User", hre);
        const companyInfo = await user.getCompanyInfo(taskArgs.account);


        console.log("Company information:")
        console.log(`   Name: ${companyInfo.name}`)
        console.log(`   Description: ${companyInfo.description}`)
        console.log(`   INN: ${companyInfo.inn}`)
        console.log(`   KPP: ${companyInfo.kpp}`)
        console.log(`   OGRN: ${companyInfo.ogrn}`)
        console.log(`   Bank account: ${companyInfo.bank_account}`)
        console.log(`   Bank name: ${companyInfo.bank_name}`)
        console.log(`   Bank bik: ${companyInfo.bank_bik}`)
        console.log(`   Bank corr account: ${companyInfo.bank_corr_account}`)
        console.log(`   Bank inn: ${companyInfo.bank_inn}`)
        console.log(`   Bank kpp account: ${companyInfo.bank_kpp_account}`)


    });