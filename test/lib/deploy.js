const {deployProxy} = require("../../utils/deploy")
const {GetEventArgumentsByNameAsync} = require("../../utils/IFBUtils");

module.exports.deploy = async function(tgtoken, sudoUser, modules){

    const retmodules = {};

    const tg_bot_token = ethers.toUtf8Bytes(tgtoken)

    const accounts = await ethers.getSigners();

    const balance = await ethers.provider.getBalance(accounts[0].address)

    console.log("Balance:", ethers.formatEther(balance), "ETH")

    console.log("Deploying Contracts...");
   
    //
    const EmailServiceAddess =  await deployProxy("MessageOracle",[60n, 1n, false, "Message: [message]"],"Email", false);
    const SMSServiceAddress = await deployProxy("MessageOracle",[60n, 1n, false, "Message: [message]"],"SMS", false);
    const Currencies = await deployProxy("Currencies",[],"",false);
    retmodules.Hub = await deployProxy("Hub",[[
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
    ]],"",false);

    console.log("Hub deployed to:", retmodules.Hub.target);

    let tx = await retmodules.Hub.registerPartner(
        ethers.encodeBytes32String("PortalEnergy"),
        ethers.toUtf8Bytes("RU"),
        ethers.toUtf8Bytes("POE"),{
            value:ethers.parseEther("2") 
        }
    );

    const partner = await GetEventArgumentsByNameAsync(tx, "AddPartner")

    
    retmodules.RevertCodes = await deployProxy("RevertCodes",[partner.id, retmodules.Hub.target],"",false);

    await retmodules.Hub.addModule("RevertCodes", retmodules.RevertCodes.target)

    console.log("RevertCodes deployed to:", retmodules.RevertCodes.target);


    //
    if(typeof modules?.MobileApp != "undefined"){
        retmodules.MobileApp = await deployProxy("MobileApp",[partner.id,retmodules.Hub.target],"",false);

        let ttx2 = await retmodules.Hub.addModule("MobileApp", retmodules.MobileApp.target)
        await ttx2.wait()
    
        console.log("MobileApp deployed to:", retmodules.MobileApp.target);
    }

    //
    if(typeof modules?.User != "undefined"){
        retmodules.User = await deployProxy("User",[partner.id,retmodules.Hub.target],"",false);

        let tx2 = await retmodules.Hub.addModule("User", retmodules.User.target)
        await tx2.wait()
    
        await retmodules.User.registerRevertCodes()
        console.log("User deployed to:", retmodules.User.target);
    }



    if(typeof modules?.Auth != "undefined"){
        retmodules.Auth = await deployProxy("Auth",[partner.id,retmodules.Hub.target, tg_bot_token],"",false);

        let tx3 = await retmodules.Hub.addModule("Auth", retmodules.Auth.target)
        await tx3.wait()
        await retmodules.Auth.registerRevertCodes()
        await retmodules.Auth.registerByPassword(sudoUser.login, sudoUser.password);
        
        console.log("Auth deployed to:", retmodules.Auth.target);
        await SMSServiceAddress.refill(retmodules.Auth.target,{value:10n});
        await EmailServiceAddess.refill(retmodules.Auth.target,{value:10n});
    }



    if(typeof modules?.UserGroups != "undefined"){
        retmodules.UserGroups =  await deployProxy("UserGroups",[partner.id,retmodules.Hub.target],"",false);
        let tx4 = await retmodules.Hub.addModule("UserGroups", retmodules.UserGroups.target);
        await tx4.wait()
        await retmodules.UserGroups.registerRevertCodes()
        console.log("UserGroups deployed to:", retmodules.UserGroups.target);
    }

    // Tariff
    if(typeof modules?.Tariff != "undefined"){
        retmodules.Tariff = await deployProxy("Tariff",[partner.id,retmodules.Hub.target],"",false);
        
        let tx5 = await retmodules.Hub.addModule("Tariff", retmodules.Tariff.target);
        await tx5.wait()
        await retmodules.Tariff.registerRevertCodes()
        console.log("Tariff deployed to:", retmodules.Tariff.target);
    }    

    // Location
    if(typeof modules?.Location != "undefined"){
        retmodules.Location = await deployProxy("Location",[partner.id,retmodules.Hub.target],"",false);

        let tx6 = await retmodules.Hub.addModule("Location", retmodules.Location.target);
        await tx6.wait()
        await retmodules.Location.registerRevertCodes()
        console.log("Location deployed to:", retmodules.Location.target);
    }

    // LocationSearch
    if(typeof modules?.LocationSearch != "undefined"){
        retmodules.LocationSearch = await deployProxy("LocationSearch",[partner.id,retmodules.Hub.target],"",false);

        let tx7 = await retmodules.Hub.addModule("LocationSearch", retmodules.LocationSearch.target);
        await tx7.wait()
        await retmodules.LocationSearch.registerRevertCodes()
        console.log("LocationSearch deployed to:", retmodules.LocationSearch.target);
    }
    
    // EVSE
    if(typeof modules?.EVSE != "undefined"){
        retmodules.EVSE = await deployProxy("EVSE",[partner.id,retmodules.Hub.target],"",false);

        let tx8 = await retmodules.Hub.addModule("EVSE", retmodules.EVSE.target);
        await tx8.wait()
        await retmodules.EVSE.registerRevertCodes()
        console.log("EVSE deployed to:", retmodules.EVSE.target);
    }

    //Connector

    if(typeof modules?.Connector != "undefined"){
        retmodules.Connector = await deployProxy("Connector",[partner.id,retmodules.Hub.target],"",false);

        let tx9 = await retmodules.Hub.addModule("Connector", retmodules.Connector.target);
        await tx9.wait();
        await retmodules.Connector.registerRevertCodes()
        console.log("Connector deployed to:", retmodules.Connector.target);
    }
    //Connector

    if(typeof modules?.UserSupportChat != "undefined"){
        retmodules.UserSupportChat = await deployProxy("UserSupportChat",[partner.id,retmodules.Hub.target],"",false);
        
        let tx10 = await retmodules.Hub.addModule("UserSupportChat", retmodules.UserSupportChat.target);
        await tx10.wait()
        await retmodules.UserSupportChat.registerRevertCodes()
        console.log("UserSupportChat deployed to:", retmodules.UserSupportChat.target);
    }    


    retmodules.UserAccess = await deployProxy("UserAccess",[partner.id,retmodules.Hub.target],"",false);

    let tx11 = await retmodules.Hub.addModule("UserAccess", retmodules.UserAccess.target);
    await tx11.wait();
    await retmodules.UserAccess.registerRevertCodes()
    console.log("UserAccess deployed to:", retmodules.UserAccess.target);
    
    
    
    return retmodules;
}