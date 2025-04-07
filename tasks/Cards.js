const cardsScope = scope("Cards", "Tasks for Cards module");
const { getEventArguments } = require("../utils/utils");
const inquirer = require("inquirer");
const { loadConfig } = require("./helpers/configs")
const { loadContract } = require("./helpers/load_contract");
const { encryptAESGCM } = require("./helpers/encrypt_aes");
const { accountSelection, partnerSelection } = require("./helpers/promt_selection");

cardsScope.task("version", "Get contract version")
    .setAction(async (_, hre) => {
        const { instance: cards } = await loadContract("Cards",hre);
        const version = await cards.getVersion();
        console.log(`Version: ${version}`);
    });

// Task to upgrade of the Cards contract
cardsScope.task("upgrade", "Upgrade of the Cards contract")
    .setAction(async (taskArgs, hre) => {
        const { instance: cards } = await loadContract("Cards", hre);

        try {
            const contractFactory = await ethers.getContractFactory("Cards")
            const deploy = await upgrades.upgradeProxy(cards.target, contractFactory)

            await deploy.waitForDeployment()
            console.log("Success upgrade")
        } catch (error) {
            console.log("Failed upgrade: ", error)
        }

    });

// Task to deploy of the Cards contract
cardsScope.task("deploy", "Deploy of the Cards contract")
    .setAction(async (taskArgs, hre) => {
        const config = await loadConfig("config")
        const signer = await accountSelection(hre);
        const partner_id = await partnerSelection();

        if (typeof config?.deployed?.Hub == "undefined")
            throw new Error("Hub not deployed")

        try {
            const contractFactory = await ethers.getContractFactory("Cards")
            const contractFactorySigner = contractFactory.connect(signer);
            const deploy = await upgrades.deployProxy(contractFactorySigner, [partner_id,config.deployed.Hub], { initializer: "initialize" })

            const deployed = await deploy.waitForDeployment()
            console.log("Success deploy with address:", deployed.target)
        } catch (error) {
            console.log("Failed deploy: ", error)
        }

    });


cardsScope.task("add-card-request", "Initiate card addition request")
    .setAction(async (_, hre) => {
        const { instance: cards } = await loadContract("Cards",hre);
        const tx = await cards.addCardRequest();
        const eventArgs = await getEventArguments(tx, "AddCardRequest");

        console.log(`AddCardRequest tx hash: ${tx.hash}`);

        if (eventArgs) {
            console.log("AddCardRequest event:", {
                account: eventArgs.account,
                request_id: eventArgs.request_id.toString()
            });
        }
    });

cardsScope.task("add-card-response", "Admin response to card request")
    .setAction(async (_, hre) => {
        const { instance: cards } = await loadContract("Cards",hre);
        const answers = await inquirer.prompt([
            { name: 'account', message: 'User address:' },
            { name: 'request_id', message: 'Request ID:', type: 'number' },
            { name: 'status', message: 'Status (true/false):', type: 'confirm' },
            { name: 'message', message: 'Response message:' },
            { name: 'payment_endpoint', message: 'Payment endpoint URL:' }
        ]);

        const tx = await cards.addCardResponse(
            answers.account,
            answers.request_id,
            answers.status,
            answers.message,
            answers.payment_endpoint
        );
        const eventArgs = await getEventArguments(tx, "AddCardResponse");

        console.log(`AddCardResponse tx hash: ${tx.hash}`);
        if (eventArgs) {
            console.log("AddCardResponse event:", {
                account: eventArgs.account,
                request_id: eventArgs.request_id.toString(),
                status: eventArgs.status,
                message: eventArgs.message,
                payment_endpoint: eventArgs.payment_endpoint
            });
        }
    });

cardsScope.task("add-card", "Add card to user account (admin)")
    .setAction(async (_, hre) => {
        const { instance: cards } = await loadContract("Cards",hre);
        const baseAnswers = await inquirer.prompt([
            { name: 'account', message: 'User address:' },
            { name: 'request_id', message: 'Request ID:', type: 'number' }
        ]);

        const cardAnswers = await inquirer.prompt([
            { name: 'rebill_id', message: 'Rebill ID:' },
            { name: 'provider', message: 'Provider name:' },
            { name: 'card_type', message: 'Card type:' },
            { name: 'card_number', message: 'Masked card number:' },
            { name: 'expire_date', message: 'Expire Date:' },
        ]);

        const tx = await cards.addCard(
            baseAnswers.account,
            baseAnswers.request_id,
            {
                rebill_id: cardAnswers.rebill_id,
                provider: cardAnswers.provider,
                card_type: cardAnswers.card_type,
                card_number: cardAnswers.card_number,
                expire_date: cardAnswers.expire_date
            }
        );
        const eventArgs = await getEventArguments(tx, "AddCardSuccess");

        console.log(`AddCard tx hash: ${tx.hash}`);
        if (eventArgs) {
            console.log("AddCardSuccess event:", {
                account: eventArgs.account,
                request_id: eventArgs.request_id.toString(),
                card_id: eventArgs.card_id.toString()
            });
        }
    });

