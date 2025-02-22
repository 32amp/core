// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./IUserSupportChat.sol";
import "../Hub/IHub.sol";
import "../User/IUserAccess.sol";
import "../RevertCodes/IRevertCodes.sol";

contract UserSupportChat is IUserSupportChat, Initializable {


    address hubContract;
    uint256 partner_id;
    uint256 topic_counter;


    mapping(uint256 => Topic) topics;
    mapping(uint256 => mapping(uint256 => UserMessage)) messages;
    mapping(address => uint256[]) user_topics;

    function initialize(uint256 _partner_id, address _hubContract) external initializer{
        hubContract = _hubContract;
        partner_id = _partner_id;
    }

    function registerRevertCodes() external{
        _RevertCodes().registerRevertCode("UserSupportChat", "access_denied", "Access denied");
        _RevertCodes().registerRevertCode("UserSupportChat", "topic_not_found", "Topic not found");
        _RevertCodes().registerRevertCode("UserSupportChat", "offest_to_big", "Offset to big");
    }

    function getVersion() external pure returns(string memory){
        return "1.0";
    }

    function _UserAccess() private view returns(IUserAccess) {
        return IUserAccess(IHub(hubContract).getModule("UserAccess", partner_id));
    }

    function _RevertCodes() private view returns(IRevertCodes) {
        return IRevertCodes(IHub(hubContract).getModule("RevertCodes", partner_id));
    }

    // add check user exist
    modifier topic_access( uint256 topic_id)  {

        if(topics[topic_id].create_at == 0)
            revert("topic_not_found");


        bool isAccess = false;

        if(topics[topic_id].create_user_account == msg.sender)
            isAccess = true;

        uint access_level = _UserAccess().getModuleAccessLevel("UserSupportChat", msg.sender);

        if(access_level >= uint(IUserAccess.AccessLevel.FOURTH)){
            isAccess = true;
        }

        if(!isAccess)
            revert("access_denied");
        
        _;
    }

    // add check user exist
    function createTopic(string memory _text_message, TopicTheme theme) external {

        
        topics[topic_counter].create_at = block.timestamp;
        topics[topic_counter].update_at = block.timestamp;
        topics[topic_counter].create_user_account = msg.sender;
        topics[topic_counter].theme = theme;

        user_topics[msg.sender].push(topic_counter);


        messages[topic_counter][topics[topic_counter].message_counter].text = _text_message;
        messages[topic_counter][topics[topic_counter].message_counter].create_at = block.timestamp;
        messages[topic_counter][topics[topic_counter].message_counter].account = msg.sender;
        
        emit CreateTopic(topic_counter, theme);
        emit UserTopicEvent(topic_counter, msg.sender);

        topics[topic_counter].message_counter++;    
        topic_counter++;
    }

    function sendMessage(uint256 topic_id, InputMessage memory message) topic_access(topic_id) external {
        
        uint256 timestamp =  block.timestamp+topics[topic_id].message_counter;

        topics[topic_id].update_at = timestamp;
   
        messages[topic_id][topics[topic_id].message_counter].text = message.text;
        messages[topic_id][topics[topic_id].message_counter].create_at = timestamp;
        messages[topic_id][topics[topic_id].message_counter].account = msg.sender;
        messages[topic_id][topics[topic_id].message_counter].reply_to = message.reply_to;
        messages[topic_id][topics[topic_id].message_counter].image = message.image;

        makeTopicFirst(topic_id);

        emit Message(topic_id, topics[topic_id].message_counter);
        emit UpdateTopic(topic_id, topics[topic_id].theme,topics[topic_id].update_at);
        emit UserTopicEvent(topic_id, topics[topic_id].create_user_account);
        
        
        topics[topic_id].message_counter++;
    }

    // check user exist
    function setRating(uint256 topic_id, TopicRating rating) topic_access(topic_id) external {
        
        topics[topic_id].user_rating = rating;  

        emit UserTopicEvent(topic_id, topics[topic_id].create_user_account);

        makeTopicFirst(topic_id);
    }

    function closeTopic(uint256 topic_id) topic_access(topic_id) external {
        
        topics[topic_id].closed = true;

        makeTopicFirst(topic_id);
        
        emit CloseTopic(topic_id, msg.sender);
        emit UserTopicEvent(topic_id, topics[topic_id].create_user_account);
    } 

    function setReadedMessages(uint256 topic_id, uint256[] calldata message_ids) topic_access(topic_id) external {


        for (uint i = 0; i < message_ids.length; i++) {
            
            if(messages[topic_id][message_ids[i]].account != msg.sender && messages[topic_id][message_ids[i]].account != address(0)){
                messages[topic_id][message_ids[i]].readed = true;
            }
        }
    }

    // check user exist
    function getMyTopics(uint256 offset) external view returns(OutputTopic[] memory, uint256) {

        if (offset > user_topics[msg.sender].length)
            revert("offset_too_big");
    
        uint max_limit = 50;
    
        if ((user_topics[msg.sender].length - offset) < max_limit)
            max_limit = user_topics[msg.sender].length - offset;
    
        OutputTopic[] memory ret = new OutputTopic[](max_limit);
        
        
        for (uint256 i = 0; i < max_limit; i++) {
            uint256 topicIndex = user_topics[msg.sender].length - 1 - (offset + i);
            uint256 topicId = user_topics[msg.sender][topicIndex];
            ret[i].topic = topics[topicId];
            ret[i].id = topicId;
            ret[i].unreaded_messages = countUnreadedMessages(topicId, msg.sender);
        }
    
        return (ret, user_topics[msg.sender].length);            
    }
    

    function getTopic(uint256 topic_id) topic_access(topic_id) external view returns (Topic memory) {
        return topics[topic_id];
    }


    function getMessages(uint256 topic_id, uint256 offset) topic_access(topic_id) external view returns (OutputUserMessage[] memory, uint256) {
    
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
    
    function getMessage(uint256 topic_id, uint256 message_id) topic_access(topic_id) external view returns(UserMessage memory){
        return messages[topic_id][message_id];
    }

    function countUnreadedMessages(uint256 topic_id,address account) internal view returns(uint256) {
        uint256 count;

        for (uint i = 0; i < topics[topic_id].message_counter; i++) {
            if(messages[topic_id][i].account != account && messages[topic_id][i].readed == false)
                count++;
        }

        return count;
    }

    function makeTopicFirst(uint256 topic_id) internal {

        address account = topics[topic_id].create_user_account;

        if(user_topics[account].length == 0)
            return;

        if(user_topics[account][user_topics[account].length-1] == topic_id)
            return;

        for (uint i = topic_id; i < user_topics[account].length - 1; i++) {
            user_topics[account][i] = user_topics[account][i + 1];
        }

        user_topics[account].pop();
        user_topics[account].push(topic_id);
    }
}