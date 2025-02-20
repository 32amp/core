const {GetEventArgumentsByNameAsync} = require("../utils/IFBUtils");
const {formatPartner, formatPartners} = require("../helpers/Hub");
const {deployProxy, upgradeProxy} = require("../utils/deploy")
const hubScope = scope("hub", "Tasks for HUB");
const { loadContracts } = require("./helpers/load_contract")


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

hubScope.task("hubupgrade", "Upgrade hub contract")
.setAction(async function(){
    const Hub = await upgradeProxy("Hub")
    await Hub.upgrade();
})


hubScope.task("changeModuleAddress", "Change module address if you recrate module")
.addParam("name", "name of module")
.addParam("address", "Address of contract")
.setAction(async function(){
    const {hub} = await loadContracts();
    await hub.changeModuleAddress(args.name,args.address)
})

hubScope.task("getService", "Get address of service")
.addParam("name")
.setAction(async (args) => {

    const {hub} = await loadContracts();

    const email_service = await hub.getService(args.name)

    console.log("email_service:", email_service, "ETH")
})


hubScope.task("getPartnerModules", "Get list of modules for specific partner")
.addParam("partnerid")
.setAction(async (args) => {

    const {hub} = await loadContracts();

    const list = await hub.getPartnerModules(args.partnerid)

    console.log("Result:", list)
})


hubScope.task("getPartners", "Get list of partners")
.setAction(async () => {

    const {hub} = await loadContracts();

    const list = await hub.getPartners()

    console.log("Result:", formatPartners(list))
})


hubScope.task("me", "Get my profile in hub")
.setAction(async () => {

    const {hub} = await loadContracts();

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
    
    const {hub,hubAddress, SMSMessageOracle, EmailMessageOracle} = await loadContracts();

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
        
        const RevertCodes = await deployProxy("RevertCodes",[
            partnerid,
            hubAddress
        ],"",false);
        let addRevertCodes = await hub.addModule("RevertCodes", RevertCodes.target)
        await addRevertCodes.wait()
        console.log("RevertCodes deployed to:", RevertCodes.target);

        const User = await deployProxy("User",[
            partnerid,
            hubAddress
        ],"",false);
    
        let addUser = await hub.addModule("User", User.target)
        await addUser.wait()
        await User.registerRevertCodes()
        console.log("User deployed to:", User.target);


        const Auth = await deployProxy("Auth",[
            partnerid,
            hubAddress, 
            ethers.toUtf8Bytes(args.tgtoken)
        ],"",false);
    
        let addAuth = await hub.addModule("Auth", Auth.target)
        await addAuth.wait()
        await Auth.registerRevertCodes()

        console.log("Auth deployed to:", Auth.target);

        await Auth.registerByPassword(ethers.encodeBytes32String(args.sudouserlogin), ethers.encodeBytes32String(args.sudouserpassword));
        
        let refillsms = await SMSMessageOracle.refill(Auth.target,{value:10n});
        await refillsms.wait()

        let refillemeil = await EmailMessageOracle.refill(Auth.target,{value:10n});
        await refillemeil.wait()


        const UserGroups = await deployProxy("UserGroups",[partnerid,hubAddress],"",false);
        let addUserGroups = await hub.addModule("UserGroups", UserGroups.target);
        await addUserGroups.wait()
        await UserGroups.registerRevertCodes()
        console.log("UserGroups deployed to:", UserGroups.target);


        // Tariff
        
        const Tariff = await deployProxy("Tariff",[partnerid,hubAddress],"",false);
        
        let addTariff = await hub.addModule("Tariff", Tariff.target);
        await addTariff.wait();
        await Tariff.registerRevertCodes()
        console.log("Tariff deployed to:", Tariff.target);
        

        const Location = await deployProxy("Location",[partnerid,hubAddress],"",false);
        
        let addLocation = await hub.addModule("Location", Location.target);
        await addLocation.wait()
        await Location.registerRevertCodes()

        console.log("Location deployed to:", Location.target);


        // LocationSearch
        
        const LocationSearch = await deployProxy("LocationSearch",[partnerid,hubAddress],"",false);
    
        let addLocationSearch = await hub.addModule("LocationSearch", LocationSearch.target);
        await addLocationSearch.wait()
        await LocationSearch.registerRevertCodes()
        
        console.log("LocationSearch deployed to:", LocationSearch.target);

        
        // EVSE
        
        const EVSE = await deployProxy("EVSE",[partnerid,hubAddress],"",false);
        
        let addEVSE = await hub.addModule("EVSE", EVSE.target);
        await addEVSE.wait()
        await EVSE.registerRevertCodes()
        
        console.log("EVSE deployed to:", EVSE.target);


        //Connector

        const Connector = await deployProxy("Connector",[partnerid,hubAddress],"",false);
        
        let addConnector = await hub.addModule("Connector", Connector.target);
        await addConnector.wait()
        await Connector.registerRevertCodes()

        console.log("Connector deployed to:", Connector.target);

        //SupportChat

        const UserSupportChat = await deployProxy("UserSupportChat",[partnerid,hubAddress],"",false);

        let addUserSupportChat = await hub.addModule("UserSupportChat", UserSupportChat.target);
        await addUserSupportChat.wait()
        await UserSupportChat.registerRevertCodes()

        console.log("UserSupportChat deployed to:", UserSupportChat.target);


        const MobileAppSettings = await deployProxy("MobileAppSettings",[partnerid,hubAddress],"",false);

        let addMobileAppSettings = await hub.addModule("MobileAppSettings", MobileAppSettings.target);
        await addMobileAppSettings.wait()


        console.log("MobileAppSettings deployed to:", MobileAppSettings.target);


        // UserAccess
        const UserAccess = await deployProxy("UserAccess",[partnerid,hubAddress],"",false);
        
        let addUserAccess = await hub.addModule("UserAccess", UserAccess.target);
        await addUserAccess.wait()
        await UserAccess.registerRevertCodes()

        console.log("UserAccess deployed to:", UserAccess.target);

    }

})