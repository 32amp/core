
const { expect } = require('chai');
const { getEventArguments } = require("../utils/utils");
const { deploy } = require("./lib/deploy");
const { encryptAESGCM } = require("../helpers/aes");

const aeskey = "8194dfd74925f99fa84026c71180f230cb73054687a5f836a3a8642380d82282";


describe("UserSupportChat", function () {


    before(async function () {
        const accounts = await ethers.getSigners();
        this.owner = accounts[0];
        this.simpleUser = accounts[1];
        this.adminUser = accounts[2];
        this.contracts = await deploy({ User: true, UserSupportChat: true })

        await this.contracts.User.addUser(this.simpleUser.address);
        await this.contracts.User.addUser(this.adminUser.address);

        await this.contracts.UserAccess.setAccessLevelToModule(this.adminUser.address, "UserSupportChat", 4);



        this.messages = [
            { text: await encryptAESGCM("Здравствуйте! Что вы знаете о Ленине?", aeskey), who: "user" },
            { text: await encryptAESGCM("Здравствуйте! Ленин был основателем Советского государства.", aeskey), who: "admin" },
            { text: await encryptAESGCM("Какие его выступления были наиболее значительными?", aeskey), who: "user" },
            { text: await encryptAESGCM("Одним из самых известных является 'Что делать?'", aeskey), who: "admin" },
            { text: await encryptAESGCM("А о чем он там говорит?", aeskey), who: "user" },
            { text: await encryptAESGCM("'Что делать?' обсуждает необходимость партийной организации.", aeskey), who: "admin" },
            { text: await encryptAESGCM("Какова была его роль в Октябрьской революции?", aeskey), who: "user" },
            { text: await encryptAESGCM("Он был лидером большевиков и сыграл ключевую роль в революции.", aeskey), who: "admin" },
            { text: await encryptAESGCM("Интересно! А каковы основные идеи Ленина?", aeskey), who: "user" },
            { text: await encryptAESGCM("Основные идеи включают социализм и диктатуру пролетариата.", aeskey), who: "admin" },
            { text: await encryptAESGCM("А что он говорил о международной революции?", aeskey), who: "user" },
            { text: await encryptAESGCM("Он считал, что революция должна быть международной для успеха.", aeskey), who: "admin" },
            { text: await encryptAESGCM("Каковы его взгляды на империализм?", aeskey), who: "user" },
            { text: await encryptAESGCM("Ленин считал империализм высшей стадией капитализма.", aeskey), who: "admin" },
            { text: await encryptAESGCM("Какие у него были отношения с другими социалистами?", aeskey), who: "user" },
            { text: await encryptAESGCM("Он часто конфликтовал с меньшевиками.", aeskey), who: "admin" },
            { text: await encryptAESGCM("Почему он так не любил меньшевиков?", aeskey), who: "user" },
            { text: await encryptAESGCM("Он считал их слишком осторожными и медлительными.", aeskey), who: "admin" },
            { text: await encryptAESGCM("Как он относился к крестьянству?", aeskey), who: "user" },
            { text: await encryptAESGCM("Ленин видел крестьян как союзников пролетариата.", aeskey), who: "admin" },
            { text: await encryptAESGCM("А что насчет NEP?", aeskey), who: "user" },
            { text: await encryptAESGCM("НЭП был политикой экономической реконструкции после гражданской войны.", aeskey), who: "admin" },
            { text: await encryptAESGCM("Почему он ввел НЭП?", aeskey), who: "user" },
            { text: await encryptAESGCM("Он считал, что это необходимо для восстановления экономики.", aeskey), who: "admin" },
            { text: await encryptAESGCM("Каковы были последствия НЭП?", aeskey), who: "user" },
            { text: await encryptAESGCM("НЭП способствовал экономическому росту, но также вызвал критику.", aeskey), who: "admin" },
            { text: await encryptAESGCM("Кто был его ближайшим соратником?", aeskey), who: "user" },
            { text: await encryptAESGCM("Одним из его соратников был Троцкий.", aeskey), who: "admin" },
            { text: await encryptAESGCM("Каковы были разногласия между ними?", aeskey), who: "user" },
            { text: await encryptAESGCM("Они расходились во мнениях по поводу стратегии революции.", aeskey), who: "admin" },
            { text: await encryptAESGCM("Что произошло после смерти Ленина?", aeskey), who: "user" },
            { text: await encryptAESGCM("После его смерти началась борьба за власть между различными лидерами.", aeskey), who: "admin" },
            { text: await encryptAESGCM("Кто стал его преемником?", aeskey), who: "user" },
            { text: await encryptAESGCM("Сталин постепенно стал доминирующей фигурой.", aeskey), who: "admin" },
            { text: await encryptAESGCM("Как Ленин воспринимал Сталина?", aeskey), who: "user" },
            { text: await encryptAESGCM("Он предостерегал от слишком большой власти Сталина в своем завещании.", aeskey), who: "admin" },
            { text: await encryptAESGCM("Что еще было в его завещании?", aeskey), who: "user" },
            { text: await encryptAESGCM("Он рекомендовал создать коллективное руководство.", aeskey), who: "admin" },
            { text: await encryptAESGCM("Каковы были взгляды Ленина на культуру?", aeskey), who: "user" },
            { text: await encryptAESGCM("Он считал, что культура должна служить социалистическим целям.", aeskey), who: "admin" },
            { text: await encryptAESGCM("Какова была его позиция по отношению к религии?", aeskey), who: "user" },
            { text: await encryptAESGCM("Ленин был атеистом и критиковал религию как опиум народа.", aeskey), who: "admin" },
            { text: await encryptAESGCM("Как он относился к искусству?", aeskey), who: "user" },
            { text: await encryptAESGCM("Он поддерживал искусство, которое пропагандировало социализм.", aeskey), who: "admin" },
            { text: await encryptAESGCM("Какие у него были взгляды на образование?", aeskey), who: "user" },
            { text: await encryptAESGCM("Ленин считал образование ключевым для развития общества.", aeskey), who: "admin" },
            { text: await encryptAESGCM("Каковы его достижения в области образования?", aeskey), who: "user" },
            { text: await encryptAESGCM("Были созданы новые школы и университеты, доступные для всех.", aeskey), who: "admin" },
        ];

        this.messagesReverse = JSON.parse(JSON.stringify(this.messages));
        this.messagesReverse.reverse()

    })


    it("getTopics empty", async function () {
        const topics = await this.contracts.UserSupportChat.connect(this.simpleUser).getMyTopics(0)

        expect(topics[0].length).to.equal(0)
    })


    it("createTopic", async function () {
        const tx = await this.contracts.UserSupportChat.connect(this.simpleUser).createTopic(this.messages[0].text, 1)

        let createTopicSuccess = await getEventArguments(tx, "CreateTopic")

        expect(createTopicSuccess.topic_id).to.equal(0)
        expect(createTopicSuccess.theme).to.equal(1)
    })


    it("getTopic", async function () {
        const topic = await this.contracts.UserSupportChat.connect(this.simpleUser).getTopic(0);

        expect(topic.create_user_account).to.equal(this.simpleUser.address)
        expect(topic.message_counter).to.equal(1)
        expect(topic.theme).to.equal(1)
        expect(topic.closed).to.equal(false)
    })

    it("getMyTopics", async function () {
        const topics = await this.contracts.UserSupportChat.connect(this.simpleUser).getMyTopics(0)

        expect(topics[0][0].topic.create_user_account).to.equal(this.simpleUser.address)
        expect(topics[0][0].topic.message_counter).to.equal(1)
        expect(topics[0][0].topic.theme).to.equal(1)
        expect(topics[0][0].topic.closed).to.equal(false)
        expect(topics[0][0].unreaded_messages).to.equal(0)
        expect(topics[1]).to.equal(1)

    })

    it("ChatEmitation", async function () {
        for (let index = 1; index < this.messages.length; index++) {
            const message = this.messages[index];

            var tx;

            if (message.who == "user") {
                tx = await this.contracts.UserSupportChat.connect(this.simpleUser).sendMessage(0, { text: message.text, reply_to: 0, image: "" })

            } else {
                tx = await this.contracts.UserSupportChat.connect(this.adminUser).sendMessage(0, { text: message.text, reply_to: 0, image: "" })
            }


            let sendMessageSuccess = await getEventArguments(tx, "Message")

            expect(sendMessageSuccess.topic_id).to.equal(0)
            expect(sendMessageSuccess.message_id).to.equal(index)

        }
    })


    it("unreaded mesages", async function () {
        const topics = await this.contracts.UserSupportChat.connect(this.simpleUser).getMyTopics(0)
        expect(topics[0][0].unreaded_messages).to.equal(this.messages.length / 2)
    })


    it("getMessages", async function () {

        const topicMessages = await this.contracts.UserSupportChat.connect(this.simpleUser).getMessages(0, 0);


        for (let index = 0; index < 10; index++) {
            const message = this.messagesReverse[index];

            expect(message.text).to.equal(topicMessages[0][index].message.text)
        }

        const topicMessagesOffset = await this.contracts.UserSupportChat.connect(this.simpleUser).getMessages(0, 10);

        for (let index = 10, i = 0; index < 20; index++, i++) {
            const message = this.messagesReverse[index];

            expect(message.text).to.equal(topicMessagesOffset[0][i].message.text)
        }


        const topicMessagesOffset2 = await this.contracts.UserSupportChat.connect(this.simpleUser).getMessages(0, 40);

        for (let index = 40, i = 0; index < 48; index++, i++) {
            const message = this.messagesReverse[index];

            expect(message.text).to.equal(topicMessagesOffset2[0][i].message.text)
        }

    })

    it("setRating", async function () {
        let tx = await this.contracts.UserSupportChat.connect(this.simpleUser).setRating(0, 5)
        await tx.wait()

        const topic = await this.contracts.UserSupportChat.connect(this.simpleUser).getTopic(0);

        expect(topic.user_rating).to.equal(5)
    })


    it("setReadedMessages", async function () {
        var readed = []
        for (let index = 0; index < this.messages.length; index++) {
            const element = this.messages[index];

            if (element.who == "admin") {
                readed.push(index)
            }

        }

        let tx = await this.contracts.UserSupportChat.connect(this.simpleUser).setReadedMessages(0, readed)
        await tx.wait()

        const topicMessages = await this.contracts.UserSupportChat.connect(this.simpleUser).getMessages(0, 0);

        expect(topicMessages[0][0].message.readed).to.equal(true);

        const topics = await this.contracts.UserSupportChat.connect(this.simpleUser).getMyTopics(0)
        expect(topics[0][0].unreaded_messages).to.equal(0)
    })




    it("closeTopic", async function () {
        let tx = await this.contracts.UserSupportChat.connect(this.simpleUser).closeTopic(0);
        let closeTopicSuccess = await getEventArguments(tx, "CloseTopic")

        expect(closeTopicSuccess.topic_id).to.equal(0);
        expect(closeTopicSuccess.account).to.equal(this.simpleUser.address);


        const topic = await this.contracts.UserSupportChat.connect(this.simpleUser).getTopic(0);

        expect(topic.closed).to.equal(true);
    })

    it("createManyTopics", async function () {


        for (let index = 1; index < 10; index++) {
            const tx = await this.contracts.UserSupportChat.connect(this.simpleUser).createTopic(await encryptAESGCM("Many topics " + index, aeskey), 1)

            let createTopicSuccess = await getEventArguments(tx, "CreateTopic")

            expect(createTopicSuccess.topic_id).to.equal(index)

        }


        let tx = await this.contracts.UserSupportChat.connect(this.adminUser).sendMessage(5, { text:await encryptAESGCM("Unreaded message",aeskey), reply_to: 0, image: "" })

        await tx.wait()

        const topics = await this.contracts.UserSupportChat.connect(this.simpleUser).getMyTopics(0)

        expect(topics[0][0].id).to.equal(5)
        expect(topics[0][0].unreaded_messages).to.equal(1)
    })

})
