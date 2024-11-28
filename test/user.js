
const { expect } = require('chai');


const {GetEventArgumentsByNameAsync, createpayload} = require("../utils/IFBUtils");
const {deploy} = require("./lib/deploy");
const {auth} = require("./lib/auth");

before(async function() {
    const tgtoken = "6421082813:AAHEX0kUk18YM3yhwecw37Pbfo6hnVTvAno";
    const accounts = await ethers.getSigners();
    this.owner = accounts[0].address

    this.sudoUser = {
        login: ethers.encodeBytes32String("sudo"),
        password: ethers.encodeBytes32String("433455"),
        token:null
    }


    this.contracts = await deploy(tgtoken,this.sudoUser,{User:true,Auth:true})

    const {testUser, sudoUser} = await auth(this.contracts.Auth)

    this.testUser = testUser
    this.sudoUser = sudoUser;

})



describe("User", function(){



    it("whoami", async function(){
        const whoami =  await this.contracts.User.whoami(this.testUser.token);

        expect(whoami.enable).to.equal(true);
        expect(whoami.user_type).to.equal(0);
        expect(whoami.last_updated).not.to.equal(0);

        expect(whoami.username.toString() == this.testUser.login).to.equal(true)
    })


    it("addCar, getCars, removeCar", async function(){
        let tx = await this.contracts.User.addCar(this.testUser.token,0,{
            brand:"Tesla",
            model:"Model 3",
            connectors: [1,2]
        })

        await tx.wait()

        const cars = await this.contracts.User.getCars(this.testUser.token, 0)

        expect(cars[0].brand).to.equal("Tesla")

        let tx2 = await this.contracts.User.removeCar(this.testUser.token, 0,0)

        await tx2.wait()

        const cars_zero = await this.contracts.User.getCars(this.testUser.token,0)

        expect(cars_zero.length).to.equal(0)
    })

    it("updateBaseData", async function(){
        let tx1 = await this.contracts.User.updateBaseData(this.testUser.tokensms, 0, ethers.encodeBytes32String("Pavel"),ethers.encodeBytes32String("Durov"),ethers.encodeBytes32String("en"))
        await tx1.wait()

        let whoami =  await this.contracts.User.whoami(this.testUser.tokensms);
        expect(whoami.first_name.toString()).to.equal( ethers.encodeBytes32String("Pavel").toString())

        let tx2 = await this.contracts.User.updateBaseData(this.sudoUser.token, whoami.id, ethers.encodeBytes32String("Nikolay"),ethers.encodeBytes32String("Durov"),ethers.encodeBytes32String("en"))
        await tx2.wait()

        whoami = await this.contracts.User.whoami(this.testUser.tokensms);
        expect(whoami.first_name.toString()).to.equal( ethers.encodeBytes32String("Nikolay").toString())
    })

    it("updateCompanyInfo", async function(){
        await this.contracts.User.updateCompanyInfo(this.testUser.token, 0, {
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

        let info = await this.contracts.User.getCompanyInfo(this.testUser.token, 0)
        
        expect(info.name).to.equal("Portal")
    })

})
