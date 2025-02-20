const locationScope = scope("Location", "Tasks for Location module");
const {GetEventArgumentsByNameAsync} = require("../utils/IFBUtils");
const { loadContracts } = require("./helpers/load_contract")
const { authByPassword } = require("./helpers/auth")

locationScope.task("version", "Version module")
.setAction(async () => {
    try {
        const {Location} = await loadContracts()
        console.log("Location version:",await Location.getVersion())
    } catch (error) {
        console.log(error)
    }

})


locationScope.task("getLocation", "Get info of location")
.addParam("id")
.setAction(async function(args){
    const {Location} = await loadContracts()
    const loc = await Location.getLocation(args.id);
    printLocation(loc)
})


locationScope.task("inArea", "Get locations in area")
.addParam("toprightlat")
.addParam("toprightlong")
.addParam("bottomleftlat")
.addParam("bottomleftlong")
.addParam("offset")
.setAction(async function(args){
    const {LocationSearch} = await loadContracts()
    const locs = await LocationSearch.inArea({
        publish: false, 
        topRightLat:args.toprightlat,
        topRightLong:args.toprightlong,
        bottomLeftLat:args.bottomleftlat,
        bottomLeftLong:args.bottomleftlong, 
        offset:args.offset, 
        connectors:[1,2,3,4,5,6,7,8], 
        onlyFreeConnectors:false,
        max_payment_by_kwt:0,
        max_payment_buy_time:0,
        favorite_evse:[]
    });
    

    for (let index = 0; index < locs[0].length; index++) {
        const loc = locs[0][index];

        console.log("id:", loc.id, "lat:", ethers.formatEther(loc.coordinates.latitude), "lon:", ethers.formatEther(loc.coordinates.longtitude))
        
        
    }
})





locationScope.task("addTestLocationsWithEVSE", "Add test locations with evse")
.addParam("user")
.addParam("password")
.setAction(async (args) => {
    const {getEvseData} = require("../test/lib/evse_data");

    const {location,relatedLocation,image,direction,openingTimes} = require("../test/lib/location_data")
    const {free_tariff,energy_mix} = require("../test/lib/tariff_data")

    const {Location, Tariff, EVSE, Connector} = await loadContracts()
    
    const img = image;

    const token = await authByPassword(args.user,args.password)

    const fs = require('fs');
    const coords = JSON.parse( fs.readFileSync(__dirname+"/../coords.json", 'utf8'))
    

    
    for (let index = 0; index < coords.length; index++) {

        const coord = coords[index];
        const loc = location;

        loc.coordinates.latitude = coord.lat;
        loc.coordinates.longtitude = coord.lon;

        
        try {
            let tx = await Location.addLocation(token, loc);

            let result = await GetEventArgumentsByNameAsync(tx, "AddLocation")
            console.log("add location", index)
    
            let tx2 = await Location.addRelatedLocation(token, result.uid, relatedLocation);
            await tx2.wait()
    
            let tx3 = await Location.addImage(token, result.uid, img);
            await tx3.wait()
    
            let tx4 = await Location.addDirection(token, result.uid, direction);
            await tx4.wait()
            
            let tx5 = await Location.setOpeningTimes(token, result.uid, openingTimes);
            await tx5.wait()


        
            let txtariff =  await Tariff.add(token, free_tariff);
            let resulttariff = await GetEventArgumentsByNameAsync(txtariff, "AddTariff")


            let txsetMinPrice = await Tariff.setMinPrice(token, resulttariff.uid, {
                excl_vat:10,
                incl_vat:12
            })
    
            await txsetMinPrice.wait()

            let txsetMaxPrice = await Tariff.setMaxPrice(token, resulttariff.uid, {
                excl_vat:10,
                incl_vat:12
            })
    
            await txsetMaxPrice.wait()

            let time = Date.now();
            let txsetStartDateTime = await Tariff.setStartDateTime(token, resulttariff.uid, time)
            
            await txsetStartDateTime.wait()       

            let endtime = new Date();
            endtime.setDate(endtime.getDate() + 300);

            let txsetEndDateTime = await Tariff.setEndDateTime(token, resulttariff.uid, endtime.getTime())

            await txsetEndDateTime.wait()         


            let txsetEnergyMix = await Tariff.setEnergyMix(token, resulttariff.uid, energy_mix)
            await txsetEnergyMix.wait()

            let {EVSEdata, EVSEmeta, image, connector} = getEvseData();
            
            let addEvse =  await EVSE.add(token, EVSEdata, result.uid);

            let resultEvse = await GetEventArgumentsByNameAsync(addEvse, "AddEVSE")


            let txsetMeta = await EVSE.setMeta(token, resultEvse.uid, EVSEmeta)
            await txsetMeta.wait()

            let txaddImage = await EVSE.addImage(token, resultEvse.uid, image);
            await txaddImage.wait()


            let maxConnectors = Math.floor(Math.random() * 4);

            if(maxConnectors == 0)
                maxConnectors = 1;

            for (let index = 0; index < maxConnectors; index++) {

                let conn = connector;

                conn.standard = Math.floor(Math.random() * 7)

                if(conn.standard == 0)
                    conn.standard = 1;

                let addConnector =  await Connector.add(token, conn, resultEvse.uid);

                
                let resultconn = await GetEventArgumentsByNameAsync(addConnector, "AddConnector")

                await Connector.setTariffs(token, resultconn.uid, resulttariff.uid)
                
            }
    
        } catch (error) {
            console.log(error)
        }


    }


})