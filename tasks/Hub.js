const {GetEventArgumentsByNameAsync} = require("../utils/IFBUtils");
const {formatPartner, formatPartners} = require("../helpers/Hub");
const {deployProxy} = require("../utils/deploy")
const hubScope = scope("hub", "Tasks for HUB");

hubScope.task("hubdeploy", "Deploy hub contract")
.setAction(async function(){
    
    try {
        var {config} = require(__dirname+"/../hub.config");
    
    } catch (error) {
        console.log("Error open config hub.config.json", error)
        return;
    }

    const EmailServiceAddess =  await deployProxy("MessageOracle",[config.EmailService.sendTimeout, config.EmailService.priceForMessage, config.EmailService.whitelistEnable, config.EmailService.bodyTemplate],"Email");
    const SMSServiceAddress = await deployProxy("MessageOracle",[config.SMSService.sendTimeout, config.SMSService.priceForMessage, config.SMSService.whitelistEnable, config.SMSService.bodyTemplate],"SMS");
    const Currencies = await deployProxy("Currencies",[],"");
    this.Hub = await deployProxy("Hub",[[
        {
            name: "EmailService",
            contract_address:EmailServiceAddess.target
        },
        {
            name: "SMSService",
            contract_address: SMSServiceAddress.target
        },
        {
            name: "Currencies",
            contract_address: Currencies.target
        },
    ]],"");
    


})

hubScope.task("getService", "get address of service")
.addParam("name")
.setAction(async (args) => {

    const {hub} = await loadContract();

    const email_service = await hub.getService(args.name)

    console.log("email_service:", email_service, "ETH")
})


hubScope.task("getPartnerModules", "Get list of modules for specific partner")
.addParam("partnerid")
.setAction(async (args) => {

    const {hub} = await loadContract();

    const list = await hub.getPartnerModules(args.partnerid)

    console.log("Result:", list)
})


hubScope.task("getPartners", "Get list of partners")
.setAction(async () => {

    const {hub} = await loadContract();

    const list = await hub.getPartners()

    console.log("Result:", formatPartners(list))
})


hubScope.task("me", "Get my profile in hub")
.setAction(async () => {

    const {hub} = await loadContract();

    const me = await hub.me()

    console.log("Me:", formatPartner(me))
})

// TODO: deploymentId:"update" for add each partner where update is name of deploy
hubScope.task("registerPartner", "Register new partner and deploy all modules" )
.addParam("name")
.addParam("countrycode")
.addParam("partyid")
.addParam("sudouserlogin")
.addParam("sudouserpassword")
.addParam("tgtoken")
.setAction(async (args) => {
    
    const {hub,hubAddress, SMSMessageOracle, EmailMessageOracle} = await loadContract();

    var partnerid = 0;


    const tx = await hub.registerPartner(
        ethers.encodeBytes32String(args.name),
        ethers.toUtf8Bytes(args.countrycode),
        ethers.toUtf8Bytes(args.partyid), 
        {
            value:ethers.parseEther("2") 
        }
    );


    const result = await GetEventArgumentsByNameAsync(tx,"AddPartner")
    partnerid = result.id;

    console.log("Create partner with id ", partnerid)


    if(partnerid){
        
        const User = await deployProxy("User",[
            partnerid,
            hubAddress, 
            ethers.encodeBytes32String(args.sudouserlogin), 
            ethers.encodeBytes32String(args.sudouserpassword), 
            ethers.toUtf8Bytes(args.tgtoken)
        ],"",false);
    
        await hub.addModule("User", User.target)
    
        console.log("User deployed to:", User.target);
        
        let refillsms = await SMSMessageOracle.refill(User.target,{value:10n});
        await refillsms.wait()

        let refillemeil = await EmailMessageOracle.refill(User.target,{value:10n});
        await refillemeil.wait()


        const UserGroups = await deployProxy("UserGroups",[partnerid,hubAddress],"",false);
        await hub.addModule("UserGroups", UserGroups.target);
        console.log("UserGroups deployed to:", UserGroups.target);


        // Tariff
        
        const Tariff = await deployProxy("Tariff",[partnerid,hubAddress],"",false);
        
        let addTariff = await hub.addModule("Tariff", Tariff.target);
        await addTariff.wait();
        console.log("Tariff deployed to:", Tariff.target);
        

        const Location = await deployProxy("Location",[partnerid,hubAddress],"",false);
        
        let addLocation = await hub.addModule("Location", Location.target);
        await addLocation.wait()

        console.log("Location deployed to:", Location.target);


        // LocationSearch
        
        const LocationSearch = await deployProxy("LocationSearch",[partnerid,hubAddress],"",false);
    
        let addLocationSearch = await hub.addModule("LocationSearch", LocationSearch.target);
        await addLocationSearch.wait()
        
        console.log("LocationSearch deployed to:", LocationSearch.target);

        
        // EVSE
        
        const EVSE = await deployProxy("EVSE",[partnerid,hubAddress],"",false);
        
        let addEVSE = await hub.addModule("EVSE", EVSE.target);
        await addEVSE.wait()
        
        console.log("EVSE deployed to:", EVSE.target);


        //Connector

        const Connector = await deployProxy("Connector",[partnerid,hubAddress],"",false);
        
        let addConnector = await hub.addModule("Connector", Connector.target);
        await addConnector.wait()

        console.log("Connector deployed to:", Connector.target);

        //SupportChat

        const UserSupportChat = await deployProxy("UserSupportChat",[partnerid,hubAddress],"",false);

        let addUserSupportChat = await hub.addModule("UserSupportChat", UserSupportChat.target);
        await addUserSupportChat.wait()

        console.log("UserSupportChat deployed to:", UserSupportChat.target);

        // UserAccess
        const UserAccess = await deployProxy("UserAccess",[partnerid,hubAddress],"",false);
        
        let addUserAccess = await hub.addModule("UserAccess", UserAccess.target);
        await addUserAccess.wait()

        console.log("UserAccess deployed to:", UserAccess.target);

    }

})

async function loadContract(){

    const {network, ethers} = require("hardhat");

    if(typeof network.config.networkid == "undefined")
            throw("Please select network")
    
    const accounts = await ethers.getSigners();

    const balance = await ethers.provider.getBalance(accounts[0].address)

    console.log("Balance:", hre.ethers.formatEther(balance), "ETH")

    const deployed_addresses = require(`../${network.name}_proxy_addresses.json`)

    const hubartifacts = require("../artifacts/contracts/Hub/IHub.sol/IHub.json");
    const MessageOracleArtifacts = require("../artifacts/contracts/Services/IMessageOracle.sol/IMessageOracle.json");


    const hub = await new ethers.Contract(deployed_addresses["Hub"],hubartifacts.abi,accounts[0])
    const SMSMessageOracle = await new ethers.Contract(deployed_addresses["MessageOracle#SMS"],MessageOracleArtifacts.abi,accounts[0])
    const EmailMessageOracle = await new ethers.Contract(deployed_addresses["MessageOracle#Email"],MessageOracleArtifacts.abi,accounts[0])
    return {hub, hubAddress:deployed_addresses["Hub"],SMSMessageOracle, EmailMessageOracle};
}