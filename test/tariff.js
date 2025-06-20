const { expect } = require('chai');
const {deploy} = require("./lib/deploy");
const {getEventArguments} = require("../utils/utils");

describe("Tariff", function(){

    before(async function() {
        const accounts = await ethers.getSigners();
        this.owner = accounts[0];
        this.adminUser = accounts[0];
        this.contracts = await deploy({User:true,Tariff:true})
    })

    const {free_tariff} = require("./lib/tariff_data")

    it("addDefaultFreeTariff", async function(){
        await this.contracts.UserAccess.setAccessLevelToModule(this.adminUser.address,"Tariff", 4);
        const tx =  await this.contracts.Tariff.connect(this.adminUser).add(free_tariff);
        let result = await getEventArguments(tx, "AddTariff")
        expect(result.uid).to.equal(1)
    })

    it("update tariff fields via update", async function() {
        await this.contracts.UserAccess.setAccessLevelToModule(this.adminUser.address,"Tariff", 4);
        await this.contracts.Tariff.connect(this.adminUser).add(free_tariff);

        // изменяем min_price, max_price, start_date_time, end_date_time
        const updatedTariff = {
            ...free_tariff,
            min_price: {excl_vat: 10, incl_vat: 12},
            max_price: {excl_vat: 100, incl_vat: 120},
            start_date_time: 1234567890,
            end_date_time: 2234567890
        };
        await this.contracts.Tariff.connect(this.adminUser).update(1, updatedTariff);

        const tariff = await this.contracts.Tariff.get(1);
        expect(tariff.tariff.min_price.excl_vat).to.equal(10);
        expect(tariff.tariff.max_price.excl_vat).to.equal(100);
        expect(tariff.tariff.start_date_time).to.equal(1234567890);
        expect(tariff.tariff.end_date_time).to.equal(2234567890);
    });

    it("get", async function(){
        await this.contracts.UserAccess.setAccessLevelToModule(this.adminUser.address,"Tariff", 4);
        await this.contracts.Tariff.connect(this.adminUser).add(free_tariff);
        const tariff = await this.contracts.Tariff.get(1);
        expect(tariff.last_updated).not.to.be.equal(0)
    })

})
