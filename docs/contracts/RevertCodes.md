# Solidity API

## RevertCodes

### revert_codes

```solidity
mapping(string => mapping(string => mapping(string => string))) revert_codes
```

### exist_revert_codes

```solidity
mapping(string => mapping(string => bool)) exist_revert_codes
```

### revert_codes_index

```solidity
mapping(string => string[]) revert_codes_index
```

### hubContract

```solidity
address hubContract
```

### partner_id

```solidity
uint256 partner_id
```

### onlyModule

```solidity
modifier onlyModule(string module)
```

### onlyPartner

```solidity
modifier onlyPartner()
```

### initialize

```solidity
function initialize(uint256 _partner_id, address _hubContract) public
```

### getRevertMessages

```solidity
function getRevertMessages(string module, string lang) external view returns (struct IRevertCodes.Output[] output)
```

### updateLocale

```solidity
function updateLocale(string module, struct IRevertCodes.UpdateLocales[] update_locales) external
```

### registerRevertCode

```solidity
function registerRevertCode(string module, string code, string message) external
```

### panic

```solidity
function panic(string module, string code) external view
```

