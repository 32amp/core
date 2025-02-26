const {deployProxy} = require("../../utils/deploy")
const {GetEventArgumentsByNameAsync} = require("../../utils/IFBUtils");

module.exports.deploy = async function(modules){

    const retmodules = {};

    const accounts = await ethers.getSigners();

    const balance = await ethers.provider.getBalance(accounts[0].address)

    console.log("Balance:", ethers.formatEther(balance), "ETH")

    console.log("Deploying Contracts...");
   
    const Currencies = await deployProxy("Currencies",[],"",false);
    retmodules.Hub = await deployProxy("Hub",[[
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

        await retmodules.User.addUser(accounts[0].address)

        console.log("User deployed to:", retmodules.User.target);


    }



    if(typeof modules?.UserGroups != "undefined"){
        retmodules.UserGroups =  await deployProxy("UserGroups",[partner.id,retmodules.Hub.target],"",false);
        let tx4 = await retmodules.Hub.addModule("UserGroups", retmodules.UserGroups.target);
        await tx4.wait()
        console.log("UserGroups deployed to:", retmodules.UserGroups.target);
    }

    // Tariff
    if(typeof modules?.Tariff != "undefined"){
        retmodules.Tariff = await deployProxy("Tariff",[partner.id,retmodules.Hub.target],"",false);
        
        let tx5 = await retmodules.Hub.addModule("Tariff", retmodules.Tariff.target);
        await tx5.wait()
        console.log("Tariff deployed to:", retmodules.Tariff.target);
    }    

    // Location
    if(typeof modules?.Location != "undefined"){
        retmodules.Location = await deployProxy("Location",[partner.id,retmodules.Hub.target],"",false);

        let tx6 = await retmodules.Hub.addModule("Location", retmodules.Location.target);
        await tx6.wait()
        console.log("Location deployed to:", retmodules.Location.target);
    }

    // LocationSearch
    if(typeof modules?.LocationSearch != "undefined"){
        retmodules.LocationSearch = await deployProxy("LocationSearch",[partner.id,retmodules.Hub.target],"",false);

        let tx7 = await retmodules.Hub.addModule("LocationSearch", retmodules.LocationSearch.target);
        await tx7.wait()
        console.log("LocationSearch deployed to:", retmodules.LocationSearch.target);
    }
    
    // EVSE
    if(typeof modules?.EVSE != "undefined"){
        retmodules.EVSE = await deployProxy("EVSE",[partner.id,retmodules.Hub.target],"",false);

        let tx8 = await retmodules.Hub.addModule("EVSE", retmodules.EVSE.target);
        await tx8.wait()
        console.log("EVSE deployed to:", retmodules.EVSE.target);
    }

    //Connector

    if(typeof modules?.Connector != "undefined"){
        retmodules.Connector = await deployProxy("Connector",[partner.id,retmodules.Hub.target],"",false);

        let tx9 = await retmodules.Hub.addModule("Connector", retmodules.Connector.target);
        await tx9.wait();
        console.log("Connector deployed to:", retmodules.Connector.target);
    }

    //UserSupportChat

    if(typeof modules?.UserSupportChat != "undefined"){
        retmodules.UserSupportChat = await deployProxy("UserSupportChat",[partner.id,retmodules.Hub.target],"",false);
        
        let tx10 = await retmodules.Hub.addModule("UserSupportChat", retmodules.UserSupportChat.target);
        await tx10.wait()
        console.log("UserSupportChat deployed to:", retmodules.UserSupportChat.target);
    }    


    if(typeof modules?.MobileAppSettings != "undefined"){
        retmodules.MobileAppSettings = await deployProxy("MobileAppSettings",[partner.id,retmodules.Hub.target],"",false);
        
        let txAddModuleMobileAppSettings = await retmodules.Hub.addModule("MobileAppSettings", retmodules.MobileAppSettings.target);
        await txAddModuleMobileAppSettings.wait()
        console.log("MobileAppSettings deployed to:", retmodules.MobileAppSettings.target);
    }    

    if(typeof modules?.Balance != "undefined"){
        retmodules.Balance = await deployProxy("Balance",[partner.id,retmodules.Hub.target,1],"",false);
        
        let txAddModuleBalance = await retmodules.Hub.addModule("Balance", retmodules.Balance.target);
        await txAddModuleBalance.wait()
        console.log("Balance deployed to:", retmodules.Balance.target);
    }    
    if(typeof modules?.Cards != "undefined"){
        retmodules.Cards = await deployProxy("Cards",[partner.id,retmodules.Hub.target],"",false);
        
        let txAddModuleCards = await retmodules.Hub.addModule("Cards", retmodules.Cards.target);
        await txAddModuleCards.wait()
        console.log("Cards deployed to:", retmodules.Cards.target);
    }    


    retmodules.UserAccess = await deployProxy("UserAccess",[partner.id,retmodules.Hub.target],"",false);

    let tx11 = await retmodules.Hub.addModule("UserAccess", retmodules.UserAccess.target);
    await tx11.wait();
    
    if(retmodules?.Connector?.target)
        await retmodules.UserAccess.setAccessLevelToModule(retmodules.Connector.target,"EVSE",6)
    

    if(retmodules?.EVSE?.target)
        await retmodules.UserAccess.setAccessLevelToModule(retmodules.EVSE.target,"Location",6)

    console.log("UserAccess deployed to:", retmodules.UserAccess.target);
    
    
    
    return retmodules;
}