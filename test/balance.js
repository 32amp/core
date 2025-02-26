
const { expect } = require('chai');
const {deploy} = require("./lib/deploy");

const {GetEventArgumentsByNameAsync} = require("../utils/IFBUtils");

before(async function() {

    const accounts = await ethers.getSigners();
    this.owner = accounts[0]
    this.simpleUser = accounts[1]

    this.contracts = await deploy({User:true,Balance: true})
    await this.contracts.User.addUser(this.simpleUser.address);

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
        await this.contracts.Balance.mint(this.simpleUser.address, ethers.parseEther("100"))
        
        const totalSupply = await this.contracts.Balance.totalSupply();
        
        expect(totalSupply).to.be.equal(ethers.parseEther("100"))

        const balance = await this.contracts.Balance.balanceOf(this.simpleUser.address);

        expect(balance).to.be.equal(ethers.parseEther("100"))
    })

    it("transfer", async function(){
        await this.contracts.Balance.connect(this.simpleUser).transfer(this.owner.address, ethers.parseEther("10"))

        const balance = await this.contracts.Balance.balanceOf(this.owner.address);

        expect(balance).to.be.equal(ethers.parseEther("10"))

        const balance2 = await this.contracts.Balance.balanceOf(this.simpleUser.address);

        expect(balance2).to.be.equal(ethers.parseEther("90"))
    })

    it("transferFrom", async function(){
        await this.contracts.Balance.transferFrom(this.simpleUser.address,this.owner.address, ethers.parseEther("90"))


        const balance = await this.contracts.Balance.balanceOf(this.owner.address);

        expect(balance).to.be.equal(ethers.parseEther("100"))

        const balance2 = await this.contracts.Balance.balanceOf(this.simpleUser.address);

        expect(balance2).to.be.equal(ethers.parseEther("0"))
    })


})

