# Solidity API

## Cards

Handles user payment cards and autopay settings

_Manages card storage, autopay configurations, and card-related operations_

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

### max_user_cards

```solidity
uint256 max_user_cards
```

_Maximum number of cards allowed per user_

### cards

```solidity
mapping(address => struct ICards.Card[]) cards
```

_User card storage_

### autopay_settings

```solidity
mapping(address => struct ICards.AutopaySettings) autopay_settings
```

_User autopay settings_

### add_card_request_id

```solidity
mapping(address => uint256) add_card_request_id
```

_Card addition request IDs_

### write_off_request_id

```solidity
mapping(address => uint256) write_off_request_id
```

_Write-off request IDs_

### initialize

```solidity
function initialize(uint256 _partner_id, address _hubContract) public
```

Initializes contract with Hub connection

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _partner_id | uint256 | Partner ID from Hub registry |
| _hubContract | address | Address of Hub contract |

### getVersion

```solidity
function getVersion() external pure returns (string)
```

Returns current contract version

### onlyAdmin

```solidity
modifier onlyAdmin()
```

Access control modifier requiring FOURTH level privileges

### onlyUser

```solidity
modifier onlyUser()
```

Access control modifier requiring for check user exist

### addCardRequest

```solidity
function addCardRequest() external
```

Initiates a card addition request

### addCardResponse

```solidity
function addCardResponse(address account, uint256 request_id, bool status, string message, string payment_endpoint) external
```

Responds to a card addition request

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | User address |
| request_id | uint256 | Request ID |
| status | bool | Response status |
| message | string | Response message |
| payment_endpoint | string | Payment endpoint URL |

### addCard

```solidity
function addCard(address account, uint256 request_id, struct ICards.CardInfo card) external
```

Adds a new card for a user

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | User address |
| request_id | uint256 |  |
| card | struct ICards.CardInfo | CardInfo data structure |

### setAutoPaySettings

```solidity
function setAutoPaySettings(uint256 amount, uint256 monthly_limit, uint256 threshold) external
```

Configures autopay settings for a user

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | Autopay amount |
| monthly_limit | uint256 | Monthly spending limit |
| threshold | uint256 | Balance threshold for autopay |

### disableAutoPay

```solidity
function disableAutoPay() external
```

Disables autopay for a user

### removeCard

```solidity
function removeCard(bytes32 card_id) external
```

Removes a card by index

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| card_id | bytes32 | Card id to remove |

### writeOffRequest

```solidity
function writeOffRequest(string amount) external
```

Initiates a write-off request

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | string | Write-off amount |

### writeOffResponse

```solidity
function writeOffResponse(address account, uint256 request_id, bytes32 card_id, uint256 error_code, bool status, string message, string amount) external
```

Responds to a write-off request

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | User address |
| request_id | uint256 | Request ID |
| card_id | bytes32 | Card ID used for write-off |
| error_code | uint256 | Response code from bank |
| status | bool | Response status |
| message | string | Response message |
| amount | string | Write-off amount |

### getPrimaryCard

```solidity
function getPrimaryCard(address account) public view returns (struct ICards.Card)
```

_Retrieves the primary card for a user_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | User address |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct ICards.Card | Card of the primary card |

### getCards

```solidity
function getCards(address account) external view returns (struct ICards.Card[])
```

Retrieves user cards

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | User address |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct ICards.Card[] | Card[] Array of user cards |

### getAutoPaymentSettings

```solidity
function getAutoPaymentSettings(address account) external view returns (struct ICards.AutopaySettings)
```

Retrieves user autopay settings

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | User address |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct ICards.AutopaySettings | AutopaySettings Autopay configuration |

### _checkCardExist

```solidity
function _checkCardExist(address account, bytes32 card_id) internal view returns (bool)
```

