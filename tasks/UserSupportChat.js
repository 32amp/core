const userSupportChatScope = scope("UserSupportChat", "Tasks for UserSupportChat module");
const { getEventArguments } = require("../utils/utils");
const { loadConfig } = require("./helpers/configs")
const { accountSelection, partnerSelection } = require("./helpers/promt_selection");
const inquirer = require("inquirer");

const TopicTheme = {
    None: 0,
    ChargingSession: 1,
    App: 2,
    Payment: 3,
    Contact: 4,
};

const TopicRating = {
    None: 0,
    OneStar: 1,
    TwoStar: 2,
    ThreeStar: 3,
    FourStar: 4,
    FiveStar: 5,
};

/**
 * Преобразует тему (TopicTheme) в читаемый текст
 * @param {number} theme - Числовое значение темы
 * @returns {string} - Человекочитаемое название темы
 */
function getTopicThemeText(theme) {
    switch (Number(theme)) {
        case TopicTheme.None:
            return "None";
        case TopicTheme.ChargingSession:
            return "Charging Session";
        case TopicTheme.App:
            return "App";
        case TopicTheme.Payment:
            return "Payment";
        case TopicTheme.Contact:
            return "Contact";
        default:
            return "Unknown Theme";
    }
}

/**
 * Преобразует рейтинг (TopicRating) в читаемый текст
 * @param {number} rating - Числовое значение рейтинга
 * @returns {string} - Человекочитаемый рейтинг
 */
function getTopicRatingText(rating) {
    switch (Number(rating)) {
        case TopicRating.None:
            return "None";
        case TopicRating.OneStar:
            return "⭐ (1 star)";
        case TopicRating.TwoStar:
            return "⭐⭐ (2 stars)";
        case TopicRating.ThreeStar:
            return "⭐⭐⭐ (3 stars)";
        case TopicRating.FourStar:
            return "⭐⭐⭐⭐ (4 stars)";
        case TopicRating.FiveStar:
            return "⭐⭐⭐⭐⭐ (5 stars)";
        default:
            return "Unknown Rating";
    }
}

/**
 * Выводит информацию о топике в читаемом формате
 * @param {Object} topic - Объект топика
 */
function printTopicInfo(topic) {
    console.log("=== Topic Information ===");
    console.log(`ID: ${topic.id}`);
    console.log(`Created At: ${new Date(Number(topic.topic.create_at) * 1000).toLocaleString()}`);
    console.log(`Updated At: ${new Date(Number(topic.topic.update_at) * 1000).toLocaleString()}`);
    console.log(`Created By: ${topic.topic.create_user_account}`);
    console.log(`Theme: ${getTopicThemeText(topic.topic.theme)}`);
    console.log(`Closed: ${topic.topic.closed ? "Yes" : "No"}`);
    console.log(`User Rating: ${getTopicRatingText(topic.topic.user_rating)}`);
    console.log(`Unread Messages: ${topic.unreaded_messages}`);
    console.log("=========================");
}

/**
 * Преобразует сообщение в читаемый формат
 * @param {Object} message - Объект сообщения
 * @param {number} messageId - ID сообщения
 */
function printMessageInfo(message, messageId) {
    console.log("=== Message Information ===");
    console.log(`Message ID: ${messageId}`);
    console.log(`Text: ${message.text}`);
    console.log(`Image IPFS Hash: ${message.image || "None"}`);
    console.log(`Reply To: ${message.reply_to === 0 ? "None" : message.reply_to}`);
    console.log(`Created At: ${new Date(Number(message.create_at) * 1000).toLocaleString()}`);
    console.log(`Read: ${message.readed ? "Yes" : "No"}`);
    console.log(`Author: ${message.account}`);
    console.log("===========================");
}


// Helper function to initialize the UserSupportChat contract
async function getUserSupportChatContract(hre) {
    const config = await loadConfig("config");
    if (typeof config?.deployed?.Hub === "undefined") {
        throw new Error("Hub not deployed");
    }
    const signer = await accountSelection(hre);
    const hub = await hre.ethers.getContractAt("Hub", config.deployed.Hub, signer);
    const partner_id = await partnerSelection();
    const exist = await hub.getModule("UserSupportChat", partner_id);
    if (exist === hre.ethers.ZeroAddress) {
        throw new Error(`Module UserSupportChat does not exist for partner_id ${partner_id}`);
    }
    const userSupportChat = await hre.ethers.getContractAt("UserSupportChat", exist, signer);
    return { userSupportChat, partner_id, signer };
}


