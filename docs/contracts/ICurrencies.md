# Solidity API

## ICurrencies

Defines the data structure for currency information

_Inherits error definitions from IBaseErrors for consistent error handling_

### Currency

Represents complete information about a national currency

_Aligns with ISO 4217 currency specifications_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct Currency {
  string country;
  string currency;
  string alphabetic_code;
  string symbol;
  uint16 numeric_code;
  uint8 minor_unit;
}
```

### getVersion

```solidity
function getVersion() external pure returns (string)
```

### add

```solidity
function add(struct ICurrencies.Currency currency) external
```

### get

```solidity
function get(uint256 id) external view returns (struct ICurrencies.Currency)
```

### exist

```solidity
function exist(uint256 id) external view returns (bool)
```

### list

```solidity
function list() external view returns (struct ICurrencies.Currency[])
```

