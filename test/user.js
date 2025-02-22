
const { expect } = require('chai');

const {deploy} = require("./lib/deploy");

before(async function() {

    const accounts = await ethers.getSigners();
    this.owner = accounts[0]
    this.simpleUser = accounts[1]
    this.contracts = await deploy({User:true})
    await this.contracts.User.addUser(this.simpleUser.address)

})



describe("User", function(){



    it("whoami", async function(){
        const whoami =  await this.contracts.User.connect(this.simpleUser).whoami();

        expect(whoami.enable).to.equal(true);
        expect(whoami.user_type).to.equal(0);
        expect(whoami.last_updated).not.to.equal(0);
    })


    it("addCar, getCars, removeCar", async function(){
        let tx = await this.contracts.User.connect(this.simpleUser).addCar(ethers.ZeroAddress,{
            brand:"Tesla",
            model:"Model 3",
            connectors: [1,2]
        })

        await tx.wait()

        const cars = await this.contracts.User.connect(this.simpleUser).getCars(ethers.ZeroAddress)

        expect(cars[0].brand).to.equal("Tesla")

        let tx2 = await this.contracts.User.connect(this.simpleUser).removeCar( ethers.ZeroAddress,0)

        await tx2.wait()

        const cars_zero = await this.contracts.User.connect(this.simpleUser).getCars(ethers.ZeroAddress)

        expect(cars_zero.length).to.equal(0)
    })

    it("updateBaseData", async function(){
        let tx1 = await this.contracts.User.connect(this.simpleUser).updateBaseData(ethers.ZeroAddress, "Pavel","Durov","en")
        await tx1.wait()

        let whoami =  await this.contracts.User.connect(this.simpleUser).whoami();
        expect(whoami.first_name).to.equal( "Pavel")

        let tx2 = await this.contracts.User.updateBaseData( this.simpleUser.address, "Nikolay","Durov","en")
        await tx2.wait()

        whoami = await this.contracts.User.connect(this.simpleUser).whoami();
        expect(whoami.first_name).to.equal( "Nikolay")
    })

    it("updateCompanyInfo", async function(){
        await this.contracts.User.connect(this.simpleUser).updateCompanyInfo( ethers.ZeroAddress, {
            name: "Portal",
            description: "Wow",
            inn:"1212",
            kpp: "121212",
            ogrn: "8767",
            bank_account: "1212121",
            bank_name: "SuperBank",
            bank_bik: "3232234234",
            bank_corr_account: "66543",
            bank_inn: "51442456",
            bank_kpp_account: "787878"
        })

        let info = await this.contracts.User.connect(this.simpleUser).getCompanyInfo(ethers.ZeroAddress)
        
        expect(info.name).to.equal("Portal")
    })

})