// Task to get the contract version
userSupportChatScope.task("version", "Get the version of the UserSupportChat contract")
    .setAction(async (taskArgs, hre) => {
        const { userSupportChat } = await getUserSupportChatContract(hre);
        const version = await userSupportChat.getVersion();
        console.log(`UserSupportChat Contract Version: ${version}`);
    });

// Task to create a new support topic
userSupportChatScope.task("create-topic", "Create a new support topic")
    .setAction(async (taskArgs, hre) => {
        const { userSupportChat } = await getUserSupportChatContract(hre);

        const { text_message, theme } = await inquirer.prompt([
            {
                type: "input",
                name: "text_message",
                message: "Enter the text message for the topic:",
                validate: (input) => input.length > 0 && input.length <= 1000,
            },
            {
                type: "list",
                name: "theme",
                message: "Select the topic theme:",
                choices: Object.keys(TopicTheme),
            },
        ]);

        try {

            console.log(text_message, TopicTheme[theme])
            const tx = await userSupportChat.createTopic(text_message, TopicTheme[theme]);
            const eventArgs = await getEventArguments(tx, "CreateTopic", 1);

            if (eventArgs) {
                console.log(`New topic created with ID: ${eventArgs.topic_id.toString()}`);
            } else {
                console.log("Topic creation failed or event not emitted.");
            }
        } catch (error) {
            const decodedError = userSupportChat.interface.parseError(error.data);
            console.log("Decoded error:", decodedError);
        }
    });

// Task to send a message in a topic
userSupportChatScope.task("send-message", "Send a message in a support topic")
    .setAction(async (taskArgs, hre) => {
        const { userSupportChat } = await getUserSupportChatContract(hre);

        const { topic_id, text, image, reply_to } = await inquirer.prompt([
            {
                type: "input",
                name: "topic_id",
                message: "Enter the topic ID:",
                validate: (input) => !isNaN(input) && input > 0,
            },
            {
                type: "input",
                name: "text",
                message: "Enter the message text:",
                validate: (input) => input.length > 0 && input.length <= 1000,
            },
            {
                type: "input",
                name: "image",
                message: "Enter the IPFS hash of the image (leave empty if none):",
            },
            {
                type: "input",
                name: "reply_to",
                message: "Enter the message ID to reply to (0 for new message):",
                validate: (input) => !isNaN(input) && input >= 0,
            },
        ]);

        const message = {
            text,
            image,
            reply_to: parseInt(reply_to),
        };

        console.log(message)

        const tx = await userSupportChat.sendMessage(topic_id, message);
        const eventArgs = await getEventArguments(tx, "Message", 1);

        if (eventArgs) {
            console.log(`Message sent with ID: ${eventArgs.message_id.toString()}`);
        } else {
            console.log("Message sending failed or event not emitted.");
        }
    });

// Task to set a rating for a topic
userSupportChatScope.task("set-rating", "Set a rating for a support topic")
    .setAction(async (taskArgs, hre) => {
        const { userSupportChat } = await getUserSupportChatContract(hre);

        const { topic_id, rating } = await inquirer.prompt([
            {
                type: "input",
                name: "topic_id",
                message: "Enter the topic ID:",
                validate: (input) => !isNaN(input) && input > 0,
            },
            {
                type: "list",
                name: "rating",
                message: "Select the rating:",
                choices: Object.keys(TopicRating),
            },
        ]);

        const tx = await userSupportChat.setRating(topic_id, TopicRating[rating]);
        console.log("Rating set successfully.");
    });

