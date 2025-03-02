
const { expect } = require('chai');



const {deploy} = require("./lib/deploy");

const {getEvseData} = require("./lib/evse_data");
const {getEventArguments} = require("../utils/utils");

before(async function() {
    const accounts = await ethers.getSigners();
    this.owner = accounts[0]
    this.adminUser = accounts[1]

    const {location} = require("./lib/location_data");

    this.contracts = await deploy({User:true,Auth:true,Location:true,LocationSearch:true,EVSE:true})

    const tx = await this.contracts.UserAccess.setAccessLevelToModule(this.adminUser.address,"Location", 4);
    await tx.wait()

    const tx2 =  await this.contracts.Location.connect(this.adminUser).addLocation(location);
    await tx2.wait()
})



describe("EVSE", function(){
    const {EVSEdata, EVSEmeta, image} = getEvseData();

    it("add", async function(){
        let tx = await this.contracts.UserAccess.setAccessLevelToModule(this.adminUser.address,"EVSE", 4);
        await tx.wait()

        const tx2 =  await this.contracts.EVSE.connect(this.adminUser).add(EVSEdata, 1);

        let result = await getEventArguments(tx2, "AddEVSE")
        expect(result.uid).to.equal(1)
        expect(result.partner_id).to.equal(1)

    })

    it("setMeta", async function(){
        let tx = await this.contracts.EVSE.connect(this.adminUser).setMeta(1, EVSEmeta)
        await tx.wait()
    })

    it("addImage", async function(){
        let tx = await this.contracts.EVSE.connect(this.adminUser).addImage(1, image);
        await tx.wait()
    })

    it("get", async function(){
        const evse = await this.contracts.EVSE.get(1)

        expect(evse.evse.evse_id).to.equal(EVSEdata.evse_id)
        expect(evse.evse.evse_model).to.equal(EVSEdata.evse_model)
        expect(evse.evse.physical_reference).to.equal(EVSEdata.physical_reference)
        expect(evse.evse.directions.language).to.equal(EVSEdata.directions.language)
        expect(evse.evse.directions.text).to.equal(EVSEdata.directions.text)

        expect(evse.meta.status_schedule.begin).to.equal(EVSEmeta.status_schedule.begin)
        expect(evse.meta.status_schedule.end).to.equal(EVSEmeta.status_schedule.end)
        expect(evse.meta.status_schedule.status).to.equal(EVSEmeta.status_schedule.status)
        expect(evse.meta.capabilities[0]).to.equal(EVSEmeta.capabilities[0])
        expect(evse.meta.coordinates.latitude).to.equal(EVSEmeta.coordinates.latitude)
        expect(evse.meta.coordinates.longitude).to.equal(EVSEmeta.coordinates.longitude)
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
        let tx = await this.contracts.EVSE.connect(this.adminUser).removeImage( 1, 1); 
        await tx.wait()

        const evse = await this.contracts.EVSE.get(1);
        expect(evse.images.length).to.equal(0)
    })



    it("getlocation check evse ", async function(){
        const {EVSEdata, EVSEmeta} = getEvseData();

        let tx = await this.contracts.Location.connect(this.adminUser).addEVSE( 1, 1);
        await tx.wait()


        const loc = await this.contracts.Location.getLocation(1);

        expect(loc.evses[0].evse.evse_id).to.equal(EVSEdata.evse_id)
        expect(loc.evses[0].evse.evse_model).to.equal(EVSEdata.evse_model)
        expect(loc.evses[0].evse.physical_reference).to.equal(EVSEdata.physical_reference)
        expect(loc.evses[0].evse.directions.language).to.equal(EVSEdata.directions.language)
        expect(loc.evses[0].evse.directions.text).to.equal(EVSEdata.directions.text)

        expect(loc.evses[0].meta.status_schedule.begin).to.equal(EVSEmeta.status_schedule.begin)
        expect(loc.evses[0].meta.status_schedule.end).to.equal(EVSEmeta.status_schedule.end)
        expect(loc.evses[0].meta.status_schedule.status).to.equal(EVSEmeta.status_schedule.status)
        expect(loc.evses[0].meta.capabilities[0]).to.equal(EVSEmeta.capabilities[0])
        expect(loc.evses[0].meta.coordinates.latitude).to.equal(EVSEmeta.coordinates.latitude)
        expect(loc.evses[0].meta.coordinates.longitude).to.equal(EVSEmeta.coordinates.longitude)
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
        await this.contracts.Location.connect(this.adminUser).removeEVSE(1, 1); 
        
        const newLocation = await this.contracts.Location.getLocation(1);
        expect(newLocation[4].length).to.equal(0)
    })
})

