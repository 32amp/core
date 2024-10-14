const { expect }   =   require('chai');
const hubModule = require("../ignition/modules/Hub");
const userModule = require("../ignition/modules/User");
const UserGroupsModule = require("../ignition/modules/UserGroups");
const TariffModule = require("../ignition/modules/Tariff");
const LocationsModule = require("../ignition/modules/Locations");
const LocationSearchModule = require("../ignition/modules/LocationSearch");
const EVSEModule = require("../ignition/modules/EVSE");
const ConnectorModule = require("../ignition/modules/Connector");
const UserAccessModule = require("../ignition/modules/UserAccess");
const UserSupportChatModule = require("../ignition/modules/UserSupportChat");
const MessageOracleModule = require("../ignition/modules/MessageOracle");
const CurrenciesModule = require("../ignition/modules/Currencies");


const {GetEventArgumentsByNameAsync, createpayload} = require("../utils/IFBUtils");

before(async function() {


    accounts = await ethers.getSigners();

    this.testUser = {
        login: ethers.encodeBytes32String("darkrain"),
        password: ethers.encodeBytes32String("159753"),
    }

    this.sudoUser = {
        login: ethers.encodeBytes32String("sudo"),
        password: ethers.encodeBytes32String("433455"),
        token:null
    }

    const tg_bot_token = ethers.toUtf8Bytes("7137095373:AAFxe-tRpq3MqhhfZ4xKAsRQtMUWTsZ4CPo")

    this.owner = accounts[0].address;
    this.anotherUser = accounts[1]

    console.log("Deploying Contracts...");
   

    //
    const MessageOracle = await ignition.deploy(MessageOracleModule);

    this.MessageOracle = MessageOracle.MessageOracle;

    await this.MessageOracle.initialize(60n, 1n, false, "Message: [message]")

    console.log("MessageOracle deployed to:", this.MessageOracle.target);

    //
    const Currencies = await ignition.deploy(CurrenciesModule);

    this.Currencies = Currencies.Currencies;

    await this.Currencies.initialize()

    console.log("Currencies deployed to:", this.Currencies.target);
    


    //
    
    const HubDeploy = await ignition.deploy(hubModule);

    this.Hub = HubDeploy.hub;
    await this.Hub.initialize([
        {
            name: "EmailService",
            contract_address: this.MessageOracle.target
        },
        {
            name: "SMSService",
            contract_address: this.MessageOracle.target
        },
        {
            name: "Currencies",
            contract_address: this.Currencies.target
        }
    ])

    console.log("Hub deployed to:", this.Hub.target);

    let tx = await this.Hub.addPartner(
        ethers.encodeBytes32String("PortalEnergy"),
        ethers.toUtf8Bytes("RU"),
        ethers.toUtf8Bytes("POE"),
        this.owner
    );

    this.partner = await GetEventArgumentsByNameAsync(tx, "AddPartner")

    

    //
    const UserDeploy = await ignition.deploy(userModule);
    
    this.User = UserDeploy.user;

    this.User.initialize(this.partner.id,this.Hub.target, this.sudoUser.login, this.sudoUser.password, tg_bot_token)

    await this.Hub.addModule("User", this.User.target)

    console.log("User deployed to:", this.User.target);
    await this.MessageOracle.refill(this.User.target,{value:10n});



    const UserGroupsDeploy = await ignition.deploy(UserGroupsModule);
    this.UserGroups = UserGroupsDeploy.UserGroups;
    this.UserGroups.initialize(this.partner.id,this.Hub.target)

    await this.Hub.addModule("UserGroups", this.UserGroups.target);
    console.log("UserGroups deployed to:", this.UserGroups.target);


    // Tariff
    const TariffDeploy = await ignition.deploy(TariffModule);
    this.Tariff = await TariffDeploy.Tariff;
    
    this.Tariff.initialize(this.partner.id,this.Hub.target)

    await this.Hub.addModule("Tariff", this.Tariff.target);
    console.log("Tariff deployed to:", this.Tariff.target);
    

    // Location
    const LocationDeploy = await ignition.deploy(LocationsModule);
    this.Location = await LocationDeploy.Locations;
    
    this.Location.initialize(this.partner.id,this.Hub.target)

    await this.Hub.addModule("Location", this.Location.target);
    console.log("Location deployed to:", this.Location.target);


    // LocationSearch
    const LocationSearchDeploy = await ignition.deploy(LocationSearchModule);
    this.LocationSearch = await LocationSearchDeploy.LocationSearch;
    
    this.LocationSearch.initialize(this.partner.id,this.Hub.target)

    await this.Hub.addModule("LocationSearch", this.LocationSearch.target);
    console.log("LocationSearch deployed to:", this.LocationSearch.target);

    
    // EVSE
    const EVSEDeploy = await ignition.deploy(EVSEModule);
    this.EVSE = await EVSEDeploy.EVSE;
    
    this.EVSE.initialize(this.partner.id,this.Hub.target)

    await this.Hub.addModule("EVSE", this.EVSE.target);
    console.log("EVSE deployed to:", this.EVSE.target);


    //Connector

    const ConnectorDeploy = await ignition.deploy(ConnectorModule);
    this.Connector = await ConnectorDeploy.Connector;
    
    this.Connector.initialize(this.partner.id,this.Hub.target)

    await this.Hub.addModule("Connector", this.Connector.target);
    console.log("Connector deployed to:", this.Connector.target);

    //Connector

    const UserSupportChatDeploy = await ignition.deploy(UserSupportChatModule);
    this.UserSupportChat = await UserSupportChatDeploy.UserSupportChat;
    
    this.UserSupportChat.initialize(this.partner.id,this.Hub.target)

    await this.Hub.addModule("UserSupportChat", this.UserSupportChat.target);
    console.log("UserSupportChat deployed to:", this.UserSupportChat.target);


    const UserAccessDeploy = await ignition.deploy(UserAccessModule);
    this.UserAccess = UserAccessDeploy.UserAccess;
    this.UserAccess.initialize(this.partner.id,this.Hub.target)

    this.Hub.addModule("UserAccess", this.UserAccess.target);
    console.log("UserAccess deployed to:", this.UserAccess.target);

})


