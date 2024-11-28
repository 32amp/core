
const { expect } = require('chai');



const {deploy} = require("./lib/deploy");
const {auth} = require("./lib/auth");
const {getEvseData} = require("./lib/evse_data");
const {GetEventArgumentsByNameAsync} = require("../utils/IFBUtils");

before(async function() {
    const tgtoken = "6421082813:AAHEX0kUk18YM3yhwecw37Pbfo6hnVTvAno";
    const accounts = await ethers.getSigners();
    this.owner = accounts[0].address

    this.sudoUser = {
        login: ethers.encodeBytes32String("sudo"),
        password: ethers.encodeBytes32String("433455"),
        token:null
    }


    this.contracts = await deploy(tgtoken,this.sudoUser,{User:true,Auth:true,Location:true,LocationSearch:true,EVSE:true})

    const {sudoUser, testUser} = await auth(this.contracts.Auth)

    this.sudoUser = sudoUser;
    this.testUser = testUser;

    console.log("sudoUser", sudoUser)
    console.log("testUser", testUser)


    const location = {
        name: "New location",
        _address: "Dom kolotuskina",
        city:  ethers.encodeBytes32String("Moskow"),
        postal_code: ethers.encodeBytes32String("103892"),
        state: ethers.encodeBytes32String("Moskow"),
        country: ethers.encodeBytes32String("RUS"),
        coordinates: {
            latitude: "59.694982",
            longtitude: "30.416469"
        },
        parking_type: 5,
        facilities: [1,2], // Hotel, Restaurant
        time_zone : "Moskow/Europe",
        charging_when_closed: true,
        publish: true
    };

    const tx = await this.contracts.UserAccess.setAccessLevelToModule(this.sudoUser.token,2,"Location", 4);
    await tx.wait()

    const tx2 =  await this.contracts.Location.addLocation(this.testUser.token, location);
    await tx2.wait()
})



describe("EVSE", function(){
    const {EVSEdata, EVSEmeta, image} = getEvseData();

    it("add", async function(){
        let tx = await this.contracts.UserAccess.setAccessLevelToModule(this.sudoUser.token,2,"EVSE", 4);
        await tx.wait()

        const tx2 =  await this.contracts.EVSE.add(this.testUser.token, EVSEdata, 1);

        let result = await GetEventArgumentsByNameAsync(tx2, "AddEVSE")
        expect(result.uid).to.equal(1)
        expect(result.partner_id).to.equal(1)

    })

    it("setMeta", async function(){
        let tx = await this.contracts.EVSE.setMeta(this.testUser.token, 1, EVSEmeta)
        await tx.wait()
    })

    it("addImage", async function(){
        let tx = await this.contracts.EVSE.addImage(this.testUser.token, 1, image);
        await tx.wait()
    })

    it("get", async function(){
        const evse = await this.contracts.EVSE.get(1)

        expect(evse.evse.evse_id).to.equal(EVSE.evse_id)
        expect(evse.evse.evse_model).to.equal(EVSE.evse_model)
        expect(evse.evse.physical_reference).to.equal(EVSE.physical_reference)
        expect(evse.evse.directions.language).to.equal(EVSE.directions.language)
        expect(evse.evse.directions.text).to.equal(EVSE.directions.text)

        expect(evse.meta.status_schedule.begin).to.equal(EVSEmeta.status_schedule.begin)
        expect(evse.meta.status_schedule.end).to.equal(EVSEmeta.status_schedule.end)
        expect(evse.meta.status_schedule.status).to.equal(EVSEmeta.status_schedule.status)
        expect(evse.meta.capabilities[0]).to.equal(EVSEmeta.capabilities[0])
        expect(evse.meta.coordinates.latitude).to.equal(EVSEmeta.coordinates.latitude)
        expect(evse.meta.coordinates.longtitude).to.equal(EVSEmeta.coordinates.longtitude)
        expect(evse.meta.parking_restrictions[0]).to.equal(EVSEmeta.parking_restrictions[0])
        expect(evse.meta.floor_level).to.equal(EVSEmeta.floor_level)


        expect(evse.images[0].url).to.equal(image.url)
        expect(evse.images[0].thumbnail).to.equal(image.thumbnail)
        expect(evse.images[0].category).to.equal(image.category)
        expect(evse.images[0]._type).to.equal(image._type)
        expect(evse.images[0].width).to.equal(image.width)
        expect(evse.images[0].height).to.equal(image.height)

    })



    it("removeImage", async function(){
        let tx = await this.contracts.EVSE.removeImage(this.testUser.token, 1, 1); 
        await tx.wait()

        const evse = await this.contracts.EVSE.get(1);
        expect(evse.images.length).to.equal(0)
    })



    it("getlocation check evse ", async function(){
        const {EVSE, EVSEmeta, image, connector} = getEvseData();

        let tx = await this.contracts.Location.addEVSE(this.testUser.token, 1, 1);
        await tx.wait()


        const loc = await this.contracts.Location.getLocation(1);

        expect(loc.evses[0].evse.evse_id).to.equal(EVSE.evse_id)
        expect(loc.evses[0].evse.evse_model).to.equal(EVSE.evse_model)
        expect(loc.evses[0].evse.physical_reference).to.equal(EVSE.physical_reference)
        expect(loc.evses[0].evse.directions.language).to.equal(EVSE.directions.language)
        expect(loc.evses[0].evse.directions.text).to.equal(EVSE.directions.text)

        expect(loc.evses[0].meta.status_schedule.begin).to.equal(EVSEmeta.status_schedule.begin)
        expect(loc.evses[0].meta.status_schedule.end).to.equal(EVSEmeta.status_schedule.end)
        expect(loc.evses[0].meta.status_schedule.status).to.equal(EVSEmeta.status_schedule.status)
        expect(loc.evses[0].meta.capabilities[0]).to.equal(EVSEmeta.capabilities[0])
        expect(loc.evses[0].meta.coordinates.latitude).to.equal(EVSEmeta.coordinates.latitude)
        expect(loc.evses[0].meta.coordinates.longtitude).to.equal(EVSEmeta.coordinates.longtitude)
        expect(loc.evses[0].meta.parking_restrictions[0]).to.equal(EVSEmeta.parking_restrictions[0])
        expect(loc.evses[0].meta.floor_level).to.equal(EVSEmeta.floor_level)


/* 

        expect(loc.evses[0].connectors[0].connector.standard).to.equal(connector.standard)
        expect(loc.evses[0].connectors[0].connector.format).to.equal(connector.format)
        expect(loc.evses[0].connectors[0].connector.power_type).to.equal(connector.power_type)
        expect(loc.evses[0].connectors[0].connector.max_voltage).to.equal(connector.max_voltage)
        expect(loc.evses[0].connectors[0].connector.max_amperage).to.equal(connector.max_amperage)
        expect(loc.evses[0].connectors[0].connector.max_electric_power).to.equal(connector.max_electric_power)
        expect(loc.evses[0].connectors[0].connector.terms_and_conditions_url).to.equal(connector.terms_and_conditions_url)
        expect(loc.evses[0].connectors[0].status).to.equal(0)
*/

    })

    it("removeEVSE", async function(){
        await this.contracts.Location.removeEVSE(this.testUser.token, 1, 1); 
        
        const newLocation = await this.contracts.Location.getLocation(1);
        expect(newLocation[4].length).to.equal(0)
    })
})

