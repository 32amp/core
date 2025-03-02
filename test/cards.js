
const { expect } = require('chai');
const {deploy} = require("./lib/deploy");

const {getEventArguments} = require("../utils/utils");

before(async function() {

    const accounts = await ethers.getSigners();
    this.owner = accounts[0]
    this.simpleUser = accounts[1]
    this.adminUser = accounts[2]

    this.contracts = await deploy({User:true,Balance: true, Cards: true})


    await this.contracts.User.addUser(this.simpleUser.address);
    await this.contracts.User.addUser(this.adminUser.address);
    
    await this.contracts.UserAccess.setAccessLevelToModule(this.adminUser.address,"Cards", 4);

})

describe("Cards", function(){
    it("addCard:process", async function(){

        // Client call
        let addCardRequest = await this.contracts.Cards.connect(this.simpleUser).addCardRequest()

        let retAddCardRequest = await getEventArguments(addCardRequest,"AddCardRequest");
        

        expect(retAddCardRequest.account).to.be.equal(this.simpleUser.address)
        expect(retAddCardRequest.request_id).to.be.equal(1)

        //Oracle with admin level access should response
        let addCardResponse = await this.contracts.Cards.connect(this.adminUser).addCardResponse(retAddCardRequest.account,retAddCardRequest.request_id, true,"success", "https://bank.com/endpoint/to/specific/user/for/add/card")
        let retAddCardResponse = await getEventArguments(addCardResponse,"AddCardResponse");
    

        // this is response get client and if status is true open payment_endpoint url
        expect(retAddCardResponse.account).to.be.equal(retAddCardRequest.account)
        expect(retAddCardResponse.request_id).to.be.equal(retAddCardRequest.request_id)
        expect(retAddCardResponse.status).to.be.equal(true)
        expect(retAddCardResponse.message).to.be.equal("success")
        expect(retAddCardResponse.payment_endpoint).to.be.equal("https://bank.com/endpoint/to/specific/user/for/add/card")

        // oracle waiting when payment is will be finished and if all of success try to add card to database
        let addCard = await this.contracts.Cards.connect(this.adminUser).addCard(
            retAddCardRequest.account,
            retAddCardRequest.request_id,
            {
                rebill_id:"1214",
                provider:"bank.com",
                card_id:"1214",
                card_number:"2202***5678",
                is_primary:true,
            }
        )

        // Client get this event 
        let retAddCard = await getEventArguments(addCard,"AddCardSuccess");

        expect(retAddCard.account).to.be.equal(retAddCardRequest.account)
        expect(retAddCard.request_id).to.be.equal(retAddCardRequest.request_id)
        expect(retAddCard.card_id).to.be.equal(1)
    })

    it("setAutoPaySettings, getAutoPaymentSettings, disableAutoPay", async function(){
        let setAutoPaySettings = await this.contracts.Cards.connect(this.simpleUser).setAutoPaySettings(
            ethers.parseEther("500"),
            ethers.parseEther("5000"),
            ethers.parseEther("100"),
        )

        await setAutoPaySettings.wait()

        let getAutoPaymentSettings = await this.contracts.Cards.getAutoPaymentSettings(this.simpleUser.address);

        expect(getAutoPaymentSettings.amount).to.be.equal(ethers.parseEther("500"))
        expect(getAutoPaymentSettings.monthly_limit).to.be.equal(ethers.parseEther("5000"))
        expect(getAutoPaymentSettings.threshold).to.be.equal(ethers.parseEther("100"))
        expect(getAutoPaymentSettings.is_active).to.be.equal(true)

        let disableAutoPay = await this.contracts.Cards.connect(this.simpleUser).disableAutoPay()
        await disableAutoPay.wait()

        let getAutoPaymentSettingsAgain = await this.contracts.Cards.getAutoPaymentSettings(this.simpleUser.address);
        expect(getAutoPaymentSettingsAgain.is_active).to.be.equal(false)

        
    })

    it("writeOff:process", async function(){

        // The client sends a request to debit funds from the card
        let amount = "500"; // type is string because value should be encrypted
        let writeOffRequest = await this.contracts.Cards.connect(this.simpleUser).writeOffRequest(amount)

        let retWriteOffRequest = await getEventArguments(writeOffRequest, "WriteOffRequest")

        expect(retWriteOffRequest.account).to.be.equal(this.simpleUser.address)
        expect(retWriteOffRequest.request_id).to.be.equal(1)
        expect(retWriteOffRequest.card_id).to.be.equal("1214")
        expect(retWriteOffRequest.amount).to.be.equal(amount)

        // Oracle try to write off money from card and if sucess or failed response calling writeOffResponse

        let writeOffResponse = await this.contracts.Cards.writeOffResponse(
            retWriteOffRequest.account,
            retWriteOffRequest.request_id,
            retWriteOffRequest.card_id,
            0, 
            true,
            "success", // of Failed
            amount
        )

        let retWriteOffResponse = await getEventArguments(writeOffResponse, "WriteOffResponse")

        expect(retWriteOffResponse.account).to.be.equal(retWriteOffRequest.account)
        expect(retWriteOffResponse.request_id).to.be.equal(retWriteOffRequest.request_id)
        expect(retWriteOffResponse.card_id).to.be.equal(retWriteOffRequest.card_id)
        expect(retWriteOffResponse.error_code).to.be.equal(0)
        expect(retWriteOffResponse.status).to.be.equal(true)
        expect(retWriteOffResponse.message).to.be.equal("success")
        expect(retWriteOffResponse.amount).to.be.equal(amount)

        // then Oracle should to transfer Balance to client
    })

    it("getCards", async function(){
        let cards = await this.contracts.Cards.getCards(this.simpleUser.address)
        

        expect(cards.length).to.be.equal(1);
        expect(cards[0].rebill_id).to.be.equal("1214");
        expect(cards[0].provider).to.be.equal("bank.com");
        expect(cards[0].card_id).to.be.equal("1214");
        expect(cards[0].card_number).to.be.equal("2202***5678");
        expect(cards[0].is_primary).to.be.equal(true);
        
    })

    it("removeCard", async function(){
        let removeCard = await this.contracts.Cards.connect(this.simpleUser).removeCard(0); // index of user card
        await removeCard.wait()

        let cards = await this.contracts.Cards.getCards(this.simpleUser.address)
        expect(cards.length).to.be.equal(0);
    })

})