describe("Hub", function(){


    it("getMe", async function(){
        const me = await this.Hub.me();

        expect(me.owner_address).to.equal(this.owner)
    })


    it("getPartnerByAddress", async function(){
        const me = await this.Hub.getPartnerByAddress(this.owner);

        expect(me.owner_address).to.equal(this.owner)
    })

    it("getPartnerIdByAddress", async function(){
        const id = await this.Hub.getPartnerIdByAddress(this.owner);

        expect(1).to.equal(id)
    })


    it("getPartner", async function(){
        const me = await this.Hub.getPartner(1);

        expect(me.owner_address).to.equal(this.owner)
    })

    it("getPartnerModules", async function(){
        const modules = await this.Hub.getPartnerModules(1);

        expect(modules[0]).to.equal("User")
        expect(modules[1]).to.equal("UserGroups")
        expect(modules[2]).to.equal("Tariff")
        expect(modules[3]).to.equal("Location")
        expect(modules[4]).to.equal("LocationSearch")
        expect(modules[5]).to.equal("EVSE")
        expect(modules[6]).to.equal("Connector")
        expect(modules[7]).to.equal("UserSupportChat")
        expect(modules[8]).to.equal("UserAccess")
        //
    })


    it("getPartners", async function(){
        const partners = await this.Hub.getPartners()

        expect(partners.length).to.equal(1)
    })

    it("changeModuleAddress", async function(){
        await this.Hub.changeModuleAddress("User", this.Hub.target)

        let moduleAdress = await this.Hub.getModule("User", 1)
        expect(moduleAdress).to.equal(this.Hub.target)

        await this.Hub.changeModuleAddress("User", this.User.target)
        let moduleAdressBack = await this.Hub.getModule("User", 1)
        expect(moduleAdressBack).to.equal(this.User.target)
    })

    it("checkModuleExist", async function(){
        let checkOne = await this.Hub.checkModuleExist("User", 1)

        expect(checkOne).to.equal(this.User.target)

    })

    it("getPartnerByAddress", async function(){
        let partner = await this.Hub.getPartnerByAddress(this.owner);

        expect(partner.id).to.equal(1n)
    })

    it("getPartnerIdByAddress", async function(){
        let partner = await this.Hub.getPartnerIdByAddress(this.owner)
        expect(partner).to.equal(1n)
    })

    it("getPartnerName", async function(){
        let name = await this.Hub.getPartnerName(1n)

        expect(name).to.equal(ethers.encodeBytes32String("PortalEnergy"))
    })

    it("getPartnerPartyId", async function(){
        let partyId = await this.Hub.getPartnerPartyId(1n)

        expect(partyId).to.equal(ethers.hexlify(ethers.toUtf8Bytes("POE")))
    })

    it("getPartnerCountryCode", async function(){
        let code = await this.Hub.getPartnerCountryCode(1n)
        
        expect(code).to.equal(ethers.hexlify(ethers.toUtf8Bytes("RU")))
    })
})


