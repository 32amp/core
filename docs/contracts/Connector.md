# Solidity API

## Connector

Handles operations for charging connectors

_Upgradeable contract integrated with Hub ecosystem_

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

### connector_counter

```solidity
uint256 connector_counter
```

_Auto-incrementing connector ID counter_

### connectors

```solidity
mapping(uint256 => struct DataTypes.Connector) connectors
```

_Primary connector data storage_

### last_updated

```solidity
mapping(uint256 => uint256) last_updated
```

_Last update timestamps_

### connector_status

```solidity
mapping(uint256 => enum DataTypes.ConnectorStatus) connector_status
```

_Operational status tracking_

### connector_tariff

```solidity
mapping(uint256 => uint256) connector_tariff
```

_Tariff associations_

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

### access

```solidity
modifier access(uint256 id)
```

Access control modifier requiring FOURTH level privileges

### add

```solidity
function add(struct DataTypes.Connector connector, uint256 evse_id) external
```

Registers new connector

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| connector | struct DataTypes.Connector | Connector data structure |
| evse_id | uint256 | Associated EVSE ID |

### setTariffs

```solidity
function setTariffs(uint256 id, uint256 _tariff) external
```

Assigns tariff to connector

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | uint256 | Connector ID |
| _tariff | uint256 | Tariff ID to assign |

### get

```solidity
function get(uint256 id) external view returns (struct IConnector.output)
```

Retrieves complete connector data

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | uint256 | Connector ID to query |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct IConnector.output | output Aggregated connector information |

### exist

```solidity
function exist(uint256 id) external view returns (bool)
```

Checks connector existence

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | uint256 | Connector ID to verify |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | bool True if connector exists |

### _updated

```solidity
function _updated(uint256 id) internal
```

_Internal update tracker_