cardsScope.task("writeoff-request", "Initiate write-off request")
    .setAction(async (_, hre) => {
        const { instance: cards } = await loadContract("Cards",hre);
        const answer = await inquirer.prompt([
            {
                name: 'amount',
                message: 'Amount to write off (ETH):'
            },
            {
                name: 'aeskey',
                message: 'Aes key:'
            },
        ]);

        const amount = await encryptAESGCM(answer.amount, answer.aeskey)

        const tx = await cards.writeOffRequest("e:"+amount);
        const eventArgs = await getEventArguments(tx, "WriteOffRequest");

        console.log(`WriteOff requested: ${tx.hash}`);
        if (eventArgs) {
            console.log("WriteOffRequest event:", {
                account: eventArgs.account,
                request_id: eventArgs.request_id.toString(),
                card_id: eventArgs.card_id,
                amount: eventArgs.amount
            });
        }
    });

cardsScope.task("writeoff-response", "Respond to write-off request")
    .setAction(async (_, hre) => {
        const { instance: cards } = await loadContract("Cards",hre);
        const answers = await inquirer.prompt([
            { name: 'account', message: 'User address:' },
            { name: 'request_id', message: 'Request ID:', type: 'number' },
            { name: 'card_id', message: 'Card ID used:' },
            { name: 'error_code', message: 'Bank error code:', type: 'number' },
            { name: 'status', message: 'Success status:', type: 'confirm' },
            { name: 'message', message: 'Response message:' },
            { name: 'amount', message: 'Processed amount:' }
        ]);

        const tx = await cards.writeOffResponse(
            answers.account,
            answers.request_id,
            answers.card_id,
            answers.error_code,
            answers.status,
            answers.message,
            answers.amount
        );
        const eventArgs = await getEventArguments(tx, "WriteOffResponse");

        console.log(`WriteOff response sent: ${tx.hash}`);
        if (eventArgs) {
            console.log("WriteOffResponse event:", {
                account: eventArgs.account,
                request_id: eventArgs.request_id.toString(),
                card_id: eventArgs.card_id,
                error_code: eventArgs.error_code.toString(),
                status: eventArgs.status,
                message: eventArgs.message,
                amount: eventArgs.amount
            });
        }
    });


cardsScope.task("set-auto-pay", "Configure autopay settings")
    .setAction(async (_, hre) => {
        const { instance: cards } = await loadContract("Cards",hre);
        const answers = await inquirer.prompt([
            { name: 'amount', message: 'Amount in ETH:' },
            { name: 'monthly_limit', message: 'Monthly limit in ETH:' },
            { name: 'threshold', message: 'Threshold in ETH:' }
        ]);

        const tx = await cards.setAutoPaySettings(
            hre.ethers.parseEther(answers.amount),
            hre.ethers.parseEther(answers.monthly_limit),
            hre.ethers.parseEther(answers.threshold)
        );
        console.log(`AutoPay configured: ${tx.hash}`);
    });

cardsScope.task("disable-auto-pay", "Disable autopay")
    .setAction(async (_, hre) => {
        const { instance: cards } = await loadContract("Cards",hre);
        const tx = await cards.disableAutoPay();
        console.log(`Autopay disabled: ${tx.hash}`);
    });

cardsScope.task("remove-card", "Remove user card")
    .setAction(async (_, hre) => {
        const { instance: cards } = await loadContract("Cards",hre);
        const answer = await inquirer.prompt({
            name: 'index',
            message: 'Card id to remove:',
            type: 'string'
        });

        try {
            const tx = await cards.removeCard(answer.index);
            console.log(`Card removed: ${tx.hash}`);
        } catch (error) {
            const decodedError = cards.interface.parseError(error.data);
            console.log("Decoded error:", decodedError);
        }

    });

cardsScope.task("list-cards", "List user cards")
    .setAction(async (_, hre) => {
        const { instance: cards } = await loadContract("Cards",hre);
        const answer = await inquirer.prompt({
            name: 'account',
            message: 'User address:'
        });



        try {
            const cardList = await cards.getCards(answer.account);
            console.log('User cards:', cardList);
        } catch (error) {
            const decodedError = cards.interface.parseError(error.data);
            console.log("Decoded error:", decodedError);
        }
    });

cardsScope.task("get-auto-pay", "Get autopay settings")
    .setAction(async (_, hre) => {
        const { instance: cards } = await loadContract("Cards",hre);
        const answer = await inquirer.prompt({
            name: 'account',
            message: 'User address:'
        });



        try {
            const settings = await cards.getAutoPaymentSettings(answer.account);
            console.log('Autopay settings:', {
                amount: hre.ethers.formatEther(settings.amount),
                monthly_limit: hre.ethers.formatEther(settings.monthly_limit),
                threshold: hre.ethers.formatEther(settings.threshold),
                is_active: settings.is_active
            });
        } catch (error) {
            const decodedError = cards.interface.parseError(error.data);
            console.log("Decoded error:", decodedError);
        }
    });