describe("User", function(){


    it("authSudoUser", async function(){
        let auth = await this.User.authByPassword(this.sudoUser.login,this.sudoUser.password)
        let authSuccess = await GetEventArgumentsByNameAsync(auth, "CreateAuthToken")

        let token = await this.User.getAuthToken(this.sudoUser.login,this.sudoUser.password, authSuccess.token_id)

        this.sudoUser.token = token[1];        

        expect(token[1].length).to.equal(66)
    })


    it("registerByPassword", async function(){
        let register = await this.User.registerByPassword(this.testUser.login,this.testUser.password)
        await register.wait()

        let auth = await this.User.authByPassword(this.testUser.login,this.testUser.password)
        let authSuccess = await GetEventArgumentsByNameAsync(auth, "CreateAuthToken")

        let token = await this.User.getAuthToken(this.testUser.login,this.testUser.password, authSuccess.token_id)

        this.testUser.token = token[1];        

        expect(token[1].length).to.equal(66)
    })



    it("isLogin", async function(){
        const isLogin =  await this.User.isLogin(this.testUser.token);

        expect(Number(isLogin)).to.equal(2)
    })


    it("whoami", async function(){
        const whoami =  await this.User.whoami(this.testUser.token);

        expect(whoami.enable).to.equal(true);
        expect(whoami.user_type).to.equal(0);
        expect(whoami.last_updated).not.to.equal(0);

        expect(whoami.username.toString() == this.testUser.login).to.equal(true)
    })

    it("setTestUserByPhone", async function(){
        await this.User.setTestUserByPhone(ethers.encodeBytes32String("+79999999998"), ethers.encodeBytes32String("8888"));
    })

    it("sendSmsForAuth, authBySmsCode", async function(){

        await this.User.sendSmsForAuth(ethers.encodeBytes32String("+79999999998"))

        let auth = await this.User.authBySmsCode(ethers.encodeBytes32String("+79999999998"), ethers.encodeBytes32String("8888"))
        let authSuccess = await GetEventArgumentsByNameAsync(auth, "CreateAuthToken")

        let token = await this.User.getAuthToken(this.testUser.login,this.testUser.password, authSuccess.token_id)

        this.testUser.token = token[1];        

        expect(token[1].length).to.equal(66)
    })



    it("setTestEmailByPhone", async function(){
        await this.User.setTestUserByEmail(ethers.encodeBytes32String("test@example.com"), ethers.encodeBytes32String("8888"));
    })

    it("sendEmailForAuth, authByEmailCode", async function(){

        await this.User.sendEmailForAuth(ethers.encodeBytes32String("test@example.com"))

        let auth = await this.User.authByEmailCode(ethers.encodeBytes32String("test@example.com"), ethers.encodeBytes32String("8888"))
        let authSuccess = await GetEventArgumentsByNameAsync(auth, "CreateAuthToken")

        let token = await this.User.getAuthToken(this.testUser.login,this.testUser.password, authSuccess.token_id)

        this.testUser.token = token[1];        

        expect(token[1].length).to.equal(66)
    })


    it("authByTg", async function (){
        const user_token = "user=%7B%22id%22%3A14097%2C%22first_name%22%3A%22Artem%22%2C%22last_name%22%3A%22Timofeev%22%2C%22username%22%3A%22timas%22%2C%22language_code%22%3A%22ru%22%2C%22is_premium%22%3Atrue%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-237986505224524480&chat_type=channel&auth_date=1718456760&hash=92ec5dcf30d621ad100042109975eff18dfbe403a525158a4d1b5dedb9f059af";


        const initData = new URLSearchParams(user_token);
        const payload = createpayload(initData)

        const user_data = JSON.parse(initData.get("user")); 

        const web_app_data = {
            id: user_data.id,
            first_name: ethers.encodeBytes32String(user_data.first_name),
            last_name:ethers.encodeBytes32String(user_data.last_name),
            language_code:ethers.encodeBytes32String(user_data.language_code),
        }
        
        let auth = await this.User.authByTg(ethers.toUtf8Bytes(payload), "0x"+initData.get("hash"), web_app_data)
        let authSuccess = await GetEventArgumentsByNameAsync(auth, "CreateAuthToken")

        let token = await this.User.getAuthToken(this.testUser.login,this.testUser.password, authSuccess.token_id)

        this.testUser.token = token[1];        

        expect(token[1].length).to.equal(66)
    })


    it("addCar, getCars, removeCar", async function(){
        await this.User.addCar(this.testUser.token,0,{
            brand:"Tesla",
            model:"Model 3",
            connectors: [1,2]
        })

        const cars = await this.User.getCars(this.testUser.token, 0)

        expect(cars[0].brand).to.equal("Tesla")

        await this.User.removeCar(this.testUser.token, 0,0)

        const cars_zero = await this.User.getCars(this.testUser.token,0)

        expect(cars_zero.length).to.equal(0)
    })

    it("updateBaseData", async function(){
        await this.User.updateBaseData(this.testUser.token, 0, ethers.encodeBytes32String("Pavel"),ethers.encodeBytes32String("Durov"),ethers.encodeBytes32String("en"))
        let whoami =  await this.User.whoami(this.testUser.token);
        expect(whoami.first_name.toString()).to.equal( ethers.encodeBytes32String("Pavel").toString())

        await this.User.updateBaseData(this.sudoUser.token, whoami.id, ethers.encodeBytes32String("Nikolay"),ethers.encodeBytes32String("Durov"),ethers.encodeBytes32String("en"))

        whoami = await this.User.whoami(this.testUser.token);
        expect(whoami.first_name.toString()).to.equal( ethers.encodeBytes32String("Nikolay").toString())
    })

    it("updateCompanyInfo", async function(){
        await this.User.updateCompanyInfo(this.testUser.token, 0, {
            name: "Portal",
            description: "Wow",
            inn:1212,
            kpp: 121212,
            ogrn: 8767,
            bank_account: 1212121,
            bank_name: "SuperBank",
            bank_bik: 3232234234,
            bank_corr_account: 66543,
            bank_inn: 51442456,
            bank_kpp_account: 787878
        })

        let info = await this.User.getCompanyInfo(this.testUser.token, 0)
        
        expect(info.name).to.equal("Portal")
    })

})


