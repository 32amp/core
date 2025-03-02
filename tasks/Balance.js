const balanceScope = scope("Balance", "Tasks for Balance module");
const { loadConfig } = require("./helpers/configs")
const { accountSelection, partnerSelection } = require("./helpers/promt_selection");
const inquirer = require("inquirer");


// Helper function to initialize the Balance contract
async function getBalanceContract(hre) {
    const config = await loadConfig("config");
    if (typeof config?.deployed?.Hub === "undefined") {
        throw new Error("Hub not deployed");
    }
    const signer = await accountSelection(hre);
    const hub = await hre.ethers.getContractAt("Hub", config.deployed.Hub, signer);
    const partner_id = await partnerSelection();
    const exist = await hub.getModule("Balance", partner_id);
    if (exist === hre.ethers.ZeroAddress) {
        throw new Error(`Module Balance does not exist for partner_id ${partner_id}`);
    }
    const balance = await hre.ethers.getContractAt("Balance", exist, signer);
    return { balance, partner_id, signer };
}



balanceScope.task("version", "Get contract version")
    .setAction(async (_, hre) => {
        const { balance } = await getBalanceContract(hre);
        const version = await balance.getVersion();
        console.log(`Version: ${version}`);
    });

balanceScope
    .task("total-supply", "Retrieves the total token supply")
    .setAction(async (_, hre) => {
        const { balance } = await getBalanceContract(hre);
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

        const { balance } = await getBalanceContract(hre);

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

        const { balance } = await getBalanceContract(hre);
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

        const { balance } = await getBalanceContract(hre);
        const tx = await balance.transferFrom(from, to, ethers.parseEther(value));
        await tx.wait();
        console.log(`Transfer From successful. TX hash: ${tx.hash}`);
    });

balanceScope
    .task("get-currency", "Retrieves the currency ID associated with the contract")
    .setAction(async (_, hre) => {
        const { balance } = await getBalanceContract(hre);
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

        const { balance } = await getBalanceContract(hre);
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

        const { balance } = await getBalanceContract(hre);
        const tx = await balance.burn(account, ethers.parseEther(amount));
        await tx.wait();
        console.log(`Burn successful. TX hash: ${tx.hash}`);
    });    