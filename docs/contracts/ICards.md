# Solidity API

## ICards

Defines data structures and events for card and autopay operations

_Provides the foundation for managing user payment cards and autopay settings_

### AddCardRequest

```solidity
event AddCardRequest(address account, uint256 request_id)
```

Emitted when a user initiates a card addition request

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | Address of the user requesting to add a card |
| request_id | uint256 | Unique identifier for the request |

### AddCardResponse

```solidity
event AddCardResponse(address account, uint256 request_id, bool status, string message, string payment_endpoint)
```

Emitted when an admin responds to a card addition request

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | Address of the user who made the request |
| request_id | uint256 | Unique identifier for the request |
| status | bool | Response status (true for success, false for failure) |
| message | string | Encrypted response message or error details |
| payment_endpoint | string | Encrypted URL for payment processing (if applicable) |

### AddCardSuccess

```solidity
event AddCardSuccess(address account, uint256 request_id, bytes32 card_id)
```

Emitted when a card is successfully added to a user's account

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | Address of the user |
| request_id | uint256 |  |
| card_id | bytes32 | Index of the newly added card |

### WriteOffRequest

```solidity
event WriteOffRequest(address account, uint256 request_id, bytes32 card_id, string amount)
```

Emitted when a user initiates a write-off request

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | Address of the user |
| request_id | uint256 | Unique identifier for the request |
| card_id | bytes32 | Id of the card used for the write-off |
| amount | string | Encrypted amount to be written off |

### WriteOffResponse

```solidity
event WriteOffResponse(address account, uint256 request_id, bytes32 card_id, uint256 error_code, bool status, string message, string amount)
```

Emitted when an admin responds to a write-off request

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | Address of the user |
| request_id | uint256 | Unique identifier for the request |
| card_id | bytes32 | Index of the card used for the write-off |
| error_code | uint256 | Response code from bank |
| status | bool | Response status (true for success, false for failure) |
| message | string | Encrypted response message or error details |
| amount | string | Encrypted amount written off |

### CardInfo

Contains details of a user's payment card

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct CardInfo {
  string rebill_id;
  string provider;
  string card_type;
  string expire_year;
  string expire_month;
  string first6;
  string last4;
}
```

### Card

```solidity
struct Card {
  bytes32 id;
  bool is_primary;
  struct ICards.CardInfo card;
}
```

### AutopaySettings

Contains configuration for automatic payments

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct AutopaySettings {
  uint256 amount;
  uint256 monthly_limit;
  uint256 threshold;
  bool is_active;
}
```

### getVersion

```solidity
function getVersion() external pure returns (string)
```

### addCardRequest

```solidity
function addCardRequest() external
```

### addCardResponse

```solidity
function addCardResponse(address account, uint256 request_id, bool status, string message, string paymentEndpoint) external
```

### addCard

```solidity
function addCard(address account, uint256 request_id, struct ICards.CardInfo card) external
```

### setAutoPaySettings

```solidity
function setAutoPaySettings(uint256 amount, uint256 monthly_limit, uint256 threshold) external
```

### disableAutoPay

```solidity
function disableAutoPay() external
```

### removeCard

```solidity
function removeCard(bytes32 card_id) external
```

### getCards

```solidity
function getCards(address account) external view returns (struct ICards.Card[])
```

### getPrimaryCard

```solidity
function getPrimaryCard(address account) external view returns (struct ICards.Card)
```

### getAutoPaymentSettings

```solidity
function getAutoPaymentSettings(address account) external view returns (struct ICards.AutopaySettings)
```

### writeOffRequest

```solidity
function writeOffRequest(string amount) external
```

### writeOffResponse

```solidity
function writeOffResponse(address account, uint256 request_id, bytes32 card_id, uint256 error_code, bool status, string message, string amount) external
```

