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
        await this.User.addCar(this.testUser.token,{
            brand:"Tesla",
            model:"Model 3",
            connectors: [1,2]
        })

        const cars = await this.User.getCars(this.testUser.token)

        expect(cars[0].brand).to.equal("Tesla")

        await this.User.removeCar(this.testUser.token, 0)

        const cars_zero = await this.User.getCars(this.testUser.token)

        expect(cars_zero.length).to.equal(0)
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
        const group =  await this.UserGroups.addGroup(this.sudoUser.token, "test");
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
            latitude: 30,
            longtitude: 60
        },
        parking_type: 5,
        facilities: [1,2], // Hotel, Restaurant
        time_zone : "Moskow/Europe",
        charging_when_closed: true
    };

    it("AddLocation", async function(){

        const tx =  await this.Location.addLocation(this.sudoUser.token, location);

        let result = await GetEventArgumentsByNameAsync(tx, "AddLocation")
        expect(result.uid).to.equal(1)
        expect(result.partner_id).to.equal(1)
    })

    it("getLocation", async function(){
        const newLocation = await this.Location.getLocation(1);
        expect(newLocation.uid).to.equal(1)
        expect(newLocation.city).to.equal(location.city)
        expect(newLocation.postal_code).to.equal(location.postal_code)
        expect(newLocation.state).to.equal(location.state)
        expect(newLocation.country).to.equal(location.country)
        expect(newLocation.coordinates.latitude).to.equal(location.coordinates.latitude)
        expect(newLocation.coordinates.longtitude).to.equal(location.coordinates.longtitude)
        expect(newLocation.parking_type).to.equal(location.parking_type)
        expect(newLocation.facilities.join(",")).to.equal(location.facilities.join(","))
        expect(newLocation.time_zone).to.equal(location.time_zone)
        expect(newLocation.charging_when_closed).to.equal(location.charging_when_closed)
    })

})