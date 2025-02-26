# Solidity API

## IMessageOracle

### message

```solidity
struct message {
  bytes32 text;
  bool delivered;
  uint256 time;
}
```

### Send

```solidity
event Send(bytes32 recipient)
```

### ConfirmSend

```solidity
event ConfirmSend(bytes32 recipient)
```

### getVersion

```solidity
function getVersion() external pure returns (string)
```

### getBalance

```solidity
function getBalance(address account) external view returns (uint256)
```

### getSendTimeout

```solidity
function getSendTimeout() external view returns (uint256)
```

### getPriceForMessage

```solidity
function getPriceForMessage() external view returns (uint256)
```

### getBodyTemplate

```solidity
function getBodyTemplate() external view returns (string)
```

### isWhitelistEnable

```solidity
function isWhitelistEnable() external view returns (bool)
```

### getMessageFor

```solidity
function getMessageFor(bytes32 recipient) external view returns (struct IMessageOracle.message)
```

### addOracle

```solidity
function addOracle(address oracle) external
```

### removeOracle

```solidity
function removeOracle(address oracle) external
```

### addToWhitelist

```solidity
function addToWhitelist(address oracle) external
```

### removeFromWhitelist

```solidity
function removeFromWhitelist(address oracle) external
```

### activateWhitelist

```solidity
function activateWhitelist(bool state) external
```

### changePriceForMessage

```solidity
function changePriceForMessage(uint256 value) external
```

### refill

```solidity
function refill(address account) external payable
```

### sendMessage

```solidity
function sendMessage(bytes32 recipient, bytes32 message) external
```

### confirmSend

```solidity
function confirmSend(bytes32 recipient) external
```

