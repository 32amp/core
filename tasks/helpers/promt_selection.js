const inquirer = require("inquirer");
const { loadConfig } = require("./configs")
const {loadAdditionalAccounts} = require("./manage_additional_accounts")

async function accountSelection(hre) {
    const signers = await hre.ethers.getSigners();
    if (!signers.length) throw new Error("No accounts available");
    const additionalAccounts = await loadAdditionalAccounts(hre)

    const addressMap = await Promise.all(
        signers.concat(additionalAccounts).map(async (signer, index) => ({
            name: `${index + 1}. ${await signer.getAddress()}`,
            value: signer
        }))
    );

    const response = await inquirer.prompt([
        {
            type: "list",
            name: "selectedAccount",
            message: "Select account:",
            choices: addressMap
        }
    ]);

    return response.selectedAccount;
}

async function partnerSelection() {
    const config = await loadConfig("config")

    if (!config.partners.length) throw new Error("No partners available");


    const partners = await Promise.all(
        config.partners.map(async (partner, index) => ({
            name: `${index + 1}. ${partner.name}`,
            value: partner.id
        }))
    );

    const response = await inquirer.prompt([
        {
            type: "list",
            name: "selectedPartner",
            message: "Select partner:",
            choices: partners
        }
    ]);

    return response.selectedPartner;

}



async function currencySelection(hre) {
    const config = await loadConfig("config")

    if (typeof config?.deployed?.Currencies == "undefined" ) throw new Error("Contract Currencies not deployed");

    const currenciesContract =  await hre.ethers.getContractAt("Currencies", config.deployed.Currencies);
    const currencies = await currenciesContract.list();

    const currenciesMap = await Promise.all(
        currencies.map(async (currency, index) => ({
            name: `${index + 1}. ${currency.currency}`,
            value: index + 1
        }))
    );

    const response = await inquirer.prompt([
        {
            type: "list",
            name: "selectedCurrency",
            message: "Select currency:",
            choices: currenciesMap
        }
    ]);

    return response.selectedCurrency;
}


module.exports.accountSelection = accountSelection;
module.exports.partnerSelection = partnerSelection;
module.exports.currencySelection = currencySelection;