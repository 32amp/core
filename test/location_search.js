
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


    const tx = await this.contracts.UserAccess.setAccessLevelToModule(this.sudoUser.token,2,"Location", 4);
    await tx.wait()

    console.log("sudoUser", sudoUser)
    console.log("testUser", testUser)
    
})


describe("LocationSearch", function(){


    it("inArea all kirov zavod without locations", async function(){

        const locations = await this.contracts.LocationSearch.inArea({
            publish: true, 
            topRightLat:"59.883143",
            topRightLong:"30.270558",
            bottomLeftLat:"59.870363",
            bottomLeftLong:"30.247867", 
            offset:0, 
            connectors:[1], 
            onlyFreeConnectors:true,
            max_payment_by_kwt:0,
            max_payment_buy_time:0,
            favorite_evse:[]
        })
        expect(locations[0].length).to.equal(0)
    })
    
    it("addlocations", async function(){
        const fs = require('fs');
        const coords = JSON.parse( fs.readFileSync(__dirname+"/../coords.json", 'utf8'))
        const {location} = require("./lib/location_data")

        
        for (let index = 0; index < coords.length; index++) {
            const coord = coords[index];
            const loc = location;

            loc.coordinates.latitude = coord.lat;
            loc.coordinates.longtitude = coord.lon;
            
            let tx = await this.contracts.Location.addLocation(this.testUser.token, loc);

            let result = await GetEventArgumentsByNameAsync(tx, "AddLocation")
            console.log("add location", index)

            let newLocation = await this.contracts.Location.getLocation(Number(result.uid));
            expect(newLocation[0].coordinates.latitude, "Location latitude "+result.uid).to.equal(ethers.parseEther(loc.coordinates.latitude))
            expect(newLocation[0].coordinates.longtitude, "Location longtitude "+result.uid).to.equal(ethers.parseEther(loc.coordinates.longtitude))

        }
    })

    it("inArea all kirov zavod", async function(){

        const locations = await this.contracts.LocationSearch.inArea({
            publish: true, 
            topRightLat:"59.883143",
            topRightLong:"30.270558",
            bottomLeftLat:"59.870363",
            bottomLeftLong:"30.247867", 
            offset:0, 
            connectors:[1], 
            onlyFreeConnectors:true,
            max_payment_by_kwt:0,
            max_payment_buy_time:0,
            favorite_evse:[]
        })
        expect(locations[0].length).to.equal(2)
    })

    it("inArea all saint petersburg", async function(){

        // all saint petersburg
        const locations = await this.contracts.LocationSearch.inArea({
            publish: true, 
            topRightLat:"60.133835",
            topRightLong:"30.933217",
            bottomLeftLat:"59.630048",
            bottomLeftLong:"29.649831", 
            offset:0, 
            connectors:[1], 
            onlyFreeConnectors:true,
            max_payment_by_kwt:0,
            max_payment_buy_time:0,
            favorite_evse:[]
        })

        expect(locations[0].length).to.equal(50)
    })


    it("inArea all saint petersburg with offset", async function(){

        // all saint petersburg
        const locations = await this.contracts.LocationSearch.inArea({
            publish: true, 
            topRightLat:"60.133835",
            topRightLong:"30.933217",
            bottomLeftLat:"59.630048",
            bottomLeftLong:"29.649831", 
            offset:50, 
            connectors:[1], 
            onlyFreeConnectors:true,
            max_payment_by_kwt:0,
            max_payment_buy_time:0,
            favorite_evse:[]
        })

        expect(locations[0].length).to.equal(23)
    })



    it("inAreaMany", async function(){

        let locations_1 = await this.contracts.LocationSearch.inArea({
            publish: true, 
            topRightLat:"66.537305",
            topRightLong:"177.814396",
            bottomLeftLat:"43.146425",
            bottomLeftLong:"11.585331",
            offset:0, 
            connectors:[1], 
            onlyFreeConnectors:true,
            max_payment_by_kwt:0,
            max_payment_buy_time:0,
            favorite_evse:[]
        })
        
        expect(locations_1[1]).to.equal(1145n)

    })

    it("inAreaMany with offset", async function(){

        let locations_1 = await this.contracts.LocationSearch.inArea({
            publish: true, 
            topRightLat:"66.537305",
            topRightLong:"177.814396",
            bottomLeftLat:"43.146425",
            bottomLeftLong:"11.585331",
            offset:50, 
            connectors:[1], 
            onlyFreeConnectors:true,
            max_payment_by_kwt:0,
            max_payment_buy_time:0,
            favorite_evse:[]
        })
        
        expect(locations_1[0].length).to.equal(50)

    })

}) 