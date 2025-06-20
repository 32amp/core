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

async function capitalsBounds(){
    const capitalsBounds = {
        // ===== CIS Countries =====
        "Moscow": { sw: { lat: 55.55, lng: 37.35 }, ne: { lat: 55.95, lng: 37.85 } },
        "Minsk": { sw: { lat: 53.70, lng: 27.30 }, ne: { lat: 54.10, lng: 27.90 } },
        "Kyiv": { sw: { lat: 50.20, lng: 30.20 }, ne: { lat: 50.70, lng: 30.80 } },
        "Astana": { sw: { lat: 51.00, lng: 71.20 }, ne: { lat: 51.40, lng: 71.60 } },
        "Bishkek": { sw: { lat: 42.70, lng: 74.40 }, ne: { lat: 43.00, lng: 74.80 } },
        "Tashkent": { sw: { lat: 41.20, lng: 69.10 }, ne: { lat: 41.40, lng: 69.40 } },
        "Dushanbe": { sw: { lat: 38.40, lng: 68.60 }, ne: { lat: 38.70, lng: 68.90 } },
        "Yerevan": { sw: { lat: 40.00, lng: 44.40 }, ne: { lat: 40.30, lng: 44.60 } },
        "Baku": { sw: { lat: 40.30, lng: 49.70 }, ne: { lat: 40.50, lng: 49.90 } },
        "Chisinau": { sw: { lat: 46.90, lng: 28.70 }, ne: { lat: 47.10, lng: 28.90 } },
    
        // ===== European Union (all 27 members) =====
        "Vienna": { sw: { lat: 48.10, lng: 16.20 }, ne: { lat: 48.30, lng: 16.50 } },
        "Brussels": { sw: { lat: 50.80, lng: 4.20 }, ne: { lat: 50.90, lng: 4.50 } },
        "Sofia": { sw: { lat: 42.60, lng: 23.20 }, ne: { lat: 42.80, lng: 23.40 } },
        "Zagreb": { sw: { lat: 45.70, lng: 15.90 }, ne: { lat: 45.90, lng: 16.20 } },
        "Nicosia": { sw: { lat: 35.10, lng: 33.20 }, ne: { lat: 35.20, lng: 33.40 } },
        "Prague": { sw: { lat: 50.00, lng: 14.20 }, ne: { lat: 50.20, lng: 14.60 } },
        "Copenhagen": { sw: { lat: 55.60, lng: 12.40 }, ne: { lat: 55.80, lng: 12.70 } },
        "Tallinn": { sw: { lat: 59.30, lng: 24.60 }, ne: { lat: 59.50, lng: 24.80 } },
        "Helsinki": { sw: { lat: 60.10, lng: 24.80 }, ne: { lat: 60.20, lng: 25.00 } },
        "Paris": { sw: { lat: 48.65, lng: 2.00 }, ne: { lat: 49.05, lng: 2.75 } },
        "Berlin": { sw: { lat: 52.30, lng: 13.00 }, ne: { lat: 52.70, lng: 13.80 } },
        "Athens": { sw: { lat: 37.90, lng: 23.60 }, ne: { lat: 38.10, lng: 23.80 } },
        "Budapest": { sw: { lat: 47.40, lng: 18.90 }, ne: { lat: 47.60, lng: 19.20 } },
        "Dublin": { sw: { lat: 53.20, lng: -6.40 }, ne: { lat: 53.40, lng: -6.10 } },
        "Rome": { sw: { lat: 41.80, lng: 12.40 }, ne: { lat: 42.00, lng: 12.60 } },
        "Riga": { sw: { lat: 56.80, lng: 24.00 }, ne: { lat: 57.00, lng: 24.20 } },
        "Vilnius": { sw: { lat: 54.60, lng: 25.10 }, ne: { lat: 54.80, lng: 25.40 } },
        "Luxembourg": { sw: { lat: 49.50, lng: 6.00 }, ne: { lat: 49.70, lng: 6.20 } },
        "Valletta": { sw: { lat: 35.85, lng: 14.45 }, ne: { lat: 35.95, lng: 14.55 } },
        "Amsterdam": { sw: { lat: 52.30, lng: 4.70 }, ne: { lat: 52.40, lng: 5.00 } },
        "Warsaw": { sw: { lat: 52.10, lng: 20.80 }, ne: { lat: 52.30, lng: 21.20 } },
        "Lisbon": { sw: { lat: 38.70, lng: -9.20 }, ne: { lat: 38.80, lng: -9.00 } },
        "Bucharest": { sw: { lat: 44.30, lng: 26.00 }, ne: { lat: 44.50, lng: 26.20 } },
        "Bratislava": { sw: { lat: 48.10, lng: 17.00 }, ne: { lat: 48.20, lng: 17.20 } },
        "Ljubljana": { sw: { lat: 46.00, lng: 14.40 }, ne: { lat: 46.10, lng: 14.60 } },
        "Madrid": { sw: { lat: 40.30, lng: -3.80 }, ne: { lat: 40.50, lng: -3.60 } },
        "Stockholm": { sw: { lat: 59.20, lng: 17.90 }, ne: { lat: 59.40, lng: 18.20 } },
    
        // ===== United States (State Capitals) =====
        "Washington, D.C.": { sw: { lat: 38.70, lng: -77.20 }, ne: { lat: 39.10, lng: -76.80 } },
        "Montgomery": { sw: { lat: 32.30, lng: -86.40 }, ne: { lat: 32.40, lng: -86.20 } },
        "Juneau": { sw: { lat: 58.20, lng: -134.50 }, ne: { lat: 58.40, lng: -134.20 } },
        "Phoenix": { sw: { lat: 33.30, lng: -112.20 }, ne: { lat: 33.60, lng: -111.90 } },
        "Little Rock": { sw: { lat: 34.70, lng: -92.40 }, ne: { lat: 34.80, lng: -92.20 } },
        "Sacramento": { sw: { lat: 38.40, lng: -121.60 }, ne: { lat: 38.60, lng: -121.40 } },
        "Denver": { sw: { lat: 39.60, lng: -105.10 }, ne: { lat: 39.80, lng: -104.90 } },
        "Hartford": { sw: { lat: 41.70, lng: -72.80 }, ne: { lat: 41.80, lng: -72.60 } },
        "Dover": { sw: { lat: 39.10, lng: -75.60 }, ne: { lat: 39.20, lng: -75.40 } },
        "Tallahassee": { sw: { lat: 30.40, lng: -84.30 }, ne: { lat: 30.50, lng: -84.20 } },
        "Atlanta": { sw: { lat: 33.60, lng: -84.50 }, ne: { lat: 33.80, lng: -84.30 } },
        "Honolulu": { sw: { lat: 21.25, lng: -157.90 }, ne: { lat: 21.35, lng: -157.80 } },
        "Boise": { sw: { lat: 43.50, lng: -116.30 }, ne: { lat: 43.70, lng: -116.10 } },
        "Springfield": { sw: { lat: 39.70, lng: -89.70 }, ne: { lat: 39.90, lng: -89.50 } },
        "Indianapolis": { sw: { lat: 39.70, lng: -86.20 }, ne: { lat: 39.90, lng: -86.00 } },
        "Des Moines": { sw: { lat: 41.50, lng: -93.70 }, ne: { lat: 41.60, lng: -93.50 } },
        "Topeka": { sw: { lat: 39.00, lng: -95.80 }, ne: { lat: 39.10, lng: -95.60 } },
        "Frankfort": { sw: { lat: 38.10, lng: -84.90 }, ne: { lat: 38.30, lng: -84.80 } },
        "Baton Rouge": { sw: { lat: 30.40, lng: -91.20 }, ne: { lat: 30.50, lng: -91.00 } },
        "Augusta": { sw: { lat: 44.20, lng: -69.80 }, ne: { lat: 44.40, lng: -69.70 } },
        "Annapolis": { sw: { lat: 38.90, lng: -76.60 }, ne: { lat: 39.00, lng: -76.40 } },
        "Boston": { sw: { lat: 42.30, lng: -71.10 }, ne: { lat: 42.40, lng: -71.00 } },
        "Lansing": { sw: { lat: 42.60, lng: -84.60 }, ne: { lat: 42.80, lng: -84.40 } },
        "Saint Paul": { sw: { lat: 44.90, lng: -93.20 }, ne: { lat: 45.00, lng: -93.00 } },
        "Jackson": { sw: { lat: 32.20, lng: -90.30 }, ne: { lat: 32.40, lng: -90.10 } },
        "Jefferson City": { sw: { lat: 38.50, lng: -92.20 }, ne: { lat: 38.60, lng: -92.00 } },
        "Helena": { sw: { lat: 46.50, lng: -112.10 }, ne: { lat: 46.60, lng: -112.00 } },
        "Lincoln": { sw: { lat: 40.70, lng: -96.80 }, ne: { lat: 40.90, lng: -96.60 } },
        "Carson City": { sw: { lat: 39.10, lng: -119.80 }, ne: { lat: 39.20, lng: -119.70 } },
        "Concord": { sw: { lat: 43.10, lng: -71.60 }, ne: { lat: 43.30, lng: -71.40 } },
        "Trenton": { sw: { lat: 40.20, lng: -74.80 }, ne: { lat: 40.30, lng: -74.70 } },
        "Santa Fe": { sw: { lat: 35.60, lng: -106.00 }, ne: { lat: 35.70, lng: -105.90 } },
        "Albany": { sw: { lat: 42.60, lng: -73.80 }, ne: { lat: 42.70, lng: -73.70 } },
        "Raleigh": { sw: { lat: 35.70, lng: -78.70 }, ne: { lat: 35.80, lng: -78.60 } },
        "Bismarck": { sw: { lat: 46.70, lng: -100.80 }, ne: { lat: 46.90, lng: -100.70 } },
        "Columbus": { sw: { lat: 39.90, lng: -83.00 }, ne: { lat: 40.00, lng: -82.90 } },
        "Oklahoma City": { sw: { lat: 35.40, lng: -97.60 }, ne: { lat: 35.60, lng: -97.40 } },
        "Salem": { sw: { lat: 44.90, lng: -123.10 }, ne: { lat: 45.00, lng: -123.00 } },
        "Harrisburg": { sw: { lat: 40.20, lng: -76.90 }, ne: { lat: 40.30, lng: -76.80 } },
        "Providence": { sw: { lat: 41.80, lng: -71.50 }, ne: { lat: 41.90, lng: -71.30 } },
        "Columbia": { sw: { lat: 33.90, lng: -81.10 }, ne: { lat: 34.10, lng: -80.90 } },
        "Pierre": { sw: { lat: 44.30, lng: -100.40 }, ne: { lat: 44.40, lng: -100.30 } },
        "Nashville": { sw: { lat: 36.10, lng: -86.80 }, ne: { lat: 36.20, lng: -86.70 } },
        "Austin": { sw: { lat: 30.20, lng: -97.80 }, ne: { lat: 30.40, lng: -97.60 } },
        "Salt Lake City": { sw: { lat: 40.70, lng: -112.00 }, ne: { lat: 40.80, lng: -111.90 } },
        "Montpelier": { sw: { lat: 44.20, lng: -72.60 }, ne: { lat: 44.30, lng: -72.50 } },
        "Richmond": { sw: { lat: 37.50, lng: -77.50 }, ne: { lat: 37.60, lng: -77.40 } },
        "Olympia": { sw: { lat: 47.00, lng: -122.90 }, ne: { lat: 47.10, lng: -122.80 } },
        "Charleston": { sw: { lat: 38.30, lng: -81.70 }, ne: { lat: 38.40, lng: -81.60 } },
        "Madison": { sw: { lat: 43.00, lng: -89.50 }, ne: { lat: 43.10, lng: -89.30 } },
        "Cheyenne": { sw: { lat: 41.10, lng: -104.90 }, ne: { lat: 41.20, lng: -104.70 } },
    
        // ===== Other Major World Capitals =====
        "Tokyo": { sw: { lat: 35.40, lng: 139.40 }, ne: { lat: 35.90, lng: 139.90 } },
        "Beijing": { sw: { lat: 39.70, lng: 116.20 }, ne: { lat: 40.20, lng: 116.70 } },
        "New Delhi": { sw: { lat: 28.35, lng: 76.80 }, ne: { lat: 28.85, lng: 77.35 } },
        "Ottawa": { sw: { lat: 45.20, lng: -75.90 }, ne: { lat: 45.60, lng: -75.50 } },
        "Canberra": { sw: { lat: -35.50, lng: 148.90 }, ne: { lat: -35.10, lng: 149.40 } },
        "Cairo": { sw: { lat: 29.90, lng: 31.00 }, ne: { lat: 30.30, lng: 31.50 } },
        "Pretoria": { sw: { lat: -25.90, lng: 28.00 }, ne: { lat: -25.50, lng: 28.40 } },
        "Brasília": { sw: { lat: -16.10, lng: -48.30 }, ne: { lat: -15.60, lng: -47.80 } },
        "Buenos Aires": { sw: { lat: -34.80, lng: -58.60 }, ne: { lat: -34.40, lng: -58.20 } }
    };

  
    
    const questions = [
        {
            type: 'list',
            name: 'selectedCapital',
            message: 'Выберите столицу:',
            choices: Object.keys(capitalsBounds).sort(),
            pageSize: 20 
        }
    ];
    
    
    const answers = await inquirer.prompt(questions);
    const selectedCapital = answers.selectedCapital;
    
    
    return {
        capital: selectedCapital,
        bounds: capitalsBounds[selectedCapital]
    };
}

module.exports.accountSelection = accountSelection;
module.exports.partnerSelection = partnerSelection;
module.exports.currencySelection = currencySelection;
module.exports.capitalsBounds = capitalsBounds;