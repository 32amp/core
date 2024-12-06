// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./IUserSupportChat.sol";
import "../User/IAuth.sol";
import "../Hub/IHub.sol";
import "../User/IUserAccess.sol";
import "../RevertCodes/IRevertCodes.sol";
import "hardhat/console.sol";

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

    function registerRevertCodes() external{
        _RevertCodes().registerRevertCode("UserSupportChat", "access_denied", "Access denied");
        _RevertCodes().registerRevertCode("UserSupportChat", "offest_to_big", "Offset to big");
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

    function _RevertCodes() private view returns(IRevertCodes) {
        return IRevertCodes(IHub(hubContract).getModule("RevertCodes", partner_id));
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
        
        if(topics[topic_id].create_at == 0)
            revert("topic_not_found");

         uint256 user_id = _Auth().isLogin(_token);

        _access(_token, topic_id);
    
        uint256 timestamp =  block.timestamp+topics[topic_id].message_counter;

        topics[topic_id].update_at = timestamp;
   
        messages[topic_id][topics[topic_id].message_counter].text = message.text;
        messages[topic_id][topics[topic_id].message_counter].create_at = timestamp;
        messages[topic_id][topics[topic_id].message_counter].user_id = user_id;
        messages[topic_id][topics[topic_id].message_counter].reply_to = message.reply_to;
        messages[topic_id][topics[topic_id].message_counter].image = message.image;

        makeTopicFirst(topic_id);

        emit Message(topic_id, topics[topic_id].message_counter);
        emit UpdateTopic(topic_id, topics[topic_id].theme,topics[topic_id].update_at);
        
        
        
        topics[topic_id].message_counter++;
    }

    function setRating(bytes32 _token, uint256 topic_id, TopicRating rating) external {
        
        if(topics[topic_id].create_at == 0)
            revert("topic_not_found");

        uint256 user_id = _Auth().isLogin(_token);

        if( user_id == 0 || topics[topic_id].create_user_id != user_id)
            revert("access_denied");

        topics[topic_id].user_rating = rating;  
        
        makeTopicFirst(topic_id);
    }

    function closeTopic(bytes32 _token, uint256 topic_id) external {
        
        if(topics[topic_id].create_at == 0)
            revert("topic_not_found");

        _access(_token, topic_id);
        
        uint256 user_id = _Auth().isLogin(_token);

        topics[topic_id].closed = true;

        makeTopicFirst(topic_id);
        
        emit CloseTopic(topic_id,user_id);
    } 

    function setReadedMessages(bytes32 _token, uint256 topic_id, uint256[] calldata message_ids) external{
        if(topics[topic_id].create_at == 0)
            revert("topic_not_found");
        
        _access(_token, topic_id);

        uint256 user_id = _Auth().isLogin(_token);

        for (uint i = 0; i < message_ids.length; i++) {
            
            if(messages[topic_id][message_ids[i]].user_id != user_id && messages[topic_id][message_ids[i]].user_id != 0){
                messages[topic_id][message_ids[i]].readed = true;
            }
        }
    }

    function getMyTopics(bytes32 _token, uint256 offset) external view returns(OutputTopic[] memory, uint256) {
        uint256 user_id = _Auth().isLogin(_token);
    
        if (user_id == 0)
            revert("access_denied");
    
        if (offset > user_topics[user_id].length)
            revert("offset_too_big");
    
        uint max_limit = 50;
    
        if ((user_topics[user_id].length - offset) < max_limit)
            max_limit = user_topics[user_id].length - offset;
    
        OutputTopic[] memory ret = new OutputTopic[](max_limit);
        
        // Заполняем массив с конца
        for (uint256 i = 0; i < max_limit; i++) {
            uint256 topicIndex = user_topics[user_id].length - 1 - (offset + i);
            uint256 topicId = user_topics[user_id][topicIndex];
            ret[i].topic = topics[topicId];
            ret[i].id = topicId;
            ret[i].unreaded_messages = countUnreadedMessages(topicId, user_id);
        }
    
        return (ret, user_topics[user_id].length);            
    }
    

    function getTopic(bytes32 _token, uint256 topic_id) external view returns (Topic memory) {
        if(topics[topic_id].create_at == 0)
            revert("topic_not_found");
        
        _access(_token, topic_id);
        return topics[topic_id];
    }


    function getMessages(bytes32 _token, uint256 topic_id, uint256 offset) external view returns (OutputUserMessage[] memory, uint256) {
        if(topics[topic_id].create_at == 0)
            revert("topic_not_found");
        
        _access(_token, topic_id);
    
        if (offset > topics[topic_id].message_counter)
            revert("offset_too_big");
    
        uint max_limit = 50;
    
        if ((topics[topic_id].message_counter - offset) < max_limit)
            max_limit = topics[topic_id].message_counter - offset;
    
        OutputUserMessage[] memory ret = new OutputUserMessage[](max_limit);
        
        
        for (uint256 i = 0; i < max_limit; i++) {
            ret[i].message = messages[topic_id][topics[topic_id].message_counter - 1 - (offset + i)];
            ret[i].id = topics[topic_id].message_counter - 1 - (offset + i);
        }
    
        return (ret, topics[topic_id].message_counter);
    }
    
    function getMessage(bytes32 _token, uint256 topic_id, uint256 message_id) external view returns(UserMessage memory){
        if(topics[topic_id].create_at == 0)
            revert("topic_not_found");

        _access(_token, topic_id);
        return messages[topic_id][message_id];
    }

    function countUnreadedMessages(uint256 topic_id,uint256 from_user_id) internal view returns(uint256) {
        uint256 count;

        for (uint i = 0; i < topics[topic_id].message_counter; i++) {
            if(messages[topic_id][i].user_id != from_user_id && messages[topic_id][i].readed == false)
                count++;
        }

        return count;
    }

    function makeTopicFirst(uint256 topic_id) internal {

        uint256 user_id = topics[topic_id].create_user_id;

        if(user_topics[user_id].length == 0)
            return;

        if(user_topics[user_id][user_topics[user_id].length-1] == topic_id)
            return;

        for (uint i = topic_id; i < user_topics[user_id].length - 1; i++) {
            user_topics[user_id][i] = user_topics[user_id][i + 1];
        }

        user_topics[user_id].pop();
        user_topics[user_id].push(topic_id);
    }
}