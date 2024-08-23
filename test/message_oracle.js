const { expect }   =   require('chai');
const MessageOracleModule = require("../ignition/modules/MessageOracle");
const {GetEventArgumentsByNameAsync} = require("../utils/IFBUtils");

before(async function() {


    accounts = await ethers.getSigners();

    this.owner = accounts[0].address;
    this.anotherUser = accounts[1]
    this.testRecipient = ethers.encodeBytes32String("+79312700684");
    this.testMessage = ethers.encodeBytes32String("3456")

    console.log("Deploying Contracts...");
    
    const MessageOracle = await ignition.deploy(MessageOracleModule);

    this.MessageOracle = MessageOracle.MessageOracle;

    await this.MessageOracle.initialize(60n, 1n, false, "Message: [message]")

    console.log("MessageOracle deployed to:", this.MessageOracle.target);


})


describe("MessageOracle", function(){


    it("getSendTimeout", async function(){
        const timeout = await this.MessageOracle.getSendTimeout();

        expect(timeout).to.equal(60n)
    })


    it("getPriceForMessage, changePriceForMessage", async function(){
        const price = await this.MessageOracle.getPriceForMessage();

        expect(price).to.equal(1n)

        await this.MessageOracle.changePriceForMessage(10n);

        const price2 = await this.MessageOracle.getPriceForMessage();

        expect(price2).to.equal(10n)

    })

    it("getBodyTemplate", async function(){
        const template = await this.MessageOracle.getBodyTemplate();

        expect(template).to.equal("Message: [message]")
    })

    it("isWhitelistEnable, activateWhitelist", async function(){
        const isWhitelistEnable = await this.MessageOracle.isWhitelistEnable();

        expect(isWhitelistEnable).to.equal(false)

        await this.MessageOracle.activateWhitelist(true);

        const isWhitelistEnable2 = await this.MessageOracle.isWhitelistEnable();

        expect(isWhitelistEnable2).to.equal(true)

    })

    it("addOracle", async function(){
        await this.MessageOracle.addOracle(this.anotherUser.address);
        await this.MessageOracle.addOracle(this.owner);
    })

    it("removeOracle", async function(){
        await this.MessageOracle.removeOracle(this.owner);
    })

    it("addToWhitelist", async function(){
        await this.MessageOracle.addToWhitelist(this.owner);
        await this.MessageOracle.addToWhitelist(this.anotherUser.address);
    })

    it("removeFromWhitelist", async function(){
        await this.MessageOracle.removeFromWhitelist(this.anotherUser.address);
    })

    it("refill", async function(){
        await this.MessageOracle.refill(this.owner,{value:10n});

        const balance = await this.MessageOracle.getBalance(this.owner)
        expect(10n).to.equal(balance)
    })



    it("send", async function(){
        const tx = await this.MessageOracle.sendMessage(this.testRecipient, this.testMessage);

        let send = await GetEventArgumentsByNameAsync(tx, "Send")

        expect(send.recipient).to.equal(this.testRecipient)
    })

    

    it("confirmSend", async function(){

        const message = await this.MessageOracle.connect(this.anotherUser).getMessageFor(this.testRecipient);
        
        expect(message.text).to.equal(this.testMessage)

        const tx = await this.MessageOracle.connect(this.anotherUser).confirmSend(this.testRecipient);

        let send = await GetEventArgumentsByNameAsync(tx, "ConfirmSend")

        expect(send.recipient).to.equal(this.testRecipient)
    })


})
