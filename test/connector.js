
const { expect } = require('chai');



const {deploy} = require("./lib/deploy");
const {getEvseData} = require("./lib/evse_data");

const {GetEventArgumentsByNameAsync} = require("../utils/IFBUtils");

before(async function() {
    const accounts = await ethers.getSigners();
    this.owner = accounts[0].address
    this.adminUser = accounts[1].address

    this.contracts = await deploy({User:true,Location:true,LocationSearch:true,EVSE:true, Connector:true})


    const {location} = require("./lib/location_data");


    const tx = await this.contracts.UserAccess.setAccessLevelToModule(this.adminUser,"EVSE", 4);
    await tx.wait()

    const tx1 = await this.contracts.UserAccess.setAccessLevelToModule(this.adminUser,"Connector", 4);
    await tx1.wait()


    const tx2 = await this.contracts.UserAccess.setAccessLevelToModule(this.adminUser,"Location", 4);
    await tx2.wait()

    const tx3 =  await this.contracts.Location.addLocation(location);
    await tx3.wait()

    const {EVSEdata} = getEvseData();
    const tx4 =  await this.contracts.EVSE.add( EVSEdata, 1);
    tx4.wait()
})




describe("Connector", function(){
    const {connector} = getEvseData();

    it("add", async function(){
        const tx2 =  await this.contracts.Connector.add( connector, 1);

        let result = await GetEventArgumentsByNameAsync(tx2, "AddConnector")
        expect(result.uid).to.equal(1)
        expect(result.partner_id).to.equal(1)
    })
})