describe("UserSupportChat", function (){

    const messages = [
        { text: "Здравствуйте! Что вы знаете о Ленине?", who: "user" },
        { text: "Здравствуйте! Ленин был основателем Советского государства.", who: "admin" },
        { text: "Какие его выступления были наиболее значительными?", who: "user" },
        { text: "Одним из самых известных является 'Что делать?'", who: "admin" },
        { text: "А о чем он там говорит?", who: "user" },
        { text: "'Что делать?' обсуждает необходимость партийной организации.", who: "admin" },
        { text: "Какова была его роль в Октябрьской революции?", who: "user" },
        { text: "Он был лидером большевиков и сыграл ключевую роль в революции.", who: "admin" },
        { text: "Интересно! А каковы основные идеи Ленина?", who: "user" },
        { text: "Основные идеи включают социализм и диктатуру пролетариата.", who: "admin" },
        { text: "А что он говорил о международной революции?", who: "user" },
        { text: "Он считал, что революция должна быть международной для успеха.", who: "admin" },
        { text: "Каковы его взгляды на империализм?", who: "user" },
        { text: "Ленин считал империализм высшей стадией капитализма.", who: "admin" },
        { text: "Какие у него были отношения с другими социалистами?", who: "user" },
        { text: "Он часто конфликтовал с меньшевиками.", who: "admin" },
        { text: "Почему он так не любил меньшевиков?", who: "user" },
        { text: "Он считал их слишком осторожными и медлительными.", who: "admin" },
        { text: "Как он относился к крестьянству?", who: "user" },
        { text: "Ленин видел крестьян как союзников пролетариата.", who: "admin" },
        { text: "А что насчет NEP?", who: "user" },
        { text: "НЭП был политикой экономической реконструкции после гражданской войны.", who: "admin" },
        { text: "Почему он ввел НЭП?", who: "user" },
        { text: "Он считал, что это необходимо для восстановления экономики.", who: "admin" },
        { text: "Каковы были последствия НЭП?", who: "user" },
        { text: "НЭП способствовал экономическому росту, но также вызвал критику.", who: "admin" },
        { text: "Кто был его ближайшим соратником?", who: "user" },
        { text: "Одним из его соратников был Троцкий.", who: "admin" },
        { text: "Каковы были разногласия между ними?", who: "user" },
        { text: "Они расходились во мнениях по поводу стратегии революции.", who: "admin" },
        { text: "Что произошло после смерти Ленина?", who: "user" },
        { text: "После его смерти началась борьба за власть между различными лидерами.", who: "admin" },
        { text: "Кто стал его преемником?", who: "user" },
        { text: "Сталин постепенно стал доминирующей фигурой.", who: "admin" },
        { text: "Как Ленин воспринимал Сталина?", who: "user" },
        { text: "Он предостерегал от слишком большой власти Сталина в своем завещании.", who: "admin" },
        { text: "Что еще было в его завещании?", who: "user" },
        { text: "Он рекомендовал создать коллективное руководство.", who: "admin" },
        { text: "Каковы были взгляды Ленина на культуру?", who: "user" },
        { text: "Он считал, что культура должна служить социалистическим целям.", who: "admin" },
        { text: "Какова была его позиция по отношению к религии?", who: "user" },
        { text: "Ленин был атеистом и критиковал религию как опиум народа.", who: "admin" },
        { text: "Как он относился к искусству?", who: "user" },
        { text: "Он поддерживал искусство, которое пропагандировало социализм.", who: "admin" },
        { text: "Какие у него были взгляды на образование?", who: "user" },
        { text: "Ленин считал образование ключевым для развития общества.", who: "admin" },
        { text: "Каковы его достижения в области образования?", who: "user" },
        { text: "Были созданы новые школы и университеты, доступные для всех.", who: "admin" },
    ];
    


    it("createTopic", async function(){
        const tx = await this.UserSupportChat.createTopic(this.testUser.token, messages[0].text, 1 )

        let createTopicSuccess = await GetEventArgumentsByNameAsync(tx, "CreateTopic")

        expect(createTopicSuccess.topic_id).to.equal(0)
        expect(createTopicSuccess.theme).to.equal(1)
    })


    it("getTopic", async function(){
        const topic = await this.UserSupportChat.getTopic(this.testUser.token, 0);

        expect(topic.create_user_id).to.equal(2)
        expect(topic.message_counter).to.equal(1)
        expect(topic.theme).to.equal(1)
        expect(topic.closed).to.equal(false)
    })

    it("getMyTopics", async function(){
        const topics = await this.UserSupportChat.getMyTopics(this.testUser.token, 0)

        expect(topics[0].create_user_id).to.equal(2)
        expect(topics[0].message_counter).to.equal(1)
        expect(topics[0].theme).to.equal(1)
        expect(topics[0].closed).to.equal(false)
        
    })

    it("ChatEmitation", async function(){
        for (let index = 1; index < messages.length; index++) {
            const message = messages[index];

            var tx;
            
            if(message.who == "user"){
                tx = await this.UserSupportChat.sendMessage(this.testUser.token, 0, {text:message.text, reply_to:0,image:ethers.toUtf8Bytes("")})

            }else{
                tx = await this.UserSupportChat.sendMessage(this.sudoUser.token, 0, {text:message.text, reply_to:0,image:ethers.toUtf8Bytes("")})
            }

            let sendMessageSuccess = await GetEventArgumentsByNameAsync(tx, "Message")
            expect(sendMessageSuccess.topic_id).to.equal(0)
            expect(sendMessageSuccess.message_id).to.equal(index)
        }
    })


    it("getMessages", async function(){
        const topicMessages = await this.UserSupportChat.getMessages(this.testUser.token, 0, 0);

        for (let index = 0; index < 10; index++) {
            const message = messages[index];
            
            expect(message.text).to.equal(topicMessages[index].text)
        }

        const topicMessagesOffset = await this.UserSupportChat.getMessages(this.testUser.token, 0, 10);

        for (let index = 10, i =0; index < 20; index++, i++) {
            const message = messages[index];
            
            expect(message.text).to.equal(topicMessagesOffset[i].text)
        }


        const topicMessagesOffset2 = await this.UserSupportChat.getMessages(this.testUser.token, 0, 40);

        for (let index = 40, i =0; index < 20; index++, i++) {
            const message = messages[index];
            
            expect(message.text).to.equal(topicMessagesOffset2[i].text)
        }

    })

    it("setRating", async function(){
        await this.UserSupportChat.setRating(this.testUser.token, 0,5)

        const topic = await this.UserSupportChat.getTopic(this.testUser.token,0);

        expect(topic.user_rating).to.equal(5)
    })


    it("setReadedMessages", async function(){
        var readed = []
        for (let index = 0; index < messages.length; index++) {
            const element = messages[index];

            if(element.who == "admin"){
                readed.push(index)
            }
            
        }

        await this.UserSupportChat.setReadedMessages(this.testUser.token,0, readed)


        const topicMessages = await this.UserSupportChat.getMessages(this.testUser.token, 0, 0);

        expect(topicMessages[readed[0]].readed).to.equal(true);
    })


    it("closeTopic", async function(){
        let tx = await this.UserSupportChat.closeTopic(this.testUser.token, 0);
        let closeTopicSuccess = await GetEventArgumentsByNameAsync(tx, "CloseTopic")

        expect(closeTopicSuccess.topic_id).to.equal(0);
        expect(closeTopicSuccess.user_id).to.equal(2);


        const topic = await this.UserSupportChat.getTopic(this.testUser.token, 0);
        
        expect(topic.closed).to.equal(true);
    })
})





