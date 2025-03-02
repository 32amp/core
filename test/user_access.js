
const { expect } = require('chai');
const {deploy} = require("./lib/deploy");





describe("UserAccess", function(){


    before(async function() {
        this.accounts = await ethers.getSigners();
        this.contracts = await deploy({User:true,UserGroups:true})
    })


    it("sudo getMyModulesAccess", async function(){

        const accesModules =  await this.contracts.UserAccess.getMyModulesAccess();
    
        expect(accesModules[1][0]).to.equal(6)
        expect(accesModules[1][1]).to.equal(6)
    })

    it("sudo getModuleAccessLevel", async function(){

        const accessToGroup =  await this.contracts.UserAccess.getModuleAccessLevel("UserGroups", this.accounts[0].address);
        expect(accessToGroup).to.equal(6)
    })

    it("setAccessLevelToModule", async function(){
        const tx = await this.contracts.UserAccess.setAccessLevelToModule(this.accounts[1].address,"User", 6);
        tx.wait()

        const result = await this.contracts.UserAccess.getModuleAccessLevel("User",this.accounts[1].address)

        expect(result).to.equal(6);
    })
})
