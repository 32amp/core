
const { expect } = require('chai');
const {deploy} = require("./lib/deploy");
const {getEventArguments} = require("../utils/utils");

before(async function() {

    const accounts = await ethers.getSigners();
    this.owner = accounts[0];
    this.adminUser = accounts[0];
    this.contracts = await deploy({User:true,Tariff:true})

})




describe("Tariff", function(){
    const {free_tariff,energy_mix} = require("./lib/tariff_data")

    it("addDefaultFreeTariff", async function(){
        await this.contracts.UserAccess.setAccessLevelToModule(this.adminUser.address,"Tariff", 4);

        const tx =  await this.contracts.Tariff.connect(this.adminUser).add(free_tariff);
        let result = await getEventArguments(tx, "AddTariff")
        expect(result.uid).to.equal(1)
        expect(result.partner_id).to.equal(1)
    })


    it("setMinPrice", async function(){
        let tx = await this.contracts.Tariff.connect(this.adminUser).setMinPrice( 1, {
            excl_vat:10,
            incl_vat:12
        })

        await tx.wait()

        const tariff = await this.contracts.Tariff.get(1);

        expect(tariff.min_price.excl_vat).to.equal(10)
    })

    it("setMaxPrice", async function(){
        let tx = await this.contracts.Tariff.connect(this.adminUser).setMaxPrice(1, {
            excl_vat:10,
            incl_vat:12
        })

        await tx.wait()

        const tariff = await this.contracts.Tariff.get(1);

        expect(tariff.max_price.excl_vat).to.equal(10)
    })

    it("setStartDateTime", async function(){
        const time = Date.now();
        let tx = await this.contracts.Tariff.connect(this.adminUser).setStartDateTime(1, time)
        
        await tx.wait()
        
        const tariff = await this.contracts.Tariff.get(1);

        expect(tariff.start_date_time).to.equal(time)
    })

    it("setEndDateTime", async function(){
        const time = Date.now();
        let tx = await this.contracts.Tariff.connect(this.adminUser).setEndDateTime(1, time)

        await tx.wait()

        const tariff = await this.contracts.Tariff.get(1);

        expect(tariff.end_date_time).to.equal(time)
    })

    it("setEnergyMix", async function(){

        let tx = await this.contracts.Tariff.connect(this.adminUser).setEnergyMix(1, energy_mix)
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
