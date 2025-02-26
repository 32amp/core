# Solidity API

## IConnector

Defines data structures and events for charging connectors

_Inherits common data types from DataTypes interface_

### output

Aggregated connector information structure

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct output {
  uint256 id;
  uint256 last_updated;
  struct DataTypes.Connector connector;
  enum DataTypes.ConnectorStatus status;
  struct ITariff.OutputLight tariff;
}
```

### AddConnector

```solidity
event AddConnector(uint256 uid, uint256 partner_id, address account)
```

Emitted when new connector is added to the system

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| uid | uint256 | Auto-generated connector ID |
| partner_id | uint256 | Hub-registered operator ID |
| account | address | Creator's wallet address |

### getVersion

```solidity
function getVersion() external pure returns (string)
```

### add

```solidity
function add(struct DataTypes.Connector connector, uint256 evse_id) external
```

### get

```solidity
function get(uint256 id) external view returns (struct IConnector.output)
```

### setTariffs

```solidity
function setTariffs(uint256 id, uint256 _tariff) external
```

### exist

```solidity
function exist(uint256 id) external view returns (bool)
```

