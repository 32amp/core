const { expect } = require('chai');
const {deploy} = require("./lib/deploy");


describe("MobileAppSettings", function(){

    before(async function() {
        const accounts = await ethers.getSigners();
        this.owner = accounts[0]
    
        this.config = {
            privacy_policy: {
                name_file: "private_policy.html",
                ipfs_cid:"QmS4qShkCxVyrE1eCq15e6mikYHQvyqvH3wxp6kEoaTNco",
                file_type:2
            },
            license_agreement: {
                name_file: "license_agreement.html",
                ipfs_cid:"QmS4qShkCxVyrE1eCq15e6mikYHQvyqvH3wxp6kEoaTNco",
                file_type:2
            },
            technical_work: false,
            support_phone: "+78125603524"
        };
    
        this.contracts = await deploy({User:true, MobileAppSettings:true})
    
    })

    it("setConfig", async function(){

        const setConfig = await this.contracts.MobileAppSettings.setConfig(this.config);

        await setConfig.wait();
    })

    it("getConfig", async function(){
        const config = await this.contracts.MobileAppSettings.getConfig()

        expect(this.config.privacy_policy.name_file).to.equal(config.privacy_policy.name_file)
        expect(this.config.privacy_policy.ipfs_cid).to.equal(config.privacy_policy.ipfs_cid)
        expect(this.config.privacy_policy.file_type).to.equal(config.privacy_policy.file_type)


        expect(this.config.license_agreement.name_file).to.equal(config.license_agreement.name_file)
        expect(this.config.license_agreement.ipfs_cid).to.equal(config.license_agreement.ipfs_cid)
        expect(this.config.license_agreement.file_type).to.equal(config.license_agreement.file_type)

        expect(this.config.technical_work).to.equal(config.technical_work)
        expect(this.config.support_phone).to.equal(config.support_phone)
    })

    it("setTechnicalWork", async function(){
        const setTechnicalWork = await this.contracts.MobileAppSettings.setTechnicalWork(true);
        await setTechnicalWork.wait()

        const config = await this.contracts.MobileAppSettings.getConfig()
        expect(true).to.equal(config.technical_work)
    })
})