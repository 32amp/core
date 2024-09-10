// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

interface IUserSupportChat {

    struct UserMessage {
        string text;
        bytes image;
        uint256 time;
        bytes32 first_name;
        uint256 user_id;
    }

    struct Topic {
        uint256 create_at;
        uint256 update_at;
        uint256 user_id;
        UserMessage[] massages;
    }
    // topic_id - its == user_id, for each user have one topic
    event Message(uint256 indexed topic_id, uint256 indexed message_id, uint256 indexed time );
    event CreateTopic(uint256 indexed topic_id);
    event UpdateTopic(uint256 indexed topic_id, bool indexed simple_user_update);
    event LikeMessage(uint256 indexed user_id, uint256 indexed topic_id, uint256 message_id);


    function createTopic(UserMessage memory _message) external;
    function sendMessage(UserMessage memory _message) external;
    function getTopic() external returns(Topic memory);
    // like message its need for create stats for support users;
    function likeMessage(uint256 message_id, uint256 user_id) external;
}