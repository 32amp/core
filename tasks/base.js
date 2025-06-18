const { accountSelection } = require("./helpers/promt_selection");
const { savePrivateKey } = require("./helpers/manage_additional_accounts");
const inquirer = require("inquirer");


task("formatEther", "Convert wei to eth")
.addParam("value", "In wei")
.setAction( async (args, hre) => {
  console.log(ethers.formatEther(BigInt(args.value)))
})

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
    const accounts = await hre.ethers.getSigners();
  
    for (const account of accounts) {
      console.log(account.address);
    }
});

task("add-account", "Add new account in list from private key", async(args, hre) => {
  const answer = await inquirer.prompt([{
    type: "input",
    name: "private_key",
    message: "Enter private key:",
  }]);

  const signer = new hre.ethers.Wallet(answer.private_key, hre.provider);

  await savePrivateKey(signer.address, answer.private_key)

  console.log("Add new account with address:", signer.address)
})


task("sign-message", "Sign message", async (taskArgs, hre) => {

    const signer = await accountSelection(hre);
    const answer = await inquirer.prompt([{
      type: "input",
      name: "message",
      message: "Enter message:",
    }]);

    console.log("Sign message:",await signer.signMessage(answer.message))
});

task("getBalance", "get address balance")
.addParam("address")
.setAction(async (args) => {

  const balance = await hre.ethers.provider.getBalance(args.address)

  console.log("Balance:", hre.ethers.formatEther(balance), "ETH")
})

task("transferETH", "Send ETH from zero account to address")
.addParam("address")
.addParam("amount")
.setAction(async (args) => {

  try {
    const accounts = await hre.ethers.getSigners();

    let txData = {
      to: args.address,
      value: hre.ethers.parseEther(args.amount.toString()),
    }

    let tx = await accounts[0].sendTransaction(txData);
    
    let result = await tx.wait();
    console.log("Tx hash", result.hash)
  } catch (error) {
    console.error(`Code:${error.code}`)
    console.error(`Message:${error.shortMessage}`)
  }

})


task("decode-error", "Decode error for contract")
    .setAction(async (taskArgs, hre) => {
        
        const questions = [
            {
                type: 'input',
                name: 'error',
                message: 'Enter error data in hex:'
            },
            {
              type: "list",
              name: "module",
              message: "Select contract",
              choices: [
                {
                  name: "Hub",
                  value: "Hub"
                },
                {
                  name: "Location",
                  value: "Location"
                },
                {
                  name: "EVSE",
                  value: "EVSE"
                },
                {
                  name: "Connector",
                  value: "Connector"
                },
                {
                  name: "MobileAppSettings",
                  value: "MobileAppSettings"
                },
                {
                  name: "Balance",
                  value: "Balance"
                },
                {
                  name: "Cards",
                  value: "Cards"
                },
                {
                  name: "Tariff",
                  value: "Tariff"
                },
                {
                  name: "User",
                  value: "User"
                },
                {
                  name: "UserAccess",
                  value: "UserAccess"
                },
                {
                  name: "UserGroups",
                  value: "UserGroups"
                },
                {
                  name: "UserSupportChat",
                  value: "UserSupportChat"
                }
              ]
            }
        ];

        const answers = await inquirer.prompt(questions);
        const instance = await hre.ethers.getContractAt(answers.module, hre.ethers.ZeroAddress)
        
        const decodedError = instance.interface.parseError(answers.error);
        console.log("Decoded error:", decodedError);
        
    })