describe("UserAccess", function(){
    it("sudo getMyModulesAccess", async function(){

        const accesModules =  await this.UserAccess.getMyModulesAccess(this.sudoUser.token);
    
        expect(accesModules[1][0]).to.equal(6)
        expect(accesModules[1][1]).to.equal(6)
    })

    it("sudo getModuleAccessLevel", async function(){

        const accessToGroup =  await this.UserAccess.getModuleAccessLevel("UserGroups", 1);
        expect(accessToGroup).to.equal(6)
    })

    it("setAccessLevelToModule", async function(){
        const tx = await this.UserAccess.setAccessLevelToModule(this.sudoUser.token,2,"User", 6);
        tx.wait()

        const result = await this.UserAccess.getModuleAccessLevel("User",2)

        expect(result).to.equal(6);
    })
})



describe("UserGroups", function(){
    it("getMyGroups", async function(){
        
        const myGroups =  await this.UserGroups.getMyGroups(this.sudoUser.token);
        expect(myGroups.length).to.equal(1)
        expect(myGroups[0].name).to.equal("sudo")
    })

    it("addGroup", async function(){
        await this.UserGroups.addGroup(this.sudoUser.token, "test");
        const myGroups =  await this.UserGroups.getMyGroups(this.sudoUser.token);
        expect(myGroups.length).to.equal(2)
        
    });
})


describe("Tariff", function(){
    const free_tariff = {
        currency: 1,
        _type: 1,
        tariff_alt_text: [{
            language: "ru",
            text: "Описание тарифа"
        }],
        tariff_alt_url: "",
        elements: [
            {
                price_components: [
                    {
                        _type: 1,
                        price: 0,
                        vat:0,
                        step_size:0
                    }
                ],
                restrictions: {
                    start_unixtime:0,
                    end_unixtime:0,
                    min_kwh:0,
                    max_kwh:0,
                    min_current:0,
                    max_current:0,
                    min_power:0,
                    max_power:0,
                    min_duration:0,
                    max_duration:0,
                    day_of_week:[0],
                    reservation:0
                }
            }
        ]
    }

    const energy_mix = {
        is_green_energy: true,
        energy_sources: [{
            source: 1,
            percentage:10,
        }],
        environ_impact: [{
            category: 1,
            amount:10
        }],
        supplier_name: "test",
        energy_product_name: "test"
    }

    it("addDefaultFreeTariff", async function(){
        await this.UserAccess.setAccessLevelToModule(this.sudoUser.token,2,"Tariff", 4);
        const tx =  await this.Tariff.add(this.testUser.token, free_tariff);
        let result = await GetEventArgumentsByNameAsync(tx, "AddTariff")
        expect(result.uid).to.equal(1)
        expect(result.partner_id).to.equal(1)
    })


    it("setMinPrice", async function(){
        await this.Tariff.setMinPrice(this.testUser.token, 1, {
            excl_vat:10,
            incl_vat:12
        })

        const tariff = await this.Tariff.get(1);

        expect(tariff.min_price.excl_vat).to.equal(10)
    })

    it("setMaxPrice", async function(){
        await this.Tariff.setMaxPrice(this.testUser.token, 1, {
            excl_vat:10,
            incl_vat:12
        })

        const tariff = await this.Tariff.get(1);

        expect(tariff.max_price.excl_vat).to.equal(10)
    })

    it("setStartDateTime", async function(){
        const time = Date.now();
        await this.Tariff.setStartDateTime(this.testUser.token, 1, time)

        const tariff = await this.Tariff.get(1);

        expect(tariff.start_date_time).to.equal(time)
    })

    it("setEndDateTime", async function(){
        const time = Date.now();
        await this.Tariff.setEndDateTime(this.testUser.token, 1, time)

        const tariff = await this.Tariff.get(1);

        expect(tariff.end_date_time).to.equal(time)
    })

    it("setEnergyMix", async function(){
        const time = Date.now();
        await this.Tariff.setEnergyMix(this.testUser.token, 1, energy_mix)

        const tariff = await this.Tariff.get(1);

        expect(tariff.energy_mix.is_green_energy).to.equal(true)
    })

    it("get", async function(){
        const tariff = await this.Tariff.get(1);

        expect(tariff.last_updated).not.to.be.equal(0)
        expect(tariff.country_code).to.equal(ethers.hexlify(ethers.toUtf8Bytes("RU")))
        expect(tariff.party_id).to.equal(ethers.hexlify(ethers.toUtf8Bytes("POE")))
       
    })


})

