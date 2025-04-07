// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "../IBaseErrors.sol";
/**
 * @title User Support Chat Interface
 * @notice Defines data structures and events for user support system
 * @dev Inherits error handling from IBaseErrors
 */
interface IUserSupportChat is IBaseErrors {
    /**
     * @title Support Topic Rating System
     * @notice User satisfaction rating scale for resolved support cases
     * @dev None = 0, FiveStar = 5
     */
    enum TopicRating {
        None,       // 0 - No rating provided
        OneStar,    // 1 - Very dissatisfied
        TwoStar,    // 2 - Dissatisfied
        ThreeStar,  // 3 - Neutral
        FourStar,   // 4 - Satisfied
        FiveStar    // 5 - Very satisfied
    }

    /**
     * @title Support Topic Categories
     * @notice Classification system for support requests
     */
    enum TopicTheme {
        None,            // 0 - Unclassified
        ChargingSession, // 1 - Issues related to charging sessions
        App,             // 2 - Application-related problems
        Payment,         // 3 - Payment and billing inquiries
        Contact          // 4 - General contact requests
    }

    /**
     * @title Message Output Structure
     * @notice Combines message content with its metadata
     * @param message Full message data
     * @param id Unique message identifier
     */
    struct OutputUserMessage {
        UserMessage message;
        uint256 id;
    }

    /**
     * @title Topic Output Structure
     * @notice Complete topic data with additional metadata
     * @param topic Core topic information
     * @param id Unique topic identifier
     * @param unreaded_messages Count of unread messages
     */
    struct OutputTopic {
        Topic topic;
        uint256 id;
        uint256 unreaded_messages;
    }

    /**
     * @title Message Input Structure
     * @notice Data required to create new messages
     * @param text Encrypted Message content (max 1000 characters)
     * @param image Encrypted IPFS hash of attached image
     * @param reply_to ID of message being replied to (0 for new)
     */
    struct InputMessage {
        string text;
        string image;
        uint256 reply_to;
    }

    /**
     * @title User Message Structure
     * @notice Complete message metadata and content
     * @param text Encrypted message content 
     * @param image Encrypted IPFS hash of attached media
     * @param reply_to Reference to previous message
     * @param create_at UNIX timestamp of creation
     * @param readed Read status indicator
     * @param account Author's wallet address
     */
    struct UserMessage {
        string text;
        string image;
        uint256 reply_to;
        uint256 create_at;
        bool readed;
        address account;
    }

    /**
     * @title Support Topic Structure
     * @notice Complete support case metadata
     * @param create_at UNIX timestamp of creation
     * @param update_at Last activity timestamp
     * @param create_user_account Creator's address
     * @param message_counter Total messages in thread
     * @param theme Category classification
     * @param closed Resolution status
     * @param user_rating Final satisfaction rating
     */
    struct Topic {
        uint256 create_at;
        uint256 update_at;
        address create_user_account;
        uint256 message_counter;
        TopicTheme theme;
        bool closed;
        TopicRating user_rating;
    }

    /**
     * @notice Emitted on new message creation
     * @param topic_id Related support case ID
     * @param message_id New message ID
     */
    event Message(uint256 indexed topic_id, uint256 indexed message_id);

    /**
     * @notice Emitted when new support case is opened
     * @param topic_id Newly created case ID
     * @param theme Category of the support case
     */
    event CreateTopic(uint256 indexed topic_id, TopicTheme indexed theme);

    /**
     * @notice Emitted on case activity update
     * @param topic_id Modified case ID
     * @param theme Current category
     * @param update_at Timestamp of last change
     */
    event UpdateTopic(uint256 indexed topic_id, TopicTheme indexed theme, uint256 indexed update_at);

    /**
     * @notice Emitted when case is resolved
     * @param topic_id Closed case ID
     * @param account Address that closed the case
     */
    event CloseTopic(uint256 indexed topic_id, address indexed account);

    /**
     * @notice General case activity notification
     * @param topic_id Affected case ID
     * @param account Address related to activity
     */
    event UserTopicEvent(uint256 indexed topic_id, address indexed account);
    
    function getVersion() external pure returns(string memory);
    function createTopic(string calldata _text_message, TopicTheme theme) external;
    function sendMessage(uint256 topic_id, InputMessage calldata message) external;
    function setRating(uint256 topic_id, TopicRating rating) external;
    function closeTopic(uint256 topic_id) external;
    function setReadedMessages(uint256 topic_id, uint256[] calldata message_ids) external;
    function getMyTopics(uint256 offset) external view returns(OutputTopic[] memory, uint256);
    function getTopic(uint256 topic_id) external view returns(Topic memory);
    function getMessages(uint256 topic_id, uint256 offset) external view returns (OutputUserMessage[] memory, uint256);
    function getMessage(uint256 topic_id, uint256 message_id) external view returns(UserMessage memory);

}