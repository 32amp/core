
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


    this.contracts = await deploy(tgtoken,this.sudoUser,{User:true,Auth:true, UserSupportChat: true})

    const {testUser, sudoUser} = await auth(this.contracts.Auth)

    this.testUser = testUser
    this.sudoUser = sudoUser;

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
    

    it("getTopics empty", async function(){
        const topics = await this.contracts.UserSupportChat.getMyTopics(this.testUser.token, 0)

        expect(topics[0].length).to.equal(0)
    })


    it("createTopic", async function(){
        const tx = await this.contracts.UserSupportChat.createTopic(this.testUser.token, messages[0].text, 1 )

        let createTopicSuccess = await GetEventArgumentsByNameAsync(tx, "CreateTopic")

        expect(createTopicSuccess.topic_id).to.equal(0)
        expect(createTopicSuccess.theme).to.equal(1)
    })


    it("getTopic", async function(){
        const topic = await this.contracts.UserSupportChat.getTopic(this.testUser.token, 0);

        expect(topic.create_user_id).to.equal(2)
        expect(topic.message_counter).to.equal(1)
        expect(topic.theme).to.equal(1)
        expect(topic.closed).to.equal(false)
    })

    it("getMyTopics", async function(){
        const topics = await this.contracts.UserSupportChat.getMyTopics(this.testUser.token, 0)

        expect(topics[0][0].topic.create_user_id).to.equal(2)
        expect(topics[0][0].topic.message_counter).to.equal(1)
        expect(topics[0][0].topic.theme).to.equal(1)
        expect(topics[0][0].topic.closed).to.equal(false)
        expect(topics[1]).to.equal(1)
        
    })

    it("ChatEmitation", async function(){
        for (let index = 1; index < messages.length; index++) {
            const message = messages[index];

            var tx;

            if(message.who == "user"){
                tx = await this.contracts.UserSupportChat.sendMessage(this.testUser.token, 0, {text:message.text, reply_to:0,image:ethers.toUtf8Bytes("")})

            }else{
                tx = await this.contracts.UserSupportChat.sendMessage(this.sudoUser.token, 0, {text:message.text, reply_to:0,image:ethers.toUtf8Bytes("")})
            }


            let sendMessageSuccess = await GetEventArgumentsByNameAsync(tx, "Message")

            expect(sendMessageSuccess.topic_id).to.equal(0)
            expect(sendMessageSuccess.message_id).to.equal(index)

        }
    })


    it("getMessages", async function(){
        const topicMessages = await this.contracts.UserSupportChat.getMessages(this.testUser.token, 0, 0);

        for (let index = 0; index < 10; index++) {
            const message = messages[index];
            
            expect(message.text).to.equal(topicMessages[0][index].message.text)
        }

        const topicMessagesOffset = await this.contracts.UserSupportChat.getMessages(this.testUser.token, 0, 10);

        for (let index = 10, i =0; index < 20; index++, i++) {
            const message = messages[index];
            
            expect(message.text).to.equal(topicMessagesOffset[0][i].message.text)
        }


        const topicMessagesOffset2 = await this.contracts.UserSupportChat.getMessages(this.testUser.token, 0, 40);

        for (let index = 40, i =0; index < 20; index++, i++) {
            const message = messages[index];
            
            expect(message.text).to.equal(topicMessagesOffset2[0][i].message.text)
        }

    })

    it("setRating", async function(){
        await this.contracts.UserSupportChat.setRating(this.testUser.token, 0,5)

        const topic = await this.contracts.UserSupportChat.getTopic(this.testUser.token,0);

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

        await this.contracts.UserSupportChat.setReadedMessages(this.testUser.token,0, readed)


        const topicMessages = await this.contracts.UserSupportChat.getMessages(this.testUser.token, 0, 0);

        expect(topicMessages[0][readed[0]].message.readed).to.equal(true);
    })


    it("closeTopic", async function(){
        let tx = await this.contracts.UserSupportChat.closeTopic(this.testUser.token, 0);
        let closeTopicSuccess = await GetEventArgumentsByNameAsync(tx, "CloseTopic")

        expect(closeTopicSuccess.topic_id).to.equal(0);
        expect(closeTopicSuccess.user_id).to.equal(2);


        const topic = await this.contracts.UserSupportChat.getTopic(this.testUser.token, 0);

        expect(topic.closed).to.equal(true);
    })
})
