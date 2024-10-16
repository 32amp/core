task("getBalance", "get address balance")
.addParam("address")
.setAction(async (args) => {

  const balance = await hre.ethers.provider.getBalance(args.address)

  console.log("Balance:", hre.ethers.formatEther(balance), "ETH")
})