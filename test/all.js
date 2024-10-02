const { expect }   =   require('chai');
const hubModule = require("../ignition/modules/Hub");
const userModule = require("../ignition/modules/User");
const UserGroupsModule = require("../ignition/modules/UserGroups");
const LocationsModule = require("../ignition/modules/Locations");
const UserAccessModule = require("../ignition/modules/UserAccess");
const MessageOracleModule = require("../ignition/modules/MessageOracle");


const {GetEventArgumentsByNameAsync, createpayload,verifyTelegramWebAppData} = require("../utils/IFBUtils");

before(async function() {


    accounts = await ethers.getSigners();

    this.testUser = {
        login: ethers.encodeBytes32String("darkrain"),
        password: ethers.encodeBytes32String("159753"),
    }

    this.sudoUser = {
        login: ethers.encodeBytes32String("sudo"),
        password: ethers.encodeBytes32String("433455"),
        token:null
    }

    const tg_bot_token = ethers.toUtf8Bytes("7137095373:AAFxe-tRpq3MqhhfZ4xKAsRQtMUWTsZ4CPo")

    this.owner = accounts[0].address;
    this.anotherUser = accounts[1]

    console.log("Deploying Contracts...");
   

    //
    
    const HubDeploy = await ignition.deploy(hubModule);

    this.Hub = HubDeploy.hub;
    await this.Hub.initialize()

    console.log("Hub deployed to:", this.Hub.target);

    let tx = await this.Hub.addPartner(
        ethers.encodeBytes32String("PortalEnergy"),
        ethers.toUtf8Bytes("RU"),
        ethers.toUtf8Bytes("POE"),
        this.owner
    );

    this.partner = await GetEventArgumentsByNameAsync(tx, "AddPartner")

    //
    const MessageOracle = await ignition.deploy(MessageOracleModule);

    this.MessageOracle = MessageOracle.MessageOracle;

    await this.MessageOracle.initialize(60n, 1n, false, "Message: [message]")

    console.log("MessageOracle for SMS deployed to:", this.MessageOracle.target);
    

    //
    const UserDeploy = await ignition.deploy(userModule);
    
    this.User = UserDeploy.user;

    this.User.initialize(this.partner.id,this.Hub.target, this.MessageOracle.target, this.MessageOracle.target, this.sudoUser.login, this.sudoUser.password, tg_bot_token)

    this.Hub.addModule("User", this.User.target)

    console.log("User deployed to:", this.User.target);
    await this.MessageOracle.refill(this.User.target,{value:10n});



    const UserGroupsDeploy = await ignition.deploy(UserGroupsModule);
    this.UserGroups = UserGroupsDeploy.UserGroups;
    this.UserGroups.initialize(this.partner.id,this.Hub.target)

    this.Hub.addModule("UserGroups", this.UserGroups.target);
    console.log("UserGroups deployed to:", this.UserGroups.target);



    const LocationDeploy = await ignition.deploy(LocationsModule);
    this.Location = await LocationDeploy.Locations;
    
    this.Location.initialize(this.partner.id,this.Hub.target)

    this.Hub.addModule("Location", this.Location.target);
    console.log("Location deployed to:", this.Location.target);

    const UserAccessDeploy = await ignition.deploy(UserAccessModule);
    this.UserAccess = UserAccessDeploy.UserAccess;
    this.UserAccess.initialize(this.partner.id,this.Hub.target)

    this.Hub.addModule("UserAccess", this.UserAccess.target);
    console.log("UserAccess deployed to:", this.UserAccess.target);

})


