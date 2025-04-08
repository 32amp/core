
const { expect } = require('chai');

const {deploy} = require("./lib/deploy");
const { encryptAESGCM, decryptAESGCM } = require("../helpers/aes");

const aeskey = "8194dfd74925f99fa84026c71180f230cb73054687a5f836a3a8642380d82282";


describe("User", function(){

    before(async function() {

        const accounts = await ethers.getSigners();
        this.owner = accounts[0]
        this.simpleUser = accounts[1]
        this.contracts = await deploy({User:true})
        let tx = await this.contracts.User.addUser(this.simpleUser.address)
        await tx.wait()
    
    })

    it("whoami", async function(){
        const whoami =  await this.contracts.User.connect(this.simpleUser).whoami();

        expect(whoami.enable).to.equal(true);
        expect(whoami.user_type).to.equal(0);
        expect(whoami.last_updated).not.to.equal(0);
    })


    it("addCar, getCars, removeCar", async function(){
        const encryptBrand = await encryptAESGCM("Tesla", aeskey)
        const encryptModel = await encryptAESGCM("Model 3", aeskey)

        let tx = await this.contracts.User.connect(this.simpleUser).addCar(ethers.ZeroAddress,{
            brand:encryptBrand,
            model:encryptModel,
            connectors: [1,2]
        })

        await tx.wait()

        const cars = await this.contracts.User.connect(this.simpleUser).getCars(ethers.ZeroAddress)

        expect(cars[0].brand).to.equal(encryptBrand)

        let tx2 = await this.contracts.User.connect(this.simpleUser).removeCar( ethers.ZeroAddress,0)

        await tx2.wait()

        const cars_zero = await this.contracts.User.connect(this.simpleUser).getCars(ethers.ZeroAddress)

        expect(cars_zero.length).to.equal(0)
    })

    it("updateBaseData", async function(){
        const encryptName = await encryptAESGCM("Pavel", aeskey)
        const encryptSecondName = await encryptAESGCM("Durov", aeskey)
        const encryptLang = await encryptAESGCM("en", aeskey)
        let tx1 = await this.contracts.User.connect(this.simpleUser).updateBaseData(ethers.ZeroAddress, encryptName,encryptSecondName,encryptLang)
        await tx1.wait()

        let whoami =  await this.contracts.User.connect(this.simpleUser).whoami();
        expect(whoami.first_name).to.equal(encryptName)

        const encryptName2 = await encryptAESGCM("Nikolay", aeskey)

        let tx2 = await this.contracts.User.updateBaseData( this.simpleUser.address, encryptName2,encryptSecondName,encryptLang)
        await tx2.wait()

        whoami = await this.contracts.User.connect(this.simpleUser).whoami();
        expect(whoami.first_name).to.equal(encryptName2)
    })

    it("updateCompanyInfo", async function(){
        let tx = await this.contracts.User.connect(this.simpleUser).updateCompanyInfo( ethers.ZeroAddress, {
            name: await encryptAESGCM("Portal", aeskey),
            description: await encryptAESGCM("Wow", aeskey),
            inn:await encryptAESGCM("1212", aeskey),
            kpp:await encryptAESGCM("121212", aeskey),
            ogrn: await encryptAESGCM("8767", aeskey),
            bank_account: await encryptAESGCM("1212121", aeskey),
            bank_name: await encryptAESGCM("SuperBank", aeskey),
            bank_bik: await encryptAESGCM("3232234234", aeskey) ,
            bank_corr_account: await encryptAESGCM("66543", aeskey),
            bank_inn: await encryptAESGCM("51442456", aeskey),
            bank_kpp_account: await encryptAESGCM("787878", aeskey)
        })

        await tx.wait()

        let info = await this.contracts.User.connect(this.simpleUser).getCompanyInfo(ethers.ZeroAddress)
        
        expect(await decryptAESGCM(info.name, aeskey)).to.equal("Portal")
    })

})
