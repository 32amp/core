const { accountSelection } = require("./helpers/promt_selection");
const inquirer = require("inquirer");


task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
    const accounts = await hre.ethers.getSigners();
  
    for (const account of accounts) {
      console.log(account.address);
    }
});


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