describe("Hub", function(){


    it("getMe", async function(){
        const me = await this.Hub.me();

        expect(me.owner_address).to.equal(this.owner)
    })


    it("getPartnerByAddress", async function(){
        const me = await this.Hub.getPartnerByAddress(this.owner);

        expect(me.owner_address).to.equal(this.owner)
    })

    it("getPartnerIdByAddress", async function(){
        const id = await this.Hub.getPartnerIdByAddress(this.owner);

        expect(1).to.equal(id)
    })


    it("getPartner", async function(){
        const me = await this.Hub.getPartner(1);

        expect(me.owner_address).to.equal(this.owner)
    })

    it("getPartnerModules", async function(){
        const modules = await this.Hub.getPartnerModules(1);
        
        expect(modules[0]).to.equal("User")
        expect(modules[1]).to.equal("UserGroups")
        expect(modules[2]).to.equal("Location")
        expect(modules[3]).to.equal("UserAccess")
        //
    })


    it("getPartners", async function(){
        const partners = await this.Hub.getPartners()

        expect(partners.length).to.equal(1)
    })

    it("changeModuleAddress", async function(){
        await this.Hub.changeModuleAddress("User", this.Hub.target)

        let moduleAdress = await this.Hub.getModule("User", 1)
        expect(moduleAdress).to.equal(this.Hub.target)

        await this.Hub.changeModuleAddress("User", this.User.target)
        let moduleAdressBack = await this.Hub.getModule("User", 1)
        expect(moduleAdressBack).to.equal(this.User.target)
    })

    it("checkModuleExist", async function(){
        let checkOne = await this.Hub.checkModuleExist("User", 1)

        expect(checkOne).to.equal(this.User.target)

    })

    it("getPartnerByAddress", async function(){
        let partner = await this.Hub.getPartnerByAddress(this.owner);

        expect(partner.id).to.equal(1n)
    })

    it("getPartnerIdByAddress", async function(){
        let partner = await this.Hub.getPartnerIdByAddress(this.owner)
        expect(partner).to.equal(1n)
    })

    it("getPartnerName", async function(){
        let name = await this.Hub.getPartnerName(1n)

        expect(name).to.equal(ethers.encodeBytes32String("PortalEnergy"))
    })

    it("getPartnerPartyId", async function(){
        let partyId = await this.Hub.getPartnerPartyId(1n)

        expect(partyId).to.equal(ethers.hexlify(ethers.toUtf8Bytes("POE")))
    })

    it("getPartnerCountryCode", async function(){
        let code = await this.Hub.getPartnerCountryCode(1n)
        
        expect(code).to.equal(ethers.hexlify(ethers.toUtf8Bytes("RU")))
    })
})


