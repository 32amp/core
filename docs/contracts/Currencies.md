# Solidity API

## Currencies

Handles the storage and retrieval of currency information

_Manages a registry of currencies with unique identifiers and codes_

### counter

```solidity
uint256 counter
```

_Auto-incrementing currency ID counter_

### currencies

```solidity
mapping(uint256 => struct ICurrencies.Currency) currencies
```

_Currency storage by ID_

### isexist

```solidity
mapping(string => uint256) isexist
```

_Mapping of alphabetic codes to currency IDs_

### initialize

```solidity
function initialize() public
```

Initializes the contract with default currency data

_Adds the US Dollar as the first currency and sets the contract owner_

### getVersion

```solidity
function getVersion() external pure returns (string)
```

Returns the current contract version

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string | string Contract version identifier |

### add

```solidity
function add(struct ICurrencies.Currency currency) external
```

Adds a new currency to the registry

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| currency | struct ICurrencies.Currency | Currency data structure to add |

### get

```solidity
function get(uint256 id) external view returns (struct ICurrencies.Currency)
```

Retrieves currency details by ID

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | uint256 | Currency ID to query |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct ICurrencies.Currency | Currency Currency data structure |

### exist

```solidity
function exist(uint256 id) external view returns (bool)
```

Checks if a currency exists by ID

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | uint256 | Currency ID to check |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | bool True if the currency exists, false otherwise |

### list

```solidity
function list() external view returns (struct ICurrencies.Currency[])
```

Retrieves a list of all registered currencies

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct ICurrencies.Currency[] | Currency[] Array of currency data structures |

