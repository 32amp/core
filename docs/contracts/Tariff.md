# Solidity API

## Tariff

Handles the storage and management of tariff information

_Manages tariff data including pricing, energy mix, and validity periods_

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

### counter

```solidity
uint256 counter
```

_Auto-incrementing tariff ID counter_

### last_updated

```solidity
mapping(uint256 => uint256) last_updated
```

_Timestamp of last update for each tariff_

### tariffs

```solidity
mapping(uint256 => struct ITariff.Tariff) tariffs
```

_Tariff data storage_

### min_price

```solidity
mapping(uint256 => struct DataTypes.Price) min_price
```

_Minimum price configuration for tariffs_

### max_price

```solidity
mapping(uint256 => struct DataTypes.Price) max_price
```

_Maximum price configuration for tariffs_

### start_date_time

```solidity
mapping(uint256 => uint256) start_date_time
```

_Start date and time for tariff validity_

### end_date_time

```solidity
mapping(uint256 => uint256) end_date_time
```

_End date and time for tariff validity_

### energy_mix

```solidity
mapping(uint256 => struct DataTypes.EnergyMix) energy_mix
```

_Energy mix configuration for tariffs_

### country_code

```solidity
mapping(uint256 => bytes2) country_code
```

_Country code associated with tariffs_

### party_id

```solidity
mapping(uint256 => bytes3) party_id
```

_Party ID associated with tariffs_

### initialize

```solidity
function initialize(uint256 _partner_id, address _hubContract) public
```

Initializes the contract with Hub connection

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _partner_id | uint256 | Partner ID from Hub registry |
| _hubContract | address | Address of Hub contract |

### getVersion

```solidity
function getVersion() external pure returns (string)
```

Returns the current contract version

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string | string Contract version identifier |

### exist

```solidity
function exist(uint256 id) external view returns (bool)
```

Checks if a tariff exists by ID

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | uint256 | Tariff ID to check |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | bool True if the tariff exists, false otherwise |

### access

```solidity
modifier access(uint256 id)
```

Access control modifier requiring FOURTH level privileges

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | uint256 | Tariff ID to check access for |

### _updated

```solidity
function _updated(uint256 id) internal
```

_Internal function to update the last modified timestamp_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | uint256 | Tariff ID to update |

### add

```solidity
function add(struct ITariff.Tariff tariff) external
```

Adds a new tariff to the registry

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| tariff | struct ITariff.Tariff | Tariff data structure to add |

### setMinPrice

```solidity
function setMinPrice(uint256 id, struct DataTypes.Price _min_price) external
```

Sets the minimum price for a tariff

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | uint256 | Tariff ID to update |
| _min_price | struct DataTypes.Price | Price structure containing minimum price details |

### setMaxPrice

```solidity
function setMaxPrice(uint256 id, struct DataTypes.Price _max_price) external
```

Sets the maximum price for a tariff

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | uint256 | Tariff ID to update |
| _max_price | struct DataTypes.Price | Price structure containing maximum price details |

### setStartDateTime

```solidity
function setStartDateTime(uint256 id, uint256 _start_date_time) external
```

Sets the start date and time for a tariff

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | uint256 | Tariff ID to update |
| _start_date_time | uint256 | Unix timestamp for tariff start |

### setEndDateTime

```solidity
function setEndDateTime(uint256 id, uint256 _end_date_time) external
```

Sets the end date and time for a tariff

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | uint256 | Tariff ID to update |
| _end_date_time | uint256 | Unix timestamp for tariff end |

### setEnergyMix

```solidity
function setEnergyMix(uint256 id, struct DataTypes.EnergyMix _energy_mix) external
```

Sets the energy mix configuration for a tariff

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | uint256 | Tariff ID to update |
| _energy_mix | struct DataTypes.EnergyMix | EnergyMix structure containing energy source details |

### get

```solidity
function get(uint256 id) external view returns (struct ITariff.Output)
```

Retrieves complete tariff details by ID

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | uint256 | Tariff ID to query |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct ITariff.Output | Output Tariff data structure with all associated details |

### getLight

```solidity
function getLight(uint256 id) external view returns (struct ITariff.OutputLight)
```

Retrieves lightweight tariff details by ID

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | uint256 | Tariff ID to query |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct ITariff.OutputLight | OutputLight Simplified tariff data structure |