describe("User", function(){


    it("authSudoUser", async function(){
        let auth = await this.User.authByPassword(this.sudoUser.login,this.sudoUser.password)
        let authSuccess = await GetEventArgumentsByNameAsync(auth, "CreateAuthToken")

        let token = await this.User.getAuthToken(this.sudoUser.login,this.sudoUser.password, authSuccess.token_id)

        this.sudoUser.token = token[1];        

        expect(token[1].length).to.equal(66)
    })


    it("registerByPassword", async function(){
        let register = await this.User.registerByPassword(this.testUser.login,this.testUser.password)
        await register.wait()

        let auth = await this.User.authByPassword(this.testUser.login,this.testUser.password)
        let authSuccess = await GetEventArgumentsByNameAsync(auth, "CreateAuthToken")

        let token = await this.User.getAuthToken(this.testUser.login,this.testUser.password, authSuccess.token_id)

        this.testUser.token = token[1];        

        expect(token[1].length).to.equal(66)
    })



    it("isLogin", async function(){
        const isLogin =  await this.User.isLogin(this.testUser.token);

        expect(Number(isLogin)).to.equal(2)
    })


    it("whoami", async function(){
        const whoami =  await this.User.whoami(this.testUser.token);

        expect(whoami.enable).to.equal(true);
        expect(whoami.user_type).to.equal(0);
        expect(whoami.last_updated).not.to.equal(0);

        expect(whoami.username.toString() == this.testUser.login).to.equal(true)
    })

    it("setTestUserByPhone", async function(){
        await this.User.setTestUserByPhone(ethers.encodeBytes32String("+79999999998"), ethers.encodeBytes32String("8888"));
    })

    it("sendSmsForAuth, authBySmsCode", async function(){

        await this.User.sendSmsForAuth(ethers.encodeBytes32String("+79999999998"))

        let auth = await this.User.authBySmsCode(ethers.encodeBytes32String("+79999999998"), ethers.encodeBytes32String("8888"))
        let authSuccess = await GetEventArgumentsByNameAsync(auth, "CreateAuthToken")

        let token = await this.User.getAuthToken(this.testUser.login,this.testUser.password, authSuccess.token_id)

        this.testUser.token = token[1];        

        expect(token[1].length).to.equal(66)
    })



    it("setTestEmailByPhone", async function(){
        await this.User.setTestUserByEmail(ethers.encodeBytes32String("test@example.com"), ethers.encodeBytes32String("8888"));
    })

    it("sendEmailForAuth, authByEmailCode", async function(){

        await this.User.sendEmailForAuth(ethers.encodeBytes32String("test@example.com"))

        let auth = await this.User.authByEmailCode(ethers.encodeBytes32String("test@example.com"), ethers.encodeBytes32String("8888"))
        let authSuccess = await GetEventArgumentsByNameAsync(auth, "CreateAuthToken")

        let token = await this.User.getAuthToken(this.testUser.login,this.testUser.password, authSuccess.token_id)

        this.testUser.token = token[1];        

        expect(token[1].length).to.equal(66)
    })


    it("authByTg", async function (){
        const user_token = "user=%7B%22id%22%3A14097%2C%22first_name%22%3A%22Artem%22%2C%22last_name%22%3A%22Timofeev%22%2C%22username%22%3A%22timas%22%2C%22language_code%22%3A%22ru%22%2C%22is_premium%22%3Atrue%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-237986505224524480&chat_type=channel&auth_date=1718456760&hash=92ec5dcf30d621ad100042109975eff18dfbe403a525158a4d1b5dedb9f059af";


        const initData = new URLSearchParams(user_token);
        const payload = createpayload(initData)

        const user_data = JSON.parse(initData.get("user")); 

        const web_app_data = {
            id: user_data.id,
            first_name: ethers.encodeBytes32String(user_data.first_name),
            last_name:ethers.encodeBytes32String(user_data.last_name),
            language_code:ethers.encodeBytes32String(user_data.language_code),
        }
        
        let auth = await this.User.authByTg(ethers.toUtf8Bytes(payload), "0x"+initData.get("hash"), web_app_data)
        let authSuccess = await GetEventArgumentsByNameAsync(auth, "CreateAuthToken")

        let token = await this.User.getAuthToken(this.testUser.login,this.testUser.password, authSuccess.token_id)

        this.testUser.token = token[1];        

        expect(token[1].length).to.equal(66)
    })


    it("addCar, getCars, removeCar", async function(){
        await this.User.addCar(this.testUser.token,0,{
            brand:"Tesla",
            model:"Model 3",
            connectors: [1,2]
        })

        const cars = await this.User.getCars(this.testUser.token, 0)

        expect(cars[0].brand).to.equal("Tesla")

        await this.User.removeCar(this.testUser.token, 0,0)

        const cars_zero = await this.User.getCars(this.testUser.token,0)

        expect(cars_zero.length).to.equal(0)
    })

    it("updateBaseData", async function(){
        await this.User.updateBaseData(this.testUser.token, 0, ethers.encodeBytes32String("Pavel"),ethers.encodeBytes32String("Durov"),ethers.encodeBytes32String("en"))
        let whoami =  await this.User.whoami(this.testUser.token);
        expect(whoami.first_name.toString()).to.equal( ethers.encodeBytes32String("Pavel").toString())

        await this.User.updateBaseData(this.sudoUser.token, whoami.id, ethers.encodeBytes32String("Nikolay"),ethers.encodeBytes32String("Durov"),ethers.encodeBytes32String("en"))

        whoami = await this.User.whoami(this.testUser.token);
        expect(whoami.first_name.toString()).to.equal( ethers.encodeBytes32String("Nikolay").toString())
    })

    it("updateCompanyInfo", async function(){
        await this.User.updateCompanyInfo(this.testUser.token, 0, {
            name: "Portal",
            description: "Wow",
            inn:1212,
            kpp: 121212,
            ogrn: 8767,
            bank_account: 1212121,
            bank_name: "SuperBank",
            bank_bik: 3232234234,
            bank_corr_account: 66543,
            bank_inn: 51442456,
            bank_kpp_account: 787878
        })

        let info = await this.User.getCompanyInfo(this.testUser.token, 0)
        
        expect(info.name).to.equal("Portal")
    })

})



describe("UserAccess", function(){
    it("sudo getMyModulesAccess", async function(){

        const accesModules =  await this.UserAccess.getMyModulesAccess(this.sudoUser.token);
    
        expect(accesModules[1][0]).to.equal(6)
        expect(accesModules[1][1]).to.equal(6)
    })

    it("sudo getModuleAccessLevel", async function(){

        const accessToGroup =  await this.UserAccess.getModuleAccessLevel("UserGroups", 1);
        expect(accessToGroup).to.equal(6)
    })

    it("setAccessLevelToModule", async function(){
        const tx = await this.UserAccess.setAccessLevelToModule(this.sudoUser.token,2,"User", 6);
        tx.wait()

        const result = await this.UserAccess.getModuleAccessLevel("User",2)

        expect(result).to.equal(6);
    })
})



