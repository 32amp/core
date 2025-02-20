
const { expect } = require('chai');


const {GetEventArgumentsByNameAsync} = require("../utils/IFBUtils");

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


    this.contracts = await deploy(tgtoken,this.sudoUser,{User:true,Auth:true, Balance: true, Cards: true})

    const {testUser, sudoUser} = await auth(this.contracts.Auth)

    this.testUser = testUser
    this.sudoUser = sudoUser;

})



describe("Balance", function (){
    it("getCurrency", async function (){
        const currency = await this.contracts.Balance.getCurrency();
        
        expect(currency).to.be.equal(1)
    })

    it("totalSupply", async function (){
        const totalSupply = await this.contracts.Balance.totalSupply();
        
        expect(totalSupply).to.be.equal(0)
    })

    it("mint,balanceOf", async function(){
        await this.contracts.Balance.mint(this.sudoUser.token,1, ethers.parseEther("100"))
        
        const totalSupply = await this.contracts.Balance.totalSupply();
        
        expect(totalSupply).to.be.equal(ethers.parseEther("100"))

        const balance = await this.contracts.Balance.balanceOf(1);

        expect(balance).to.be.equal(ethers.parseEther("100"))
    })

    it("transfer", async function(){
        await this.contracts.Balance.transfer(this.sudoUser.token, 2, ethers.parseEther("10"))

        const balance = await this.contracts.Balance.balanceOf(1);

        expect(balance).to.be.equal(ethers.parseEther("90"))

        const balance2 = await this.contracts.Balance.balanceOf(2);

        expect(balance2).to.be.equal(ethers.parseEther("10"))
    })

    it("transferFrom", async function(){
        await this.contracts.Balance.transferFrom(this.sudoUser.token, 2,1, ethers.parseEther("10"))


        const balance = await this.contracts.Balance.balanceOf(1);

        expect(balance).to.be.equal(ethers.parseEther("100"))

        const balance2 = await this.contracts.Balance.balanceOf(2);

        expect(balance2).to.be.equal(ethers.parseEther("0"))
    })


})
