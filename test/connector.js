
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


    this.contracts = await deploy(tgtoken,this.sudoUser,{User:true,Auth:true,Location:true,LocationSearch:true,EVSE:true, Connector:true})

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


    const tx = await this.contracts.UserAccess.setAccessLevelToModule(this.sudoUser.token,2,"EVSE", 4);
    await tx.wait()

    const tx1 = await this.contracts.UserAccess.setAccessLevelToModule(this.sudoUser.token,2,"Connector", 4);
    await tx1.wait()


    const tx2 = await this.contracts.UserAccess.setAccessLevelToModule(this.sudoUser.token,2,"Location", 4);
    await tx2.wait()

    const tx3 =  await this.contracts.Location.addLocation(this.testUser.token, location);
    await tx3.wait()

    const {EVSEdata} = getEvseData();
    const tx4 =  await this.contracts.EVSE.add(this.testUser.token, EVSEdata, 1);
    tx4.wait()
})




describe("Connector", function(){
    const {connector} = getEvseData();

    it("add", async function(){

        const tx2 =  await this.contracts.Connector.add(this.testUser.token, connector, 1);

        let result = await GetEventArgumentsByNameAsync(tx2, "AddConnector")
        expect(result.uid).to.equal(1)
        expect(result.partner_id).to.equal(1)
    })
})