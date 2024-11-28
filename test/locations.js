
const { expect } = require('chai');



const {deploy} = require("./lib/deploy");
const {auth} = require("./lib/auth");
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


    this.contracts = await deploy(tgtoken,this.sudoUser,{User:true,Auth:true,Location:true, LocationSearch:true})

    const {sudoUser, testUser} = await auth(this.contracts.Auth)

    this.sudoUser = sudoUser;
    this.testUser = testUser;

    console.log("sudoUser", sudoUser)
    console.log("testUser", testUser)
})





describe("Locations", function(){

    const {location,relatedLocation,image,direction,openingTimes} = require("./lib/location_data")

    it("AddLocation", async function(){

        const tx = await this.contracts.UserAccess.setAccessLevelToModule(this.sudoUser.token,2,"Location", 4);
        await tx.wait()

        const tx2 =  await this.contracts.Location.addLocation(this.testUser.token, location);

        let result = await GetEventArgumentsByNameAsync(tx2, "AddLocation")
        expect(result.uid).to.equal(1)
        expect(result.partner_id).to.equal(1)
    })

    it("addRelatedLocation", async function(){

        let tx = await this.contracts.Location.addRelatedLocation(this.testUser.token, 1, relatedLocation);
        await tx.wait()

    })

    it("addImage", async function(){
        let tx = await this.contracts.Location.addImage(this.testUser.token, 1, image);
        await tx.wait()
    })

    it("addDirection", async function(){
        let tx = await this.contracts.Location.addDirection(this.testUser.token, 1, direction);
        await tx.wait()
    })


    it("setOpeningTimes", async function(){
        let tx = await this.contracts.Location.setOpeningTimes(this.testUser.token, 1, openingTimes);
        await tx.wait()
    })

    it("getLocation", async function(){

        
        const newLocation = await this.contracts.Location.getLocation(1);
        
        expect(newLocation.location.uid,"uid").to.equal(1)
        expect(newLocation.location.city).to.equal(location.city)
        expect(newLocation.location.postal_code).to.equal(location.postal_code)
        expect(newLocation.location.state).to.equal(location.state)
        expect(newLocation.location.country).to.equal(location.country)

        expect(newLocation.location.coordinates.latitude).to.equal(ethers.parseEther(location.coordinates.latitude))
        expect(newLocation.location.coordinates.longtitude).to.equal(ethers.parseEther(location.coordinates.longtitude))
        expect(newLocation.location.parking_type).to.equal(location.parking_type)
        expect(newLocation.location.facilities.join(",")).to.equal(location.facilities.join(","))
        expect(newLocation.location.time_zone).to.equal(location.time_zone)
        //expect(newLocation.location.charging_when_closed, "charging_when_closed").to.equal(location.charging_when_closed)
        // relatedlocation
        expect(newLocation.related_locations[0].latitude).to.equal(relatedLocation.latitude)
        expect(newLocation.related_locations[0].longtitude).to.equal(relatedLocation.longtitude)
        expect(newLocation.related_locations[0].name[0].language).to.equal(relatedLocation.name[0].language)
        expect(newLocation.related_locations[0].name[0].text).to.equal(relatedLocation.name[0].text)
        //image
        expect(newLocation.images[0].url).to.equal(image.url)
        expect(newLocation.images[0].thumbnail).to.equal(image.thumbnail)
        expect(newLocation.images[0].category).to.equal(image.category)
        expect(newLocation.images[0]._type).to.equal(image._type)
        expect(newLocation.images[0].width).to.equal(image.width)
        expect(newLocation.images[0].height).to.equal(image.height)

        //OpeningTimes
        //expect(newLocation.opening_times.twentyfourseven, "twentyfourseven").to.equal(openingTimes.twentyfourseven)
        expect(newLocation.opening_times.regular_hours.week_day).to.equal(openingTimes.regular_hours.week_day)
        expect(newLocation.opening_times.regular_hours.period_begin).to.equal(openingTimes.regular_hours.period_begin)
        expect(newLocation.opening_times.regular_hours.period_end).to.equal(openingTimes.regular_hours.period_end)
        expect(newLocation.opening_times.exceptional_openings.begin).to.equal(openingTimes.exceptional_openings.begin)
        expect(newLocation.opening_times.exceptional_openings.end).to.equal(openingTimes.exceptional_openings.end)
        expect(newLocation.opening_times.exceptional_closings.begin).to.equal(openingTimes.exceptional_closings.begin)
        expect(newLocation.opening_times.exceptional_closings.end).to.equal(openingTimes.exceptional_closings.end)

        // Direction
        expect(newLocation.directions[0].language).to.equal(direction.language)
        expect(newLocation.directions[0].text).to.equal(direction.text)

    })


    it("removeRelatedLocation", async function(){
        let tx = await this.contracts.Location.removeRelatedLocation(this.testUser.token, 1, 1); 
        await tx.wait()

        const newLocation = await this.contracts.Location.getLocation(1);
        expect(newLocation.related_locations.length).to.equal(0)
    })

    it("removeImage", async function(){
        let tx = await this.contracts.Location.removeImage(this.testUser.token, 1, 1); 
        await tx.wait()

        const newLocation = await this.contracts.Location.getLocation(1);
        expect(newLocation.images.length).to.equal(0)
    })

    it("removeDirection", async function(){
        let tx = await this.contracts.Location.removeDirection(this.testUser.token, 1, 1); 
        await tx.wait()

        const newLocation = await this.contracts.Location.getLocation(1);
        expect(newLocation.directions.length).to.equal(0)
    })




})

