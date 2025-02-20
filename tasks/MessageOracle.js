const messageOracleScope = scope("MessageOracle", "Tasks for MessageOracle service");
const { loadContracts } = require("./helpers/load_contract")

messageOracleScope.task("version", "Version module")
.setAction(async () => {
    try {
        const {EmailService, SMSService} = await loadContracts()
        console.log("EmailService version:",await EmailService.getVersion())
        console.log("SMSService version:",await SMSService.getVersion())
    } catch (error) {
        console.log(error)
    }
})


messageOracleScope.task("refill", "Refill balance for service")
.addParam("partnerid", "Partner id")
.addParam("amount", "Amount of ETH what you want to send")
.addParam("service", "EmailService or SMSService")
.setAction(async (args) => {
    try {
        const {EmailService, SMSService, hub} = await loadContracts()
        const moduleAddress = hub.getModule("Auth",args.partnerid)
        
        if(args.service == "EmailService"){    
            await EmailService.refill(moduleAddress,{value:ethers.parseEther(args.amount)})
        }else if (args.service == "SMSService"){
            await SMSService.refill(moduleAddress,{value:ethers.parseEther(args.amount)})
        }

    } catch (error) {
        console.log(error)
    }

})