describe("Locations", function(){
    const location = {
        name: "New location",
        _address: "Dom kolotuskina",
        city:  ethers.encodeBytes32String("Moskow"),
        postal_code: ethers.encodeBytes32String("103892"),
        state: ethers.encodeBytes32String("Moskow"),
        country: ethers.encodeBytes32String("RUS"),
        coordinates: {
            latitude: "59.694982",
            longtitude: "30.416469"
        },
        parking_type: 5,
        facilities: [1,2], // Hotel, Restaurant
        time_zone : "Moskow/Europe",
        charging_when_closed: true,
        publish: true
    };

    const image = {
        url: "https://upload.wikimedia.org/wikipedia/ru/thumb/e/e8/BORAT%21.jpg/201px-BORAT%21.jpg",
        thumbnail_ipfs: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Borat_in_Cologne.jpg/220px-Borat_in_Cologne.jpg",
        category: 3,
        _type: 1,
        width: 100,
        height: 100
    };

    const relatedLocation = {
        latitude: ethers.parseEther("59.694982"),
        longtitude: ethers.parseEther("30.416469"),
        name: [{
            language: "ru",
            text: "Кафе"
        }]
    };

    const openingTimes = {
        twentyfourseven: true,
        regular_hours:[
            {
                week_day:1,
                period_begin:"7:00",
                period_end:"21:00"
            }
        ],
        exceptional_openings:[
            {
                begin:7,
                end:21
            }
        ],
        exceptional_closings:[
            {
                begin:7,
                end:21
            }
        ],
    }

    const direction = {
        language: "ru",
        text: "Заезд с улицы колотушкина, возле волшебного дуба"        
    }

    it("AddLocation", async function(){

        await this.UserAccess.setAccessLevelToModule(this.sudoUser.token,2,"Location", 4);

        const tx =  await this.Location.addLocation(this.testUser.token, location);

        let result = await GetEventArgumentsByNameAsync(tx, "AddLocation")
        expect(result.uid).to.equal(1)
        expect(result.partner_id).to.equal(1)
    })

    it("addRelatedLocation", async function(){

        await this.Location.addRelatedLocation(this.testUser.token, 1, relatedLocation);

    })

    it("addImage", async function(){
        await this.Location.addImage(this.testUser.token, 1, image);
    })

    it("addDirection", async function(){
        await this.Location.addDirection(this.testUser.token, 1, direction);
    })


    it("setOpeningTimes", async function(){
        await this.Location.setOpeningTimes(this.testUser.token, 1, openingTimes);
    })

    it("getLocation", async function(){

        
        const newLocation = await this.Location.getLocation(1);
        
        expect(newLocation.location.uid).to.equal(1)
        expect(newLocation.location.city).to.equal(location.city)
        expect(newLocation.location.postal_code).to.equal(location.postal_code)
        expect(newLocation.location.state).to.equal(location.state)
        expect(newLocation.location.country).to.equal(location.country)

        expect(newLocation.location.coordinates.latitude).to.equal(ethers.parseEther(location.coordinates.latitude))
        expect(newLocation.location.coordinates.longtitude).to.equal(ethers.parseEther(location.coordinates.longtitude))
        expect(newLocation.location.parking_type).to.equal(location.parking_type)
        expect(newLocation.location.facilities.join(",")).to.equal(location.facilities.join(","))
        expect(newLocation.location.time_zone).to.equal(location.time_zone)
        expect(newLocation.location.charging_when_closed).to.equal(location.charging_when_closed)
        // relatedlocation
        expect(newLocation.related_locations[0].latitude).to.equal(relatedLocation.latitude)
        expect(newLocation.related_locations[0].longtitude).to.equal(relatedLocation.longtitude)
        expect(newLocation.related_locations[0].name[0].language).to.equal(relatedLocation.name[0].language)
        expect(newLocation.related_locations[0].name[0].text).to.equal(relatedLocation.name[0].text)
        //image
        expect(newLocation.images[0].url).to.equal(image.url)
        expect(newLocation.images[0].thumbnail).to.equal(image.thumbnail)
        expect(newLocation.images[0].category).to.equal(image.category)
        expect(newLocation.images[0]._type).to.equal(image._type)
        expect(newLocation.images[0].width).to.equal(image.width)
        expect(newLocation.images[0].height).to.equal(image.height)

        //OpeningTimes
        expect(newLocation.opening_times.twentyfourseven).to.equal(openingTimes.twentyfourseven)
        expect(newLocation.opening_times.regular_hours.week_day).to.equal(openingTimes.regular_hours.week_day)
        expect(newLocation.opening_times.regular_hours.period_begin).to.equal(openingTimes.regular_hours.period_begin)
        expect(newLocation.opening_times.regular_hours.period_end).to.equal(openingTimes.regular_hours.period_end)
        expect(newLocation.opening_times.exceptional_openings.begin).to.equal(openingTimes.exceptional_openings.begin)
        expect(newLocation.opening_times.exceptional_openings.end).to.equal(openingTimes.exceptional_openings.end)
        expect(newLocation.opening_times.exceptional_closings.begin).to.equal(openingTimes.exceptional_closings.begin)
        expect(newLocation.opening_times.exceptional_closings.end).to.equal(openingTimes.exceptional_closings.end)

        // Direction
        expect(newLocation.directions[0].language).to.equal(direction.language)
        expect(newLocation.directions[0].text).to.equal(direction.text)

    })


    it("removeRelatedLocation", async function(){
        await this.Location.removeRelatedLocation(this.testUser.token, 1, 1); 
        const newLocation = await this.Location.getLocation(1);
        expect(newLocation.related_locations.length).to.equal(0)
    })

    it("removeImage", async function(){
        await this.Location.removeImage(this.testUser.token, 1, 1); 
        const newLocation = await this.Location.getLocation(1);
        expect(newLocation.images.length).to.equal(0)
    })

    it("removeDirection", async function(){
        await this.Location.removeDirection(this.testUser.token, 1, 1); 
        const newLocation = await this.Location.getLocation(1);
        expect(newLocation.directions.length).to.equal(0)
    })


/*     it("addlocations", async function(){
        const fs = require('fs');
        const coords = JSON.parse( fs.readFileSync(__dirname+"/../coords.json", 'utf8'))

        for (let index = 0; index < coords.length; index++) {
            const coord = coords[index];
            const loc = location;
            loc.coordinates.latitude = coord.lat;
            loc.coordinates.longtitude =coord.lon;

            let tx = await this.Location.addLocation(this.testUser.token, loc);

            let result = await GetEventArgumentsByNameAsync(tx, "AddLocation")


            let newLocation = await this.Location.getLocation(Number(result.uid));
            expect(newLocation[0].coordinates.latitude).to.equal(ethers.parseEther(loc.coordinates.latitude))
            expect(newLocation[0].coordinates.longtitude).to.equal(ethers.parseEther(loc.coordinates.longtitude))

        }
    }) */

})



