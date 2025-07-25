const { expect } = require('chai');
const { deploy } = require("./lib/deploy");
const {getEventArguments} = require("../utils/utils");

describe("Hub", function(){


    before(async function() {
        const accounts = await ethers.getSigners();
        this.owner = accounts[0].address

        this.contracts = await deploy({User:true, MobileAppSettings: true, UserGroups: true, Tariff:true,Location: true,LocationSearch:true, EVSE:true, Connector: true,  UserSupportChat: true, MobileAppSettings: true, Balance: true, Cards: true, Sessions: true}, true)

    })

    it("getMe", async function(){
        const me = await this.contracts.Hub.me();

        expect(me.owner_address).to.equal(this.owner)
    })


    it("getPartnerByAddress", async function(){
        const me = await this.contracts.Hub.getPartnerByAddress(this.owner);

        expect(me.owner_address).to.equal(this.owner)
    })

    it("getPartnerIdByAddress", async function(){
        const id = await this.contracts.Hub.getPartnerIdByAddress(this.owner);

        expect(1).to.equal(id)
    })


    it("getPartner", async function(){
        const me = await this.contracts.Hub.getPartner(1);

        expect(me.owner_address).to.equal(this.owner)
    })

    it("getPartnerModules", async function(){
        const modules = await this.contracts.Hub.getPartnerModules(1);

        expect(modules[0]).to.equal("User")

    })


    it("getPartners", async function(){
        const partners = await this.contracts.Hub.getPartners()

        expect(partners.length).to.equal(1)
    })

    it("changeModuleAddress", async function(){
        let txzero = await this.contracts.Hub.changeModuleAddress("User", this.contracts.Hub.target)
        
        await txzero.wait()

        let moduleAdress = await this.contracts.Hub.getModule("User", 1)

        expect(moduleAdress).to.equal(this.contracts.Hub.target)

        let tx = await this.contracts.Hub.changeModuleAddress("User", this.contracts.User.target)

        await tx.wait()
        let moduleAdressBack = await this.contracts.Hub.getModule("User", 1)
        expect(moduleAdressBack).to.equal(this.contracts.User.target)
    })

    it("checkModuleExist", async function(){
        let checkOne = await this.contracts.Hub.checkModuleExist("User", 1)

        expect(checkOne).to.equal(this.contracts.User.target)

    })

    it("getPartnerByAddress", async function(){
        let partner = await this.contracts.Hub.getPartnerByAddress(this.owner);

        expect(partner.id).to.equal(1n)
    })

    it("getPartnerIdByAddress", async function(){
        let partner = await this.contracts.Hub.getPartnerIdByAddress(this.owner)
        expect(partner).to.equal(1n)
    })

    it("getPartnerName", async function(){
        let name = await this.contracts.Hub.getPartnerName(1n)

        expect(name).to.equal(ethers.encodeBytes32String("PortalEnergy"))
    })

    it("getPartnerPartyId", async function(){
        let partyId = await this.contracts.Hub.getPartnerPartyId(1n)

        expect(partyId).to.equal(ethers.hexlify(ethers.toUtf8Bytes("POE")))
    })

    it("getPartnerCountryCode", async function(){
        let code = await this.contracts.Hub.getPartnerCountryCode(1n)
        
        expect(code).to.equal(ethers.hexlify(ethers.toUtf8Bytes("RU")))
    })

})
