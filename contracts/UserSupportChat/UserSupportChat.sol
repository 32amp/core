// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./IUserSupportChat.sol";
import "../User/IAuth.sol";
import "../Hub/IHub.sol";
import "../User/IUserAccess.sol";

contract UserSupportChat is IUserSupportChat, Initializable {


    address hubContract;
    uint256 partner_id;
    uint256 topic_counter;


    mapping(uint256 => Topic) topics;
    mapping(uint256 => mapping(uint256 => UserMessage)) messages;
    mapping(uint256 => uint256[]) user_topics;

    function initialize(uint256 _partner_id, address _hubContract) external initializer{
        hubContract = _hubContract;
        partner_id = _partner_id;
    }

    function getVersion() external pure returns(string memory){
        return "1.0";
    }

    function _Auth() private view returns(IAuth) {
        return IAuth(IHub(hubContract).getModule("Auth", partner_id));
    }

    function _UserAccess() private view returns(IUserAccess) {
        return IUserAccess(IHub(hubContract).getModule("UserAccess", partner_id));
    }


    function _access(bytes32 _token, uint256 topic_id) internal view {
        uint256 user_id = _Auth().isLogin(_token);

        if( user_id == 0)
            revert("access_denied");

        bool access = false;

        if(topics[topic_id].create_user_id == user_id)
            access = true;

        uint access_level = _UserAccess().getModuleAccessLevel("UserSupportChat", user_id);

        if(access_level >= uint(IUserAccess.AccessLevel.FOURTH)){
            access = true;
        }

        if(!access)
            revert("access_denied");
    }

    function createTopic(bytes32 _token, string memory _text_message, TopicTheme theme) external {
        uint256 user_id = _Auth().isLogin(_token);

        if( user_id == 0)
            revert("access_denied");
        

        
        topics[topic_counter].create_at = block.timestamp;
        topics[topic_counter].update_at = block.timestamp;
        topics[topic_counter].create_user_id = user_id;
        topics[topic_counter].theme = theme;

        user_topics[user_id].push(topic_counter);


        messages[topic_counter][topics[topic_counter].message_counter].text = _text_message;
        messages[topic_counter][topics[topic_counter].message_counter].create_at = block.timestamp;
        messages[topic_counter][topics[topic_counter].message_counter].user_id = user_id;
        emit CreateTopic(topic_counter, theme);
        topics[topic_counter].message_counter++;    
        topic_counter++;
    }

    function sendMessage(bytes32 _token, uint256 topic_id, InputMessage memory message) external {

        uint256 user_id = _Auth().isLogin(_token);

        _access(_token, topic_id);
        
        

        topics[topic_id].update_at = block.timestamp;

        messages[topic_id][topics[topic_id].message_counter].text = message.text;
        messages[topic_id][topics[topic_id].message_counter].create_at = block.timestamp;
        messages[topic_id][topics[topic_id].message_counter].user_id = user_id;
        messages[topic_id][topics[topic_id].message_counter].reply_to = message.reply_to;
        messages[topic_id][topics[topic_id].message_counter].image = message.image;

        emit Message(topic_id, topics[topic_id].message_counter);
        emit UpdateTopic(topic_id, topics[topic_id].theme,topics[topic_id].update_at);
        
        topics[topic_id].message_counter++;
    }

    function setRating(bytes32 _token, uint256 topic_id, TopicRating rating) external {

        uint256 user_id = _Auth().isLogin(_token);

        if( user_id == 0 || topics[topic_id].create_user_id != user_id)
            revert("access_denied");

        topics[topic_id].user_rating = rating;        
    }

    function closeTopic(bytes32 _token, uint256 topic_id) external {
        _access(_token, topic_id);
        
        uint256 user_id = _Auth().isLogin(_token);

        topics[topic_id].closed = true;
        
        emit CloseTopic(topic_id,user_id);
    } 

    function setReadedMessages(bytes32 _token, uint256 topic_id, uint256[] calldata message_ids) external{
        
        _access(_token, topic_id);

        uint256 user_id = _Auth().isLogin(_token);

        for (uint i = 0; i < message_ids.length; i++) {
            if(messages[topic_id][i].user_id != user_id && messages[topic_id][i].user_id != 0){
                messages[topic_id][i].readed = true;
            }
        }
    }

    function getMyTopics(bytes32 _token, uint256 offset) external view returns(Topic[] memory){
        uint256 user_id = _Auth().isLogin(_token);

        if( user_id == 0)
            revert("access_denied");


        if(offset >= user_topics[user_id].length)
            revert("offest_to_big");

        uint max_limit = 10;

        if((user_topics[user_id].length-offset) < max_limit)
            max_limit = user_topics[user_id].length-offset;

        Topic[] memory ret = new Topic[](max_limit);
        uint256 index = 0;
        
        for (uint i = offset; i < offset+max_limit; i++) {
            ret[index] =  topics[i];
            index++;
        }

        return ret;            
    }


    function getTopic(bytes32 _token, uint256 topic_id) external view returns (Topic memory) {
        _access(_token, topic_id);
        return topics[topic_id];
    }

    function getMessages(bytes32 _token, uint256 topic_id, uint256 offset) external view returns (UserMessage[] memory) {
        _access(_token, topic_id);

        if(offset >= topics[topic_id].message_counter)
            revert("offest_to_big");

        uint max_limit = 10;

        if((topics[topic_id].message_counter-offset) < max_limit)
            max_limit = topics[topic_id].message_counter-offset;

        UserMessage[] memory ret = new UserMessage[](max_limit);
        uint256 index = 0;
        
        for (uint i = offset; i < offset+max_limit; i++) {
            ret[index] =  messages[topic_id][i];
            index++;
        }

        return ret;
    }


    function getMessage(bytes32 _token, uint256 topic_id, uint256 message_id) external view returns(UserMessage memory){
        _access(_token, topic_id);
        return messages[topic_id][message_id];
    }
}