describe("EVSE", function(){
    const {EVSE, EVSEmeta, image} = getEVSEData();

    it("add", async function(){
        await this.UserAccess.setAccessLevelToModule(this.sudoUser.token,2,"EVSE", 4);
        
        const tx =  await this.EVSE.add(this.testUser.token, EVSE, 1);

        let result = await GetEventArgumentsByNameAsync(tx, "AddEVSE")
        expect(result.uid).to.equal(1)
        expect(result.partner_id).to.equal(1)

    })

    it("setMeta", async function(){
        await this.EVSE.setMeta(this.testUser.token, 1, EVSEmeta)
    })

    it("addImage", async function(){
        await this.EVSE.addImage(this.testUser.token, 1, image);
    })

    it("get", async function(){
        const evse = await this.EVSE.get(1)

        expect(evse.evse.evse_id).to.equal(EVSE.evse_id)
        expect(evse.evse.evse_model).to.equal(EVSE.evse_model)
        expect(evse.evse.physical_reference).to.equal(EVSE.physical_reference)
        expect(evse.evse.directions.language).to.equal(EVSE.directions.language)
        expect(evse.evse.directions.text).to.equal(EVSE.directions.text)

        expect(evse.meta.status_schedule.begin).to.equal(EVSEmeta.status_schedule.begin)
        expect(evse.meta.status_schedule.end).to.equal(EVSEmeta.status_schedule.end)
        expect(evse.meta.status_schedule.status).to.equal(EVSEmeta.status_schedule.status)
        expect(evse.meta.capabilities[0]).to.equal(EVSEmeta.capabilities[0])
        expect(evse.meta.coordinates.latitude).to.equal(EVSEmeta.coordinates.latitude)
        expect(evse.meta.coordinates.longtitude).to.equal(EVSEmeta.coordinates.longtitude)
        expect(evse.meta.parking_restrictions[0]).to.equal(EVSEmeta.parking_restrictions[0])
        expect(evse.meta.floor_level).to.equal(EVSEmeta.floor_level)


        expect(evse.images[0].url).to.equal(image.url)
        expect(evse.images[0].thumbnail).to.equal(image.thumbnail)
        expect(evse.images[0].category).to.equal(image.category)
        expect(evse.images[0]._type).to.equal(image._type)
        expect(evse.images[0].width).to.equal(image.width)
        expect(evse.images[0].height).to.equal(image.height)

    })



    it("removeImage", async function(){
        await this.EVSE.removeImage(this.testUser.token, 1, 1); 
        const evse = await this.EVSE.get(1);
        expect(evse.images.length).to.equal(0)
    })
})

describe("Connector", function(){
    const {connector} = getEVSEData();

    it("add", async function(){
        await this.UserAccess.setAccessLevelToModule(this.sudoUser.token,2,"Connector", 4);

        const tx =  await this.Connector.add(this.testUser.token, connector, 1);

        let result = await GetEventArgumentsByNameAsync(tx, "AddConnector")
        expect(result.uid).to.equal(1)
        expect(result.partner_id).to.equal(1)
    })
})