describe("UserGroups", function(){
    it("getMyGroups", async function(){
        
        const myGroups =  await this.UserGroups.getMyGroups(this.sudoUser.token);
        expect(myGroups.length).to.equal(1)
        expect(myGroups[0].name).to.equal("sudo")
    })

    it("addGroup", async function(){
        await this.UserGroups.addGroup(this.sudoUser.token, "test");
        const myGroups =  await this.UserGroups.getMyGroups(this.sudoUser.token);
        expect(myGroups.length).to.equal(2)
        
    });
})



describe("Locations", function(){
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

    const image = {
        url: "https://upload.wikimedia.org/wikipedia/ru/thumb/e/e8/BORAT%21.jpg/201px-BORAT%21.jpg",
        thumbnail: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Borat_in_Cologne.jpg/220px-Borat_in_Cologne.jpg",
        category: 3,
        _type: 1,
        width: 100,
        height: 100
    };

    const relatedLocation = {
        latitude: ethers.parseEther("59.694982"),
        longtitude: ethers.parseEther("30.416469"),
        name: [{
            language: "ru",
            text: "Кафе"
        }]
    };

    const openingTimes = {
        twentyfourseven: true,
        regular_hours:[
            {
                week_day:1,
                period_begin:"7:00",
                period_end:"21:00"
            }
        ],
        exceptional_openings:[
            {
                begin:7,
                end:21
            }
        ],
        exceptional_closings:[
            {
                begin:7,
                end:21
            }
        ],
    }

    const direction = {
        language: "ru",
        text: "Заезд с улицы колотушкина, возле волшебного дуба"        
    }

    it("AddLocation", async function(){

        const tx =  await this.Location.addLocation(this.sudoUser.token, location);

        let result = await GetEventArgumentsByNameAsync(tx, "AddLocation")
        expect(result.uid).to.equal(1)
        expect(result.partner_id).to.equal(1)
    })

    it("addRelatedLocation", async function(){

        await this.Location.addRelatedLocation(1, this.sudoUser.token, relatedLocation);

    })

    it("addImage", async function(){
        await this.Location.addImage(1, this.sudoUser.token, image);
    })

    it("addDirection", async function(){
        await this.Location.addDirection(1, this.sudoUser.token, direction);
    })

    it("addEVSE", async function(){
        await this.Location.addEVSE(1, this.sudoUser.token, 1);
    })

    it("setOpeningTimes", async function(){
        await this.Location.setOpeningTimes(1, this.sudoUser.token, openingTimes);
    })

    it("getLocation", async function(){

        
        const newLocation = await this.Location.getLocation(1);
        
        expect(newLocation[0].uid).to.equal(1)
        expect(newLocation[0].city).to.equal(location.city)
        expect(newLocation[0].postal_code).to.equal(location.postal_code)
        expect(newLocation[0].state).to.equal(location.state)
        expect(newLocation[0].country).to.equal(location.country)

        expect(newLocation[0].coordinates.latitude).to.equal(ethers.parseEther(location.coordinates.latitude))
        expect(newLocation[0].coordinates.longtitude).to.equal(ethers.parseEther(location.coordinates.longtitude))
        expect(newLocation[0].parking_type).to.equal(location.parking_type)
        expect(newLocation[0].facilities.join(",")).to.equal(location.facilities.join(","))
        expect(newLocation[0].time_zone).to.equal(location.time_zone)
        expect(newLocation[0].charging_when_closed).to.equal(location.charging_when_closed)
        // relatedlocation
        expect(newLocation[1][0].latitude).to.equal(relatedLocation.latitude)
        expect(newLocation[1][0].longtitude).to.equal(relatedLocation.longtitude)
        expect(newLocation[1][0].name[0].language).to.equal(relatedLocation.name[0].language)
        expect(newLocation[1][0].name[0].text).to.equal(relatedLocation.name[0].text)
        //image
        expect(newLocation[2][0].url).to.equal(image.url)
        expect(newLocation[2][0].thumbnail).to.equal(image.thumbnail)
        expect(newLocation[2][0].category).to.equal(image.category)
        expect(newLocation[2][0]._type).to.equal(image._type)
        expect(newLocation[2][0].width).to.equal(image.width)
        expect(newLocation[2][0].height).to.equal(image.height)

        //OpeningTimes
        expect(newLocation[3].twentyfourseven).to.equal(openingTimes.twentyfourseven)
        expect(newLocation[3].regular_hours.week_day).to.equal(openingTimes.regular_hours.week_day)
        expect(newLocation[3].regular_hours.period_begin).to.equal(openingTimes.regular_hours.period_begin)
        expect(newLocation[3].regular_hours.period_end).to.equal(openingTimes.regular_hours.period_end)
        expect(newLocation[3].exceptional_openings.begin).to.equal(openingTimes.exceptional_openings.begin)
        expect(newLocation[3].exceptional_openings.end).to.equal(openingTimes.exceptional_openings.end)
        expect(newLocation[3].exceptional_closings.begin).to.equal(openingTimes.exceptional_closings.begin)
        expect(newLocation[3].exceptional_closings.end).to.equal(openingTimes.exceptional_closings.end)

        // Direction
        expect(newLocation[4][0].language).to.equal(direction.language)
        expect(newLocation[4][0].text).to.equal(direction.text)

    })


    it("removeRelatedLocation", async function(){
        await this.Location.removeRelatedLocation(1, this.sudoUser.token, 1); 
        const newLocation = await this.Location.getLocation(1);
        expect(newLocation[1].length).to.equal(0)
    })

    it("removeImage", async function(){
        await this.Location.removeImage(1, this.sudoUser.token, 1); 
        const newLocation = await this.Location.getLocation(1);
        expect(newLocation[2].length).to.equal(0)
    })

    it("removeDirection", async function(){
        await this.Location.removeDirection(1, this.sudoUser.token, 1); 
        const newLocation = await this.Location.getLocation(1);
        expect(newLocation[4].length).to.equal(0)
    })

    it("removeEVSE", async function(){
        await this.Location.removeEVSE(1, this.sudoUser.token, 1); 
        // TODO create return EVSE object in get location
        //const newLocation = await this.Location.getLocation(1);
        //expect(newLocation[4].length).to.equal(0)
    })


    it("addlocations", async function(){
        const fs = require('fs');
        const coords = JSON.parse( fs.readFileSync(__dirname+"/../coords.json", 'utf8'))

        for (let index = 0; index < coords.length; index++) {
            const coord = coords[index];
            const loc = location;
            loc.coordinates.latitude = coord.lat;
            loc.coordinates.longtitude =coord.lon;

            let tx = await this.Location.addLocation(this.sudoUser.token, loc);

            let result = await GetEventArgumentsByNameAsync(tx, "AddLocation")


            let newLocation = await this.Location.getLocation(Number(result.uid));
            expect(newLocation[0].coordinates.latitude).to.equal(ethers.parseEther(loc.coordinates.latitude))
            expect(newLocation[0].coordinates.longtitude).to.equal(ethers.parseEther(loc.coordinates.longtitude))

        }
    })


    it("inArea all kirov zavod", async function(){

        const locations = await this.Location.inArea({topRightLat:"59.883143",topRightLong:"30.270558",bottomLeftLat:"59.870363",bottomLeftLong:"30.247867", offset:0, connectors:[1], onlyFreeConnectors:true})
        expect(locations[0].length).to.equal(2)
    })

    it("inArea all saint petersburg", async function(){

        // all saint petersburg
        const locations = await this.Location.inArea({topRightLat:"60.133835",topRightLong:"30.933217",bottomLeftLat:"59.630048",bottomLeftLong:"29.649831", offset:0, connectors:[1], onlyFreeConnectors:true})

        expect(locations[0].length).to.equal(50)
    })


    it("inArea all saint petersburg with offset", async function(){

        // all saint petersburg
        const locations = await this.Location.inArea({topRightLat:"60.133835",topRightLong:"30.933217",bottomLeftLat:"59.630048",bottomLeftLong:"29.649831", offset:50, connectors:[1], onlyFreeConnectors:true})

        expect(locations[0].length).to.equal(24)
    })



    it("inAreaMany", async function(){

        let locations_1 = await this.Location.inArea({topRightLat:"66.537305",topRightLong:"177.814396",bottomLeftLat:"43.146425",bottomLeftLong:"11.585331",offset:0, connectors:[1], onlyFreeConnectors:true})
        expect(locations_1[1]).to.equal(1135n)

    })

    it("inAreaMany with offset", async function(){

        let locations_1 = await this.Location.inArea({topRightLat:"66.537305",topRightLong:"177.814396",bottomLeftLat:"43.146425",bottomLeftLong:"11.585331",offset:50, connectors:[1], onlyFreeConnectors:true})
        expect(locations_1[0].length).to.equal(50)

    })

})