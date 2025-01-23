// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

interface IUserSupportChat {


    enum TopicRating {
        None,
        OneStar,
        TwoStar,
        ThreeStar,
        FourStar,
        FiveStar
    }

    enum TopicTheme {
        None,
        ChargingSession,
        App,
        Payment,
        Contact
    }

    struct OutputUserMessage {
        UserMessage message;
        uint256 id;
    }

    struct OutputTopic {
        Topic topic;
        uint256 id;
        uint256 unreaded_messages;
    }

    struct InputMessage {
        string text;
        string image;
        uint256 reply_to;
    }

    struct UserMessage {
        string text;
        string image; // ipfs hash string
        uint256 reply_to;
        uint256 create_at;
        bool readed;
        uint256 user_id;
    }

    struct Topic {
        uint256 create_at;
        uint256 update_at;
        uint256 create_user_id;
        uint256 message_counter;
        TopicTheme theme;
        bool closed;
        TopicRating user_rating;
    }
    



    event Message(uint256 indexed topic_id, uint256 indexed message_id );
    event CreateTopic(uint256 indexed topic_id, TopicTheme indexed theme);
    event UpdateTopic(uint256 indexed topic_id, TopicTheme indexed theme, uint256 indexed update_at);
    event CloseTopic(uint256 indexed topic_id, uint256 indexed user_id); 
    
    event UserTopicEvent(uint256 indexed topic_id, uint256 indexed user_id);
    
    function getVersion() external pure returns(string memory);
    function createTopic(bytes32 _token, string memory _text_message, TopicTheme theme) external;
    function sendMessage(bytes32 _token, uint256 topic_id, InputMessage memory message) external;
    function setRating(bytes32 _token, uint256 topic_id, TopicRating rating) external;
    function closeTopic(bytes32 _token, uint256 topic_id) external;
    function setReadedMessages(bytes32 _token, uint256 topic_id, uint256[] calldata message_ids) external;
    function getMyTopics(bytes32 _token, uint256 offset) external view returns(OutputTopic[] memory, uint256);
    function getTopic(bytes32 _token, uint256 topic_id) external view returns(Topic memory);
    function getMessages(bytes32 _token, uint256 topic_id, uint256 offset) external view returns (OutputUserMessage[] memory, uint256);
    function getMessage(bytes32 _token, uint256 topic_id, uint256 message_id) external view returns(UserMessage memory);

}