/* describe("LocationSearch", function(){


    it("inArea all kirov zavod", async function(){

        const locations = await this.LocationSearch.inArea({publish: true, topRightLat:"59.883143",topRightLong:"30.270558",bottomLeftLat:"59.870363",bottomLeftLong:"30.247867", offset:0, connectors:[1], onlyFreeConnectors:true})
        expect(locations[0].length).to.equal(2)
    })

    it("inArea all saint petersburg", async function(){

        // all saint petersburg
        const locations = await this.LocationSearch.inArea({publish: true, topRightLat:"60.133835",topRightLong:"30.933217",bottomLeftLat:"59.630048",bottomLeftLong:"29.649831", offset:0, connectors:[1], onlyFreeConnectors:true})

        expect(locations[0].length).to.equal(50)
    })


    it("inArea all saint petersburg with offset", async function(){

        // all saint petersburg
        const locations = await this.LocationSearch.inArea({publish: true, topRightLat:"60.133835",topRightLong:"30.933217",bottomLeftLat:"59.630048",bottomLeftLong:"29.649831", offset:50, connectors:[1], onlyFreeConnectors:true})

        expect(locations[0].length).to.equal(24)
    })



    it("inAreaMany", async function(){

        let locations_1 = await this.LocationSearch.inArea({publish: true, topRightLat:"66.537305",topRightLong:"177.814396",bottomLeftLat:"43.146425",bottomLeftLong:"11.585331",offset:0, connectors:[1], onlyFreeConnectors:true})
        expect(locations_1[1]).to.equal(1135n)

    })

    it("inAreaMany with offset", async function(){

        let locations_1 = await this.LocationSearch.inArea({publish: true, topRightLat:"66.537305",topRightLong:"177.814396",bottomLeftLat:"43.146425",bottomLeftLong:"11.585331",offset:50, connectors:[1], onlyFreeConnectors:true})
        expect(locations_1[0].length).to.equal(50)

    })

}) */


describe("Location: check after all", function(){

    it("getlocation", async function(){
        const {EVSE, EVSEmeta, image, connector} = getEVSEData();
        //await this.Location.addEVSE(this.testUser.token, 1, 1);
        const loc = await this.Location.getLocation(1);

        expect(loc.evses[0].evse.evse_id).to.equal(EVSE.evse_id)
        expect(loc.evses[0].evse.evse_model).to.equal(EVSE.evse_model)
        expect(loc.evses[0].evse.physical_reference).to.equal(EVSE.physical_reference)
        expect(loc.evses[0].evse.directions.language).to.equal(EVSE.directions.language)
        expect(loc.evses[0].evse.directions.text).to.equal(EVSE.directions.text)

        expect(loc.evses[0].meta.status_schedule.begin).to.equal(EVSEmeta.status_schedule.begin)
        expect(loc.evses[0].meta.status_schedule.end).to.equal(EVSEmeta.status_schedule.end)
        expect(loc.evses[0].meta.status_schedule.status).to.equal(EVSEmeta.status_schedule.status)
        expect(loc.evses[0].meta.capabilities[0]).to.equal(EVSEmeta.capabilities[0])
        expect(loc.evses[0].meta.coordinates.latitude).to.equal(EVSEmeta.coordinates.latitude)
        expect(loc.evses[0].meta.coordinates.longtitude).to.equal(EVSEmeta.coordinates.longtitude)
        expect(loc.evses[0].meta.parking_restrictions[0]).to.equal(EVSEmeta.parking_restrictions[0])
        expect(loc.evses[0].meta.floor_level).to.equal(EVSEmeta.floor_level)


        expect(loc.evses[0].connectors[0].connector.standard).to.equal(connector.standard)
        expect(loc.evses[0].connectors[0].connector.format).to.equal(connector.format)
        expect(loc.evses[0].connectors[0].connector.power_type).to.equal(connector.power_type)
        expect(loc.evses[0].connectors[0].connector.max_voltage).to.equal(connector.max_voltage)
        expect(loc.evses[0].connectors[0].connector.max_amperage).to.equal(connector.max_amperage)
        expect(loc.evses[0].connectors[0].connector.max_electric_power).to.equal(connector.max_electric_power)
        expect(loc.evses[0].connectors[0].connector.terms_and_conditions_url).to.equal(connector.terms_and_conditions_url)
        expect(loc.evses[0].connectors[0].status).to.equal(0)

    })

    it("removeEVSE", async function(){
        await this.Location.removeEVSE(this.testUser.token, 1, 1); 
        
        const newLocation = await this.Location.getLocation(1);
        expect(newLocation[4].length).to.equal(0)
    })

})


function getEVSEData(){
    const EVSE = {
        evse_id: "ufo0001",
        evse_model: 1,
        physical_reference: ethers.encodeBytes32String("Под номером 10"),
        directions: [
            {
                language: "ru",
                text: "Возле пожарного выхода",
            }
        ]
    }

    const EVSEmeta = {
        status_schedule: [
            {
                begin: 123123123, // timestamp
                end:123123123, // timestamp
                status: 6 // maintance
            }
        ],
        capabilities: [1,2,3],
        coordinates: {
            latitude: ethers.parseEther("59.694982"),
            longtitude: ethers.parseEther("30.416469")
        },
        parking_restrictions: [0,2,3],
        floor_level:1
    }

    const image = {
        url: "https://wikimedia.org/",
        thumbnail_ipfs: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Borat_in_Cologne.jpg/220px-Borat_in_Cologne.jpg",
        category: 3,
        _type: 1,
        width: 100,
        height: 100
    };
    const connector = {
        standard: 1,
        format:2,
        power_type: 1,
        max_voltage: 220,
        max_amperage: 32,
        max_electric_power: 7,
        terms_and_conditions_url: "https://portalenergy.tech"
    }
    return {EVSE,EVSEmeta,image,connector}
}