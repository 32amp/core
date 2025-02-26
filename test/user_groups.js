
const { expect } = require('chai');
const {deploy} = require("./lib/deploy");

before(async function() {
    
    const accounts = await ethers.getSigners();
    this.owner = accounts[0];
    this.simpleUser = accounts[1];
    this.contracts = await deploy({User:true,UserGroups:true})

    await this.contracts.User.addUser(this.simpleUser.address);

})


describe("UserGroups", function(){
    it("getMyGroups", async function(){

        await this.contracts.UserAccess.setAccessLevelToModule(this.simpleUser.address,"UserGroups", 4);
        
        const myGroups =  await this.contracts.UserGroups.connect(this.simpleUser).getMyGroups();
        expect(myGroups.length).to.equal(0)
        
    })

    it("addGroup", async function(){
        let tx = await this.contracts.UserGroups.connect(this.simpleUser).addGroup("test");
        await tx.wait()
        
        const myGroups =  await this.contracts.UserGroups.connect(this.simpleUser).getMyGroups();
        expect(myGroups.length).to.equal(1)
        
    });
})
