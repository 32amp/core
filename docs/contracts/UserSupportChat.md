# Solidity API

## UserSupportChat

Handles user support ticket creation and communication

_Manages support topics and messages with access control_

### hubContract

```solidity
address hubContract
```

Hub contract reference

### partner_id

```solidity
uint256 partner_id
```

Associated partner ID

### topic_counter

```solidity
uint256 topic_counter
```

_Auto-incrementing topic ID counter_

### topics

```solidity
mapping(uint256 => struct IUserSupportChat.Topic) topics
```

_Topic data storage by ID_

### messages

```solidity
mapping(uint256 => mapping(uint256 => struct IUserSupportChat.UserMessage)) messages
```

_Message storage by topic and message ID_

### user_topics

```solidity
mapping(address => uint256[]) user_topics
```

_User-to-topics mapping: address => topic IDs[]_

### initialize

```solidity
function initialize(uint256 _partner_id, address _hubContract) external
```

Initializes the contract with Hub connection

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _partner_id | uint256 | Partner ID from Hub registry |
| _hubContract | address | Hub contract address |

### getVersion

```solidity
function getVersion() external pure returns (string)
```

Returns contract version

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string | string Constant version identifier |

### topic_access

```solidity
modifier topic_access(uint256 topic_id)
```

Modifier for topic access control

_Checks topic existence and user permissions_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| topic_id | uint256 | ID of the topic to access |

### createTopic

```solidity
function createTopic(string _text_message, enum IUserSupportChat.TopicTheme theme) external
```

Creates a new support topic

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _text_message | string | Initial message content |
| theme | enum IUserSupportChat.TopicTheme | Category/type of the support topic |

### sendMessage

```solidity
function sendMessage(uint256 topic_id, struct IUserSupportChat.InputMessage message) external
```

Sends a message to an existing topic

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| topic_id | uint256 | ID of the target topic |
| message | struct IUserSupportChat.InputMessage | Message content and metadata |

### setRating

```solidity
function setRating(uint256 topic_id, enum IUserSupportChat.TopicRating rating) external
```

Sets user rating for a resolved topic

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| topic_id | uint256 | ID of the topic to rate |
| rating | enum IUserSupportChat.TopicRating | User satisfaction rating |

### closeTopic

```solidity
function closeTopic(uint256 topic_id) external
```

Closes a support topic

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| topic_id | uint256 | ID of the topic to close |

### setReadedMessages

```solidity
function setReadedMessages(uint256 topic_id, uint256[] message_ids) external
```

Marks messages as read

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| topic_id | uint256 | ID of the topic containing messages |
| message_ids | uint256[] | Array of message IDs to mark |

### getMyTopics

```solidity
function getMyTopics(uint256 offset) external view returns (struct IUserSupportChat.OutputTopic[], uint256)
```

Retrieves paginated list of user's topics

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| offset | uint256 | Pagination starting point |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct IUserSupportChat.OutputTopic[] | (OutputTopic[], uint256) Topics array and total count |
| [1] | uint256 |  |

### getTopic

```solidity
function getTopic(uint256 topic_id) external view returns (struct IUserSupportChat.Topic)
```

Retrieves topic details

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| topic_id | uint256 | ID of the topic to fetch |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct IUserSupportChat.Topic | Topic Complete topic data structure |

### getMessages

```solidity
function getMessages(uint256 topic_id, uint256 offset) external view returns (struct IUserSupportChat.OutputUserMessage[], uint256)
```

Retrieves paginated messages from a topic

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| topic_id | uint256 | ID of the target topic |
| offset | uint256 | Pagination starting point |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct IUserSupportChat.OutputUserMessage[] | (OutputUserMessage[], uint256) Messages array and total count |
| [1] | uint256 |  |

### getMessage

```solidity
function getMessage(uint256 topic_id, uint256 message_id) external view returns (struct IUserSupportChat.UserMessage)
```

Retrieves specific message details

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| topic_id | uint256 | ID of the containing topic |
| message_id | uint256 | ID of the message to fetch |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct IUserSupportChat.UserMessage | UserMessage Complete message data |

### countUnreadedMessages

```solidity
function countUnreadedMessages(uint256 topic_id, address account) internal view returns (uint256)
```

_Calculates unread messages for a user in a topic_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| topic_id | uint256 | ID of the target topic |
| account | address | User address to check |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint256 Count of unread messages |

### makeTopicFirst

```solidity
function makeTopicFirst(uint256 topic_id) internal
```

_Reorders topics to keep most recent first_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| topic_id | uint256 | ID of the topic to prioritize |

