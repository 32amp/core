
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

    const {sudoUser, testUser} = await auth(this.contracts.Auth)

    this.testUser = testUser;
    this.sudoUser = sudoUser;

})


describe("UserGroups", function(){
    it("getMyGroups", async function(){

        await this.contracts.UserAccess.setAccessLevelToModule(this.sudoUser.token,2,"UserGroups", 4);
        
        const myGroups =  await this.contracts.UserGroups.getMyGroups(this.testUser.token);
        expect(myGroups.length).to.equal(0)
        
    })

    it("addGroup", async function(){
        let tx = await this.contracts.UserGroups.addGroup(this.testUser.token, "test");
        await tx.wait()
        
        const myGroups =  await this.contracts.UserGroups.getMyGroups(this.testUser.token);
        expect(myGroups.length).to.equal(1)
        
    });
})
