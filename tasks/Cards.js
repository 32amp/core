const cardsScope = scope("Cards", "Tasks for Cards module");
const { getEventArguments } = require("../utils/utils");
const { loadConfig } = require("./helpers/configs")
const { accountSelection, partnerSelection } = require("./helpers/promt_selection");
const inquirer = require("inquirer");


// Helper function to initialize the Cards contract
async function getCardsContract(hre) {
    const config = await loadConfig("config");
    if (typeof config?.deployed?.Hub === "undefined") {
        throw new Error("Hub not deployed");
    }
    const signer = await accountSelection(hre);
    const hub = await hre.ethers.getContractAt("Hub", config.deployed.Hub, signer);
    const partner_id = await partnerSelection();
    const exist = await hub.getModule("Cards", partner_id);
    if (exist === hre.ethers.ZeroAddress) {
        throw new Error(`Module Cards does not exist for partner_id ${partner_id}`);
    }
    const cards = await hre.ethers.getContractAt("Cards", exist, signer);
    return { cards, partner_id, signer };
}


cardsScope.task("add-card-request", "Initiate card addition request")
    .setAction(async (_, hre) => {
        const { cards } = await getCardsContract(hre);
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
        const { cards } = await getCardsContract(hre);
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
        const { cards } = await getCardsContract(hre);
        const baseAnswers = await inquirer.prompt([
            { name: 'account', message: 'User address:' },
            { name: 'request_id', message: 'Request ID:', type: 'number' }
        ]);

        const cardAnswers = await inquirer.prompt([
            { name: 'rebill_id', message: 'Rebill ID:' },
            { name: 'provider', message: 'Provider name:' },
            { name: 'card_id', message: 'Card ID:' },
            { name: 'card_number', message: 'Masked card number:' },
            { name: 'is_primary', message: 'Set as primary?', type: 'confirm' }
        ]);

        const tx = await cards.addCard(
            baseAnswers.account,
            baseAnswers.request_id,
            {
                rebill_id: cardAnswers.rebill_id,
                provider: cardAnswers.provider,
                card_id: cardAnswers.card_id,
                card_number: cardAnswers.card_number,
                is_primary: cardAnswers.is_primary
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
        const { cards } = await getCardsContract(hre);
        const answer = await inquirer.prompt({
            name: 'amount',
            message: 'Amount to write off (ETH):'
        });

        const tx = await cards.writeOffRequest(answer.amount);
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
        const { cards } = await getCardsContract(hre);
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
        const { cards } = await getCardsContract(hre);
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
        const { cards } = await getCardsContract(hre);
        const tx = await cards.disableAutoPay();
        console.log(`Autopay disabled: ${tx.hash}`);
    });

cardsScope.task("remove-card", "Remove user card")
    .setAction(async (_, hre) => {
        const { cards } = await getCardsContract(hre);
        const answer = await inquirer.prompt({
            name: 'index',
            message: 'Card index to remove:',
            type: 'number'
        });

        const tx = await cards.removeCard(answer.index);
        console.log(`Card removed: ${tx.hash}`);
    });

cardsScope.task("list-cards", "List user cards")
    .setAction(async (_, hre) => {
        const { cards } = await getCardsContract(hre);
        const answer = await inquirer.prompt({
            name: 'account',
            message: 'User address:'
        });

        const cardList = await cards.getCards(answer.account);
        console.log('User cards:', cardList);
    });

cardsScope.task("get-auto-pay", "Get autopay settings")
    .setAction(async (_, hre) => {
        const { cards } = await getCardsContract(hre);
        const answer = await inquirer.prompt({
            name: 'account',
            message: 'User address:'
        });

        const settings = await cards.getAutoPaymentSettings(answer.account);
        console.log('Autopay settings:', {
            amount: hre.ethers.formatEther(settings.amount),
            monthly_limit: hre.ethers.formatEther(settings.monthly_limit),
            threshold: hre.ethers.formatEther(settings.threshold),
            is_active: settings.is_active
        });
    });