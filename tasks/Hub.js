const {GetEventArgumentsByNameAsync} = require("../utils/IFBUtils");
const hubScope = scope("hub", "Tasks for HUB");

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

    console.log("list:", list)
})


hubScope.task("getPartners", "Get list of partners")
.setAction(async () => {

    const {hub} = await loadContract();

    const list = await hub.getPartners()

    console.log("list:", list)
})


hubScope.task("me", "Get my profile in hub")
.setAction(async () => {

    const {hub} = await loadContract();

    const me = await hub.me()

    console.log("Me:", me)
})


hubScope.task("registerPartner", "Register new partner and deploy all modules" )
.addParam("name")
.addParam("countrycode")
.addParam("partyid")
.addParam("sudouserlogin")
.addParam("sudouserpassword")
.addParam("tgtoken")
.setAction(async (args) => {
    
    const {hub,hubAddress, SMSMessageOracle, EmailMessageOracle,config} = await loadContract();

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
        

        const userModule = require("../ignition/modules/User");
        const UserGroupsModule = require("../ignition/modules/UserGroups");
        const TariffModule = require("../ignition/modules/Tariff");
        const LocationsModule = require("../ignition/modules/Locations");
        const LocationSearchModule = require("../ignition/modules/LocationSearch");
        const EVSEModule = require("../ignition/modules/EVSE");
        const ConnectorModule = require("../ignition/modules/Connector");
        const UserAccessModule = require("../ignition/modules/UserAccess");
        const UserSupportChatModule = require("../ignition/modules/UserSupportChat");



        const UserDeploy = await ignition.deploy(userModule,{config:{requiredConfirmations:config.ignition.requiredConfirmations}});
    
        const User = UserDeploy.user;
    
        await User.initialize(partnerid,hubAddress, ethers.encodeBytes32String(args.sudouserlogin), ethers.encodeBytes32String(args.sudouserpassword), ethers.toUtf8Bytes(args.tgtoken))
    
        await hub.addModule("User", User.target)
    
        console.log("User deployed to:", User.target);
        let refillsms = await SMSMessageOracle.refill(User.target,{value:10n});
        await refillsms.wait(config.ignition.requiredConfirmations)
        let refillemeil = await EmailMessageOracle.refill(User.target,{value:10n});
        await refillemeil.wait(config.ignition.requiredConfirmations)



        const UserGroupsDeploy = await ignition.deploy(UserGroupsModule, {config:{requiredConfirmations:config.ignition.requiredConfirmations}});
        const UserGroups = UserGroupsDeploy.UserGroups;
        await UserGroups.initialize(partnerid,hubAddress)

        await hub.addModule("UserGroups", UserGroups.target);
        console.log("UserGroups deployed to:", UserGroups.target);


        // Tariff
        const TariffDeploy = await ignition.deploy(TariffModule, {config:{requiredConfirmations:config.ignition.requiredConfirmations}});
        const Tariff = await TariffDeploy.Tariff;
        
        await Tariff.initialize(partnerid,hubAddress)

        let addTariff = await hub.addModule("Tariff", Tariff.target);
        await addTariff.wait(config.ignition.requiredConfirmations);
        console.log("Tariff deployed to:", Tariff.target);
        

        // Location
        const LocationDeploy = await ignition.deploy(LocationsModule, {config:{requiredConfirmations:config.ignition.requiredConfirmations}});
        const Location = await LocationDeploy.Locations;
        
        await Location.initialize(partnerid,hubAddress)

        let addLocation = await hub.addModule("Location", Location.target);
        await addLocation.wait(config.ignition.requiredConfirmations)

        console.log("Location deployed to:", Location.target);


        // LocationSearch
        const LocationSearchDeploy = await ignition.deploy(LocationSearchModule, {config:{requiredConfirmations:config.ignition.requiredConfirmations}});
        const LocationSearch = await LocationSearchDeploy.LocationSearch;
        
        await LocationSearch.initialize(partnerid,hubAddress)

        let addLocationSearch = await hub.addModule("LocationSearch", LocationSearch.target);
        await addLocationSearch.wait(config.ignition.requiredConfirmations)
        
        console.log("LocationSearch deployed to:", LocationSearch.target);

        
        // EVSE
        const EVSEDeploy = await ignition.deploy(EVSEModule, {config:{requiredConfirmations:config.ignition.requiredConfirmations}});
        const EVSE = await EVSEDeploy.EVSE;
        
        await EVSE.initialize(partnerid,hubAddress)

        let addEVSE = await hub.addModule("EVSE", EVSE.target);
        await addEVSE.wait(config.ignition.requiredConfirmations)
        
        console.log("EVSE deployed to:", EVSE.target);


        //Connector

        const ConnectorDeploy = await ignition.deploy(ConnectorModule, {config:{requiredConfirmations:config.ignition.requiredConfirmations}});
        const Connector = await ConnectorDeploy.Connector;
        
        await Connector.initialize(partnerid,hubAddress)

        let addConnector = await hub.addModule("Connector", Connector.target);
        await addConnector.wait(config.ignition.requiredConfirmations)

        console.log("Connector deployed to:", Connector.target);

        //SupportChat

        const UserSupportChatDeploy = await ignition.deploy(UserSupportChatModule, {config:{requiredConfirmations:config.ignition.requiredConfirmations}});
        
        const UserSupportChat = await UserSupportChatDeploy.UserSupportChat;
        
        await UserSupportChat.initialize(partnerid,hubAddress)

        let addUserSupportChat = await hub.addModule("UserSupportChat", UserSupportChat.target);
        await addUserSupportChat.wait(config.ignition.requiredConfirmations)

        console.log("UserSupportChat deployed to:", UserSupportChat.target);


        const UserAccessDeploy = await ignition.deploy(UserAccessModule, {config:{requiredConfirmations:config.ignition.requiredConfirmations}});
        const UserAccess = UserAccessDeploy.UserAccess;
        
        await UserAccess.initialize(partnerid,hubAddress)

        let addUserAccess = await hub.addModule("UserAccess", UserAccess.target);
        await addUserAccess.wait(config.ignition.requiredConfirmations)

        console.log("UserAccess deployed to:", UserAccess.target);

    }

})

async function loadContract(){

    const {network, ethers} = require("hardhat");

    if(typeof network.config.networkid == "undefined")
            throw("Please select network")
    
    const config = require("../hardhat.config");
    
    const accounts = await ethers.getSigners();

    const balance = await ethers.provider.getBalance(accounts[0].address)

    console.log("Balance:", hre.ethers.formatEther(balance), "ETH")

    const deployed_addresses = require(`../ignition/deployments/chain-${network.config.networkid}/deployed_addresses.json`)

    const hubartifacts = require("../artifacts/contracts/Hub/IHub.sol/IHub.json");
    const MessageOracleArtifacts = require("../artifacts/contracts/Services/IMessageOracle.sol/IMessageOracle.json");


    const hub = await new ethers.Contract(deployed_addresses["Hub#Hub"],hubartifacts.abi,accounts[0])
    const SMSMessageOracle = await new ethers.Contract(deployed_addresses["SMSMessageOracle#MessageOracle"],MessageOracleArtifacts.abi,accounts[0])
    const EmailMessageOracle = await new ethers.Contract(deployed_addresses["EmailMessageOracle#MessageOracle"],MessageOracleArtifacts.abi,accounts[0])
    return {hub, hubAddress:deployed_addresses["Hub#Hub"],SMSMessageOracle, EmailMessageOracle, config: config.networks[network.name]};
}