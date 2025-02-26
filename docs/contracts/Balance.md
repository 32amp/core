# Solidity API

## Balance

Handles token balances and transfers within the ecosystem

_Implements ERC-20-like functionality with custom access control_

### hubContract

```solidity
address hubContract
```

Hub contract reference

### currenciesServiceAddress

```solidity
address currenciesServiceAddress
```

Currencies service contract address

### partner_id

```solidity
uint256 partner_id
```

Associated partner ID

### _totalSupply

```solidity
uint256 _totalSupply
```

_Total token supply_

### _currency

```solidity
uint256 _currency
```

_Currency identifier_

### _transfer_ids

```solidity
uint256 _transfer_ids
```

_Transfer ID counter_

### _balances

```solidity
mapping(address => uint256) _balances
```

_Account balances storage_

### _transfers

```solidity
mapping(uint256 => struct IBalance.TransferData) _transfers
```

_Transfer history storage_

### initialize

```solidity
function initialize(uint256 _partner_id, address _hubContract, uint256 __currency) public
```

Initializes contract with currency configuration

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _partner_id | uint256 | Partner ID from Hub registry |
| _hubContract | address | Address of Hub contract |
| __currency | uint256 | Currency identifier |

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

### getCurrency

```solidity
function getCurrency() external view returns (uint256)
```

Gets associated currency ID

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint256 Currency identifier |

### mint

```solidity
function mint(address account, uint256 amount) external
```

Creates new tokens

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | Recipient address |
| amount | uint256 | Amount to mint |

### burn

```solidity
function burn(address account, uint256 amount) external
```

Destroys existing tokens

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | Holder address |
| amount | uint256 | Amount to burn |

### totalSupply

```solidity
function totalSupply() external view returns (uint256)
```

Gets total token supply

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint256 Current total supply |

### balanceOf

```solidity
function balanceOf(address account) external view returns (uint256)
```

Gets account balance

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | User address |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint256 Account balance |

### transfer

```solidity
function transfer(address to, uint256 value) external
```

Transfers tokens between accounts

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | Recipient address |
| value | uint256 | Transfer amount |

### transferFrom

```solidity
function transferFrom(address from, address to, uint256 value) external
```

Admin-initiated transfer between accounts

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | Sender address |
| to | address | Recipient address |
| value | uint256 | Transfer amount |

### _update

```solidity
function _update(address from, address to, uint256 value) internal
```

_Internal balance update mechanism_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | Sender address (address(0) for mint) |
| to | address | Recipient address (address(0) for burn) |
| value | uint256 | Transfer amount |

### _mint

```solidity
function _mint(address account, uint256 value) internal
```

_Internal minting implementation_

### _burn

```solidity
function _burn(address account, uint256 value) internal
```

_Internal burning implementation_