// Task to close a support topic
userSupportChatScope.task("close-topic", "Close a support topic")
    .setAction(async (taskArgs, hre) => {
        const { userSupportChat } = await getUserSupportChatContract(hre);

        const { topic_id } = await inquirer.prompt([
            {
                type: "input",
                name: "topic_id",
                message: "Enter the topic ID:",
                validate: (input) => !isNaN(input) && input > 0,
            },
        ]);

        const tx = await userSupportChat.closeTopic(topic_id);
        const eventArgs = await getEventArguments(tx, "CloseTopic", 1);

        if (eventArgs) {
            console.log(`Topic closed by: ${eventArgs.account}`);
        } else {
            console.log("Topic closing failed or event not emitted.");
        }
    });

// Task to mark messages as read
userSupportChatScope.task("set-readed-messages", "Mark messages as read in a topic")
    .setAction(async (taskArgs, hre) => {
        const { userSupportChat } = await getUserSupportChatContract(hre);

        const { topic_id, message_ids } = await inquirer.prompt([
            {
                type: "input",
                name: "topic_id",
                message: "Enter the topic ID:",
                validate: (input) => !isNaN(input) && input > 0,
            },
            {
                type: "input",
                name: "message_ids",
                message: "Enter message IDs to mark as read (comma-separated):",
                validate: (input) => input.split(",").every((id) => !isNaN(id) && id > 0),
            },
        ]);

        const ids = message_ids.split(",").map((id) => parseInt(id.trim()));
        const tx = await userSupportChat.setReadedMessages(topic_id, ids);
        console.log("Messages marked as read successfully.");
    });

// Task to get user's topics
userSupportChatScope.task("get-my-topics", "Get topics created by the user")
    .setAction(async (taskArgs, hre) => {
        const { userSupportChat } = await getUserSupportChatContract(hre);

        const { offset } = await inquirer.prompt([
            {
                type: "input",
                name: "offset",
                message: "Enter the offset for pagination:",
                validate: (input) => !isNaN(input) && input >= 0,
            },
        ]);

        const [topics, total] = await userSupportChat.getMyTopics(offset);
        
        console.log("Total Topics:", total.toString());
        for (let index = 0; index < topics.length; index++) {
            const topic = topics[index];
            printTopicInfo(topic);
        }

    });

// Task to get details of a specific topic
userSupportChatScope.task("get-topic", "Get details of a specific topic")
    .setAction(async (taskArgs, hre) => {
        const { userSupportChat } = await getUserSupportChatContract(hre);

        const { topic_id } = await inquirer.prompt([
            {
                type: "input",
                name: "topic_id",
                message: "Enter the topic ID:",
                validate: (input) => !isNaN(input) && input > 0,
            },
        ]);

        const topic = await userSupportChat.getTopic(topic_id);
        printTopicInfo(topic);
    });

// Task to get messages in a topic
userSupportChatScope.task("get-messages", "Get messages in a topic")
    .setAction(async (taskArgs, hre) => {
        const { userSupportChat } = await getUserSupportChatContract(hre);

        const { topic_id, offset } = await inquirer.prompt([
            {
                type: "input",
                name: "topic_id",
                message: "Enter the topic ID:",
                validate: (input) => !isNaN(input) && input > 0,
            },
            {
                type: "input",
                name: "offset",
                message: "Enter the offset for pagination:",
                validate: (input) => !isNaN(input) && input >= 0,
            },
        ]);

        const [messages, total] = await userSupportChat.getMessages(topic_id, offset);
        
        console.log("Total Messages:", total.toString());
        for (let index = messages.length-1; index >= 0; index--) {
            const message = messages[index];
            printMessageInfo(message.message,message.id);
        }
    });

// Task to get a specific message in a topic
userSupportChatScope.task("get-message", "Get a specific message in a topic")
    .setAction(async (taskArgs, hre) => {
        const { userSupportChat } = await getUserSupportChatContract(hre);

        const { topic_id, message_id } = await inquirer.prompt([
            {
                type: "input",
                name: "topic_id",
                message: "Enter the topic ID:",
                validate: (input) => !isNaN(input) && input > 0,
            },
            {
                type: "input",
                name: "message_id",
                message: "Enter the message ID:",
                validate: (input) => !isNaN(input) && input > 0,
            },
        ]);

        const message = await userSupportChat.getMessage(topic_id, message_id);
        printMessageInfo(message,message_id);
    });