const locationScope = scope("Location", "Tasks for Location module");
const {GetEventArgumentsByNameAsync} = require("../utils/IFBUtils");


locationScope.task("version", "Version module")
.setAction(async () => {
    try {
        const {Location} = await loadContract()
        console.log("Location version:",await Location.getVersion())
    } catch (error) {
        console.log(error)
    }

})


locationScope.task("addTestLocationsWithEVSE", "Add test locations with evse")
//.addParam("token", "Access token")
.setAction(async (args) => {
    const {getEvseData} = require("../test/lib/evse_data");

    const {location,relatedLocation,image,direction,openingTimes} = require("../test/lib/location_data")
    const {free_tariff,energy_mix} = require("../test/lib/tariff_data")

    const {Location, Auth, Tariff, EVSE, Connector} = await loadContract()
    
    const img = image;

    const sudoUser = {
        login: ethers.encodeBytes32String("sudo"),
        password: ethers.encodeBytes32String("433455"),
        token:null
    }

    try {
        let auth = await Auth.authByPassword(sudoUser.login,sudoUser.password)
        let authSuccess = await GetEventArgumentsByNameAsync(auth, "CreateAuthToken")
    
        let token = await Auth.getAuthTokenByPassword(sudoUser.login,sudoUser.password, authSuccess.token_id)
    
        sudoUser.token = token[1];   
        console.log("Token auth", sudoUser.token)   
    } catch (error) {
        console.log("ERROR GET TOKEN",error)
        return
    }



    const fs = require('fs');
    const coords = JSON.parse( fs.readFileSync(__dirname+"/../coords.json", 'utf8'))
    

    
    for (let index = 0; index < coords.length; index++) {
        const coord = coords[index];
        const loc = location;

        loc.coordinates.latitude = coord.lat;
        loc.coordinates.longtitude = coord.lon;

        
        try {
            let tx = await Location.addLocation(sudoUser.token, loc);

            let result = await GetEventArgumentsByNameAsync(tx, "AddLocation")
            console.log("add location", index)
    
            let tx2 = await Location.addRelatedLocation(sudoUser.token, result.uid, relatedLocation);
            await tx2.wait()
    
            let tx3 = await Location.addImage(sudoUser.token, result.uid, img);
            await tx3.wait()
    
            let tx4 = await Location.addDirection(sudoUser.token, result.uid, direction);
            await tx4.wait()
            
            let tx5 = await Location.setOpeningTimes(sudoUser.token, result.uid, openingTimes);
            await tx5.wait()


        
            let txtariff =  await Tariff.add(sudoUser.token, free_tariff);
            let resulttariff = await GetEventArgumentsByNameAsync(txtariff, "AddTariff")


            let txsetMinPrice = await Tariff.setMinPrice(sudoUser.token, resulttariff.uid, {
                excl_vat:10,
                incl_vat:12
            })
    
            await txsetMinPrice.wait()

            let txsetMaxPrice = await Tariff.setMaxPrice(sudoUser.token, resulttariff.uid, {
                excl_vat:10,
                incl_vat:12
            })
    
            await txsetMaxPrice.wait()

            let time = Date.now();
            let txsetStartDateTime = await Tariff.setStartDateTime(sudoUser.token, resulttariff.uid, time)
            
            await txsetStartDateTime.wait()       

            let endtime = new Date();
            endtime.setDate(endtime.getDate() + 300);

            let txsetEndDateTime = await Tariff.setEndDateTime(sudoUser.token, resulttariff.uid, endtime.getTime())

            await txsetEndDateTime.wait()         


            let txsetEnergyMix = await Tariff.setEnergyMix(sudoUser.token, resulttariff.uid, energy_mix)
            await txsetEnergyMix.wait()

            let {EVSEdata, EVSEmeta, image, connector} = getEvseData();
            
            let addEvse =  await EVSE.add(sudoUser.token, EVSEdata, result.uid);

            let resultEvse = await GetEventArgumentsByNameAsync(addEvse, "AddEVSE")


            let txsetMeta = await EVSE.setMeta(sudoUser.token, resultEvse.uid, EVSEmeta)
            await txsetMeta.wait()

            let txaddImage = await EVSE.addImage(sudoUser.token, resultEvse.uid, image);
            await txaddImage.wait()


            let maxConnectors = Math.floor(Math.random() * 4);

            for (let index = 0; index < maxConnectors; index++) {

                let conn = connector;

                conn.standard = Math.floor(Math.random() * 7)

                let addConnector =  await Connector.add(sudoUser.token, conn, resultEvse.uid);

                await addConnector.wait();
                
            }


        
    
        } catch (error) {
            console.log(error)
        }


    }


})






async function loadContract(){

    const {network, ethers} = require("hardhat");

    if(typeof network.config.networkid == "undefined")
            throw("Please select network")
    
    const config = require("../hardhat.config");
    
    const accounts = await ethers.getSigners();

    const balance = await ethers.provider.getBalance(accounts[0].address)

    console.log("Balance:", ethers.formatEther(balance), "ETH")

    
    const deployed_addresses = require(`../${network.name}_proxy_addresses.json`)

    const hubartifacts = require("../artifacts/contracts/Hub/IHub.sol/IHub.json");
    const ILocationArtifacts = require("../artifacts/contracts/Location/ILocation.sol/ILocation.json");
    const EVSEArtifacts = require("../artifacts/contracts/Location/IEVSE.sol/IEVSE.json");
    const ConnectorArtifacts = require("../artifacts/contracts/Location/IConnector.sol/IConnector.json");
    const TariffArtifacts = require("../artifacts/contracts/Tariff/ITariff.sol/ITariff.json");
    const AuthArtifacts = require("../artifacts/contracts/User/Auth.sol/Auth.json");

    const hub = await new ethers.Contract(deployed_addresses["Hub"],hubartifacts.abi,accounts[0])
    const partnerid = await hub.getPartnerIdByAddress(accounts[0].address)

    console.log("partnerid", partnerid)
    
    const locationModuleAddress = await hub.getModule("Location", partnerid);
    const authModuleAddress = await hub.getModule("Auth", partnerid);
    const EVSEModuleAddress = await hub.getModule("EVSE", partnerid);
    const ConnectorModuleAddress = await hub.getModule("Connector", partnerid);
    const TariffModuleAddress = await hub.getModule("Tariff", partnerid);

    console.log("Module address", locationModuleAddress);

    const Location = await new ethers.Contract(locationModuleAddress,ILocationArtifacts.abi,accounts[0])
    const Auth = await new ethers.Contract(authModuleAddress,AuthArtifacts.abi,accounts[0])
    const EVSE = await new ethers.Contract(EVSEModuleAddress,EVSEArtifacts.abi,accounts[0])
    const Connector = await new ethers.Contract(ConnectorModuleAddress,ConnectorArtifacts.abi,accounts[0])
    const Tariff = await new ethers.Contract(TariffModuleAddress,TariffArtifacts.abi,accounts[0])

    return {hub, hubAddress:deployed_addresses["Hub"],Location,Auth, EVSE, Connector, Tariff, config: config.networks[network.name]};
}