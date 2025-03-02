const balanceScope = scope("Balance", "Tasks for Balance module");
const { loadContract } = require("./helpers/load_contract");
const inquirer = require("inquirer");



balanceScope.task("version", "Get contract version")
    .setAction(async (_, hre) => {
        const { instance: balance } = await loadContract("Balance",hre);
        const version = await balance.getVersion();
        console.log(`Version: ${version}`);
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
        const tx = await balance.transferFrom(from, to, ethers.parseEther(value));
        await tx.wait();
        console.log(`Transfer From successful. TX hash: ${tx.hash}`);
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

        const { instance: balance } = await loadContract("Balance",hre);
        const tx = await balance.mint(account, ethers.parseEther(amount));
        await tx.wait();
        console.log(`Mint successful. TX hash: ${tx.hash}`);
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

        const { instance: balance } = await loadContract("Balance",hre);
        const tx = await balance.burn(account, ethers.parseEther(amount));
        await tx.wait();
        console.log(`Burn successful. TX hash: ${tx.hash}`);
    });    