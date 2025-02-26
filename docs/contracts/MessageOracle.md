# Solidity API

## MessageOracle

### counter

```solidity
uint256 counter
```

### sendTimeout

```solidity
uint256 sendTimeout
```

### priceForMessage

```solidity
uint256 priceForMessage
```

### bodyTemplate

```solidity
string bodyTemplate
```

### whitelistEnable

```solidity
bool whitelistEnable
```

### messages

```solidity
mapping(bytes32 => struct IMessageOracle.message) messages
```

### balances

```solidity
mapping(address => uint256) balances
```

### oracles

```solidity
mapping(address => bool) oracles
```

### senderWhitelist

```solidity
mapping(address => bool) senderWhitelist
```

### initialize

```solidity
function initialize(uint256 _sendTimeout, uint256 _priceForMessage, bool _whitelistEnable, string _bodyTemplate) public
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
function addToWhitelist(address sender) external
```

### removeFromWhitelist

```solidity
function removeFromWhitelist(address sender) external
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

### _checkWhitelist

```solidity
function _checkWhitelist(address account) internal view
```

