# Solidity API

## IUserSupportChat

Defines data structures and events for user support system

_Inherits error handling from IBaseErrors_

### TopicRating

User satisfaction rating scale for resolved support cases

_None = 0, FiveStar = 5_

```solidity
enum TopicRating {
  None,
  OneStar,
  TwoStar,
  ThreeStar,
  FourStar,
  FiveStar
}
```

### TopicTheme

Classification system for support requests

```solidity
enum TopicTheme {
  None,
  ChargingSession,
  App,
  Payment,
  Contact
}
```

### OutputUserMessage

Combines message content with its metadata

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct OutputUserMessage {
  struct IUserSupportChat.UserMessage message;
  uint256 id;
}
```

### OutputTopic

Complete topic data with additional metadata

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct OutputTopic {
  struct IUserSupportChat.Topic topic;
  uint256 id;
  uint256 unreaded_messages;
}
```

### InputMessage

Data required to create new messages

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct InputMessage {
  string text;
  string image;
  uint256 reply_to;
}
```

### UserMessage

Complete message metadata and content

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct UserMessage {
  string text;
  string image;
  uint256 reply_to;
  uint256 create_at;
  bool readed;
  address account;
}
```

### Topic

Complete support case metadata

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct Topic {
  uint256 create_at;
  uint256 update_at;
  address create_user_account;
  uint256 message_counter;
  enum IUserSupportChat.TopicTheme theme;
  bool closed;
  enum IUserSupportChat.TopicRating user_rating;
}
```

### Message

```solidity
event Message(uint256 topic_id, uint256 message_id)
```

Emitted on new message creation

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| topic_id | uint256 | Related support case ID |
| message_id | uint256 | New message ID |

### CreateTopic

```solidity
event CreateTopic(uint256 topic_id, enum IUserSupportChat.TopicTheme theme)
```

Emitted when new support case is opened

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| topic_id | uint256 | Newly created case ID |
| theme | enum IUserSupportChat.TopicTheme | Category of the support case |

### UpdateTopic

```solidity
event UpdateTopic(uint256 topic_id, enum IUserSupportChat.TopicTheme theme, uint256 update_at)
```

Emitted on case activity update

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| topic_id | uint256 | Modified case ID |
| theme | enum IUserSupportChat.TopicTheme | Current category |
| update_at | uint256 | Timestamp of last change |

### CloseTopic

```solidity
event CloseTopic(uint256 topic_id, address account)
```

Emitted when case is resolved

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| topic_id | uint256 | Closed case ID |
| account | address | Address that closed the case |

### UserTopicEvent

```solidity
event UserTopicEvent(uint256 topic_id, address account)
```

General case activity notification

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| topic_id | uint256 | Affected case ID |
| account | address | Address related to activity |

### getVersion

```solidity
function getVersion() external pure returns (string)
```

### createTopic

```solidity
function createTopic(string _text_message, enum IUserSupportChat.TopicTheme theme) external
```

### sendMessage

```solidity
function sendMessage(uint256 topic_id, struct IUserSupportChat.InputMessage message) external
```

### setRating

```solidity
function setRating(uint256 topic_id, enum IUserSupportChat.TopicRating rating) external
```

### closeTopic

```solidity
function closeTopic(uint256 topic_id) external
```

### setReadedMessages

```solidity
function setReadedMessages(uint256 topic_id, uint256[] message_ids) external
```

### getMyTopics

```solidity
function getMyTopics(uint256 offset) external view returns (struct IUserSupportChat.OutputTopic[], uint256)
```

### getTopic

```solidity
function getTopic(uint256 topic_id) external view returns (struct IUserSupportChat.Topic)
```

### getMessages

```solidity
function getMessages(uint256 topic_id, uint256 offset) external view returns (struct IUserSupportChat.OutputUserMessage[], uint256)
```

### getMessage

```solidity
function getMessage(uint256 topic_id, uint256 message_id) external view returns (struct IUserSupportChat.UserMessage)
```

