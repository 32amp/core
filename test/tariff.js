
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


    this.contracts = await deploy(tgtoken,this.sudoUser,{User:true,Auth:true,Tariff:true})

    const {sudoUser, testUser} = await auth(this.contracts.Auth)

    this.sudoUser = sudoUser;
    this.testUser = testUser;
})




describe("Tariff", function(){
    const {free_tariff,energy_mix} = require("./lib/tariff_data")

    it("addDefaultFreeTariff", async function(){
        await this.contracts.UserAccess.setAccessLevelToModule(this.sudoUser.token,2,"Tariff", 4);

        const tx =  await this.contracts.Tariff.add(this.testUser.token, free_tariff);
        let result = await GetEventArgumentsByNameAsync(tx, "AddTariff")
        expect(result.uid).to.equal(1)
        expect(result.partner_id).to.equal(1)
    })


    it("setMinPrice", async function(){
        let tx = await this.contracts.Tariff.setMinPrice(this.testUser.token, 1, {
            excl_vat:10,
            incl_vat:12
        })

        await tx.wait()

        const tariff = await this.contracts.Tariff.get(1);

        expect(tariff.min_price.excl_vat).to.equal(10)
    })

    it("setMaxPrice", async function(){
        let tx = await this.contracts.Tariff.setMaxPrice(this.testUser.token, 1, {
            excl_vat:10,
            incl_vat:12
        })

        await tx.wait()

        const tariff = await this.contracts.Tariff.get(1);

        expect(tariff.max_price.excl_vat).to.equal(10)
    })

    it("setStartDateTime", async function(){
        const time = Date.now();
        let tx = await this.contracts.Tariff.setStartDateTime(this.testUser.token, 1, time)
        
        await tx.wait()
        
        const tariff = await this.contracts.Tariff.get(1);

        expect(tariff.start_date_time).to.equal(time)
    })

    it("setEndDateTime", async function(){
        const time = Date.now();
        let tx = await this.contracts.Tariff.setEndDateTime(this.testUser.token, 1, time)

        await tx.wait()

        const tariff = await this.contracts.Tariff.get(1);

        expect(tariff.end_date_time).to.equal(time)
    })

    it("setEnergyMix", async function(){

        let tx = await this.contracts.Tariff.setEnergyMix(this.testUser.token, 1, energy_mix)
        await tx.wait()

        const tariff = await this.contracts.Tariff.get(1);

        expect(tariff.energy_mix.is_green_energy).to.equal(true)
    })

    it("get", async function(){
        const tariff = await this.contracts.Tariff.get(1);

        expect(tariff.last_updated).not.to.be.equal(0)
        expect(tariff.country_code).to.equal(ethers.hexlify(ethers.toUtf8Bytes("RU")))
        expect(tariff.party_id).to.equal(ethers.hexlify(ethers.toUtf8Bytes("POE")))
       
    })


})
