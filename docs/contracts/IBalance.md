# Solidity API

## IBalance

Defines data structures and events for balance and transfer operations

_Provides the foundation for token balance and transfer functionality_

### TransferData

Contains details of a token transfer

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct TransferData {
  address from;
  address to;
  uint256 value;
}
```

### Transfer

```solidity
event Transfer(address from, address to, uint256 amount, uint256 from_amount, uint256 to_amount)
```

Emitted when tokens are transferred between accounts

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | Address of the sender (address(0) for mint operations) |
| to | address | Address of the recipient (address(0) for burn operations) |
| amount | uint256 | Amount to transfer |
| from_amount | uint256 | Current amount from account |
| to_amount | uint256 | Current amount to account |

### totalSupply

```solidity
function totalSupply() external view returns (uint256)
```

### balanceOf

```solidity
function balanceOf(address account) external view returns (uint256)
```

### transfer

```solidity
function transfer(address to, uint256 value) external
```

### transferFrom

```solidity
function transferFrom(address from, address to, uint256 value) external
```

### getCurrency

```solidity
function getCurrency() external view returns (uint256)
```

### mint

```solidity
function mint(address account, uint256 amount) external
```

### burn

```solidity
function burn(address account, uint256 amount) external
```

