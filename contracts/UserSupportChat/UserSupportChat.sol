// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./IUserSupportChat.sol";
import "../Hub/IHub.sol";
import "../User/IUserAccess.sol";
import "../User/IUser.sol";
import "../Utils.sol";

/**
 * @title User Support Chat Contract
 * @notice Handles user support ticket creation and communication
 * @dev Manages support topics and messages with access control
 * @custom:warning Requires proper initialization via Hub contract
 */
contract UserSupportChat is IUserSupportChat, Initializable {
    // State variables documentation
    /// @notice Reference to the Hub contract
    address hubContract;
    
    /// @notice Partner ID associated with this contract
    uint256 partner_id;
    
    /// @dev Auto-incrementing topic ID counter
    uint256 topic_counter;

    // Storage mappings documentation
    /// @dev Mapping of topic IDs to Topic structs
    mapping(uint256 => Topic) topics;
    
    /// @dev Mapping of topic IDs and message IDs to UserMessage structs
    mapping(uint256 => mapping(uint256 => UserMessage)) messages;
    
    /// @dev Mapping of user addresses to their topic IDs
    mapping(address => uint256[]) user_topics;

    using Utils for string;

    /**
     * @notice Initializes the contract with Hub connection
     * @param _partner_id Partner ID from Hub registry
     * @param _hubContract Hub contract address
     * @custom:init Called once during proxy deployment
     */
    function initialize(uint256 _partner_id, address _hubContract) external initializer{
        hubContract = _hubContract;
        partner_id = _partner_id;
    }

    /**
     * @notice Returns contract version
     * @return string Constant version identifier
     */
    function getVersion() external pure returns(string memory){
        return "1.1";
    }

    /**
     * @dev Returns the UserAccess module interface for the current partner
     * @return IUserAccess interface instance
     */
    function _UserAccess() private view returns(IUserAccess) {
        return IUserAccess(IHub(hubContract).getModule("UserAccess", partner_id));
    }

    /**
     * @dev Returns the User module interface for the current partner
     * @return IUser interface instance
     */
    function _User() private view returns(IUser) {
        return IUser(IHub(hubContract).getModule("User", partner_id));
    }        

    
    /**
     * @notice Modifier for topic access control
     * @dev Checks topic existence and user permissions
     * @param topic_id ID of the topic to access
     * @custom:reverts ObjectNotFound If topic doesn't exist
     * @custom:reverts AccessDenied If user lacks access rights
     */    
    modifier topic_access( uint256 topic_id)   {
        
        _User().exist(msg.sender);

        if(topics[topic_id].create_at == 0)
            revert ObjectNotFound("Topic", topic_id);


        bool isAccess = false;

        if(topics[topic_id].create_user_account == msg.sender)
            isAccess = true;

        uint access_level = _UserAccess().getModuleAccessLevel("UserSupportChat", msg.sender);

        if(access_level >= uint(IUserAccess.AccessLevel.FOURTH)){
            isAccess = true;
        }

        if(!isAccess)
            revert AccessDenied("UserSupportChat:Topic");
        
        _;
    }

    /// @notice Access control modifier requiring for check user exist
    modifier onlyUser() {
        _User().exist(msg.sender);
        _;
    }    

    
    /**
     * @notice Creates a new support topic
     * @param _text_message Encrypted initial message content
     * @param theme Category/type of the support topic
     * @custom:emits CreateTopic On successful creation
     * @custom:emits UserTopicEvent For user notification
     */    
    function createTopic(string calldata _text_message, TopicTheme theme) onlyUser() external {

        if (!_text_message.isEncrypted()) revert ParamNotEncrypted("text_message");

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

    /**
     * @notice Sends a message to an existing topic
     * @param topic_id ID of the target topic
     * @param message Message content and metadata
     * @custom:emits Message On successful send
     * @custom:emits UpdateTopic For topic status change
     */
    function sendMessage(uint256 topic_id, InputMessage calldata message) topic_access(topic_id) external {

        if (!message.text.isEncrypted()) revert ParamNotEncrypted("message.text");
        if (!message.image.isEncrypted()) revert ParamNotEncrypted("message.image");
        
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

    
    /**
     * @notice Sets user rating for a resolved topic
     * @param topic_id ID of the topic to rate
     * @param rating User satisfaction rating
     * @custom:emits UserTopicEvent For rating notification
     */
    function setRating(uint256 topic_id, TopicRating rating) topic_access(topic_id) external {
        
        topics[topic_id].user_rating = rating;  

        emit UserTopicEvent(topic_id, topics[topic_id].create_user_account);

        makeTopicFirst(topic_id);
    }

    /**
     * @notice Closes a support topic
     * @param topic_id ID of the topic to close
     * @custom:emits CloseTopic On successful closure
     * @custom:emits UserTopicEvent For notification
     */    
    function closeTopic(uint256 topic_id) topic_access(topic_id) external {
        
        topics[topic_id].closed = true;

        makeTopicFirst(topic_id);
        
        emit CloseTopic(topic_id, msg.sender);
        emit UserTopicEvent(topic_id, topics[topic_id].create_user_account);
    } 

    /**
     * @notice Marks messages as read
     * @param topic_id ID of the topic containing messages
     * @param message_ids Array of message IDs to mark
     */    
    function setReadedMessages(uint256 topic_id, uint256[] calldata message_ids) topic_access(topic_id) external {


        for (uint i = 0; i < message_ids.length; i++) {
            
            if(messages[topic_id][message_ids[i]].account != msg.sender && messages[topic_id][message_ids[i]].account != address(0)){
                messages[topic_id][message_ids[i]].readed = true;
            }
        }
    }

    
    /**
     * @notice Retrieves paginated list of user's topics
     * @param offset Pagination starting point
     * @return (OutputTopic[], uint256) Topics array and total count
     * @custom:reverts BigOffset If offset exceeds topics count
     */    
    function getMyTopics(uint256 offset) onlyUser() external view returns(OutputTopic[] memory, uint256) {

        if (offset > user_topics[msg.sender].length)
            revert BigOffset(offset);
    
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
    
    /**
     * @notice Retrieves topic details
     * @param topic_id ID of the topic to fetch
     * @return Topic Complete topic data structure
     */
    function getTopic(uint256 topic_id) topic_access(topic_id) external view returns (Topic memory) {
        return topics[topic_id];
    }

    /**
     * @notice Retrieves paginated messages from a topic
     * @param topic_id ID of the target topic
     * @param offset Pagination starting point
     * @return (OutputUserMessage[], uint256) Messages array and total count
     * @custom:reverts BigOffset If offset exceeds messages count
     */
    function getMessages(uint256 topic_id, uint256 offset) topic_access(topic_id) external view returns (OutputUserMessage[] memory, uint256) {
    
        if (offset > topics[topic_id].message_counter)
            revert BigOffset(offset);
    
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
    
    /**
     * @notice Retrieves specific message details
     * @param topic_id ID of the containing topic
     * @param message_id ID of the message to fetch
     * @return UserMessage Complete message data
     */    
    function getMessage(uint256 topic_id, uint256 message_id) topic_access(topic_id) external view returns(UserMessage memory){
        return messages[topic_id][message_id];
    }

    /**
     * @dev Calculates unread messages for a user in a topic
     * @param topic_id ID of the target topic
     * @param account User address to check
     * @return uint256 Count of unread messages
     */    
    function countUnreadedMessages(uint256 topic_id,address account) internal view returns(uint256) {
        uint256 count;

        for (uint i = 0; i < topics[topic_id].message_counter; i++) {
            if(messages[topic_id][i].account != account && messages[topic_id][i].readed == false)
                count++;
        }

        return count;
    }
    
    /**
     * @dev Internal function to move a topic to the first position in the user's topic list
     * @param topic_id ID of the topic to move
     */
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