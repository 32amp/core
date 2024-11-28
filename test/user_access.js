
const { expect } = require('chai');



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


    this.contracts = await deploy(tgtoken,this.sudoUser,{User:true,UserGroups:true,Auth:true})

    const {sudoUser} = await auth(this.contracts.Auth)

    this.sudoUser = sudoUser;

})




describe("UserAccess", function(){
    it("sudo getMyModulesAccess", async function(){

        const accesModules =  await this.contracts.UserAccess.getMyModulesAccess(this.sudoUser.token);
    
        expect(accesModules[1][0]).to.equal(6)
        expect(accesModules[1][1]).to.equal(6)
    })

    it("sudo getModuleAccessLevel", async function(){

        const accessToGroup =  await this.contracts.UserAccess.getModuleAccessLevel("UserGroups", 1);
        expect(accessToGroup).to.equal(6)
    })

    it("setAccessLevelToModule", async function(){
        const tx = await this.contracts.UserAccess.setAccessLevelToModule(this.sudoUser.token,2,"User", 6);
        tx.wait()

        const result = await this.contracts.UserAccess.getModuleAccessLevel("User",2)

        expect(result).to.equal(6);
    })
})
