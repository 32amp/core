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