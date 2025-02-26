# Solidity API

## IEVSE

Defines data structures and events for Electric Vehicle Supply Equipment

_Inherits common data types from DataTypes interface_

### EVSEMeta

Extended operational data for EVSE units

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct EVSEMeta {
  struct DataTypes.StatusSchedule[] status_schedule;
  enum DataTypes.Capabilities[] capabilities;
  struct DataTypes.GeoLocation coordinates;
  enum DataTypes.ParkingRestriction[] parking_restrictions;
  int8 floor_level;
}
```

### outEVSE

Aggregated EVSE information structure

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct outEVSE {
  struct DataTypes.EVSE evse;
  struct IEVSE.EVSEMeta meta;
  enum DataTypes.EVSEStatus evses_status;
  uint256 location_id;
  uint256 last_updated;
  struct DataTypes.Image[] images;
  struct IConnector.output[] connectors;
}
```

### AddEVSE

```solidity
event AddEVSE(uint256 uid, uint256 partner_id, address account)
```

Emitted when new EVSE is added to the system

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| uid | uint256 | Auto-generated EVSE ID |
| partner_id | uint256 | Hub-registered operator ID |
| account | address | Creator's wallet address |

### getVersion

```solidity
function getVersion() external pure returns (string)
```

### exist

```solidity
function exist(uint256 id) external view returns (bool)
```

### add

```solidity
function add(struct DataTypes.EVSE evse, uint256 location_id) external
```

### setMeta

```solidity
function setMeta(uint256 evse_id, struct IEVSE.EVSEMeta meta) external
```

### addImage

```solidity
function addImage(uint256 evse_id, struct DataTypes.Image image) external
```

### removeImage

```solidity
function removeImage(uint256 evse_id, uint256 image_id) external
```

### setStatus

```solidity
function setStatus(uint256 evse_id, enum DataTypes.EVSEStatus status) external
```

### addConnector

```solidity
function addConnector(uint256 evse_id, uint256 connector_id) external
```

### removeConnector

```solidity
function removeConnector(uint256 evse_id, uint256 connector_id) external
```

### get

```solidity
function get(uint256 id) external view returns (struct IEVSE.outEVSE)
```

