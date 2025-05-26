const balanceScope = scope("Balance", "Tasks for Balance module");
const { loadContract } = require("./helpers/load_contract");
const { accountSelection, partnerSelection, currencySelection } = require("./helpers/promt_selection");
const { loadConfig } = require("./helpers/configs");
const inquirer = require("inquirer");




balanceScope.task("version", "Get contract version")
    .setAction(async (_, hre) => {
        const { instance: balance } = await loadContract("Balance",hre);
        const version = await balance.getVersion();
        console.log(`Version: ${version}`);
    });

// Task to upgrade of the Balance contract
balanceScope.task("upgrade", "Upgrade of the Balance contract")
    .setAction(async (taskArgs, hre) => {
        const { instance: balance } = await loadContract("Balance", hre);

        try {
            const contractFactory = await ethers.getContractFactory("Balance")
            const deploy = await upgrades.upgradeProxy(balance.target, contractFactory)

            await deploy.waitForDeployment()
            console.log("Success upgrade")
        } catch (error) {
            console.log("Failed upgrade: ", error)
        }

    });


// Task to deploy of the Balance contract
balanceScope
    .task("deploy", "Deploy of the Balance contract")
    .setAction(async (taskArgs, hre) => {
        const config = await loadConfig("config")
        const signer = await accountSelection(hre);
        const partner_id = await partnerSelection();
        const currency = await currencySelection(hre);

        if (typeof config?.deployed?.Hub == "undefined")
            throw new Error("Hub not deployed")

        try {
            const contractFactory = await ethers.getContractFactory("Balance")
            const contractFactorySigner = contractFactory.connect(signer);
            const deploy = await upgrades.deployProxy(contractFactorySigner, [partner_id,config.deployed.Hub, currency], { initializer: "initialize" })

            const deployed = await deploy.waitForDeployment()
            console.log("Success deploy with address:", deployed.target)
        } catch (error) {
            console.log("Failed deploy: ", error)
        }

    });



balanceScope
    .task("total-supply", "Retrieves the total token supply")
    .setAction(async (_, hre) => {
        const { instance: balance } = await loadContract("Balance",hre);
        const total = await balance.totalSupply();
        console.log(`Total Supply: ${ethers.formatEther(total)}`);
    });

balanceScope
    .task("balance-of", "Gets the token balance of a specific account")
    .addOptionalParam("account", "The address to query the balance for")
    .setAction(async (args, hre) => {
        let { account } = args;
        if (!account) {
            const answer = await inquirer.prompt([{
                type: "input",
                name: "account",
                message: "Enter account address:",
                validate: input => hre.ethers.isAddress(input)
                    ? true
                    : "Invalid address format"
            }]);
            account = answer.account;
        }

        const { instance: balance } = await loadContract("Balance",hre);

        try {
            const result = await balance.balanceOf(account);
            console.log(`Balance: ${ethers.formatEther(result)}`);
        } catch (error) {
            const decodedError = balance.interface.parseError(error.data);
            console.log("Decoded error:", decodedError);
        }
        
        
    });

balanceScope
    .task("transfer", "Transfers tokens to a specified address")
    .addOptionalParam("to", "Recipient address")
    .addOptionalParam("value", "Amount to transfer in eth, (example: 1.34) ")
    .setAction(async (args, hre) => {
        let { to, value } = args;
        const prompts = [];

        if (!to) {
            prompts.push({
                type: "input",
                name: "to",
                message: "Enter recipient address:",
                validate: input => hre.ethers.isAddress(input)
                    ? true
                    : "Invalid address format"
            });
        }

        if (!value) {
            prompts.push({
                type: "input",
                name: "value",
                message: "Enter amount to transfer:",
                validate: input => {
                    try {
                        ethers.parseEther(input);
                        return true;
                    } catch {
                        return "Invalid ether format";
                    }
                }
            });
        }

        if (prompts.length > 0) {
            const answers = await inquirer.prompt(prompts);
            to = to || answers.to;
            value = value || answers.value;
        }

        const { instance: balance } = await loadContract("Balance",hre);
        const tx = await balance.transfer(to, ethers.parseEther(value));
        await tx.wait();
        console.log(`Transfer successful. TX hash: ${tx.hash}`);


        try {
            const { instance: balance } = await loadContract("Balance",hre);
            const tx = await balance.transfer(to, ethers.parseEther(value));
            await tx.wait();
            console.log(`Transfer successful. TX hash: ${tx.hash}`);
        } catch (error) {
            const decodedError = balance.interface.parseError(error.data);
            console.log("Decoded error:", decodedError);
        }
    });

balanceScope
    .task("transfer-from", "Transfers tokens from a specified address")
    .addOptionalParam("from", "Sender address")
    .addOptionalParam("to", "Recipient address")
    .addOptionalParam("value", "Amount to transfer in eth, (example: 1.34) ")
    .setAction(async (args, hre) => {
        let { from, to, value } = args;
        const prompts = [];

        if (!from) {
            prompts.push({
                type: "input",
                name: "from",
                message: "Enter sender address:",
                validate: input => hre.ethers.isAddress(input)
                    ? true
                    : "Invalid address format"
            });
        }

        if (!to) {
            prompts.push({
                type: "input",
                name: "to",
                message: "Enter recipient address:",
                validate: input => hre.ethers.isAddress(input)
                    ? true
                    : "Invalid address format"
            });
        }

        if (!value) {
            prompts.push({
                type: "input",
                name: "value",
                message: "Enter amount to transfer:",
                validate: input => {
                    try {
                        ethers.parseEther(input);
                        return true;
                    } catch {
                        return "Invalid ether format";
                    }
                }
            });
        }

        if (prompts.length > 0) {
            const answers = await inquirer.prompt(prompts);
            from = from || answers.from;
            to = to || answers.to;
            value = value || answers.value;
        }

        const { instance: balance } = await loadContract("Balance",hre);

        try {

            const tx = await balance.transferFrom(from, to, ethers.parseEther(value));
            await tx.wait();
            console.log(`Transfer From successful. TX hash: ${tx.hash}`);
        } catch (error) {
            const decodedError = balance.interface.parseError(error.data);
            console.log("Decoded error:", decodedError);
        }
    });

balanceScope
    .task("get-currency", "Retrieves the currency ID associated with the contract")
    .setAction(async (_, hre) => {
        const { instance: balance } = await loadContract("Balance",hre);
        const currencyId = await balance.getCurrency();
        console.log(`Currency ID: ${currencyId.toString()}`);
    });


balanceScope
    .task("mint", "Mints new tokens to specified account. Only admin have access")
    .addOptionalParam("account", "Recipient address")
    .addOptionalParam("amount", "Amount to mint in eth, (example: 1.34) ")
    .setAction(async (args, hre) => {
        let { account, amount } = args;
        const prompts = [];

        if (!account) {
            prompts.push({
                type: "input",
                name: "account",
                message: "Enter recipient address:",
                validate: input => hre.ethers.isAddress(input)
                    ? true
                    : "Invalid address format"
            });
        }

        if (!amount) {
            prompts.push({
                type: "input",
                name: "amount",
                message: "Enter mint amount:",
                validate: input => {
                    try {
                        ethers.parseEther(input);
                        return true;
                    } catch {
                        return "Invalid ether format";
                    }
                }
            });
        }

        if (prompts.length > 0) {
            const answers = await inquirer.prompt(prompts);
            account = account || answers.account;
            amount = amount || answers.amount;
        }



        try {
            const { instance: balance } = await loadContract("Balance",hre);
            const tx = await balance.mint(account, ethers.parseEther(amount));
            await tx.wait();
            console.log(`Mint successful. TX hash: ${tx.hash}`);
        } catch (error) {
            const decodedError = balance.interface.parseError(error.data);
            console.log("Decoded error:", decodedError);
        }
    });

balanceScope
    .task("burn", "Burns tokens from specified account. Only admin have access")
    .addOptionalParam("account", "Holder address")
    .addOptionalParam("amount", "Amount to burn in eth, (example: 1.34) ")
    .setAction(async (args, hre) => {
        let { account, amount } = args;
        const prompts = [];

        if (!account) {
            prompts.push({
                type: "input",
                name: "account",
                message: "Enter holder address:",
                validate: input => hre.ethers.isAddress(input)
                    ? true
                    : "Invalid address format"
            });
        }

        if (!amount) {
            prompts.push({
                type: "input",
                name: "amount",
                message: "Enter burn amount:",
                validate: input => {
                    try {
                        ethers.parseEther(input);
                        return true;
                    } catch {
                        return "Invalid ether format";
                    }
                }
            });
        }

        if (prompts.length > 0) {
            const answers = await inquirer.prompt(prompts);
            account = account || answers.account;
            amount = amount || answers.amount;
        }



        try {
            const { instance: balance } = await loadContract("Balance",hre);
            const tx = await balance.burn(account, ethers.parseEther(amount));
            await tx.wait();
            console.log(`Burn successful. TX hash: ${tx.hash}`);
        } catch (error) {
            const decodedError = balance.interface.parseError(error.data);
            console.log("Decoded error:", decodedError);
        }
    });    

balanceScope
.task("balance-history")
.addOptionalParam("account", "The address to query the balance for")
.setAction(async (args, hre) => {
    let { account } = args;
    if (!account) {
        const answer = await inquirer.prompt([{
            type: "input",
            name: "account",
            message: "Enter account address:",
            validate: input => hre.ethers.isAddress(input)
                ? true
                : "Invalid address format"
        }]);
        account = answer.account;
    }

    const { instance: balance } = await loadContract("Balance",hre);

    let query = balance.filters.Transfer(hre.ethers.ZeroAddress, account)
    let events = await balance.queryFilter(query, null,null)

    for (let index = 0; index < events.length; index++) {
        const event = events[index];

        let date = new Date( (await ethers.provider.getBlock(event.blockNumber)).timestamp*1000);

        console.log("=====================")
        console.log("Date", date.toISOString())
        console.log("From: ", event.args[0])
        console.log("To: ", event.args[1])
        console.log("Amount: ", hre.ethers.formatEther(event.args[2]))
        console.log("From amount: ", hre.ethers.formatEther(event.args[3]))
        console.log("To amount: ", hre.ethers.formatEther(event.args[4]))
        console.log("")
    }
})