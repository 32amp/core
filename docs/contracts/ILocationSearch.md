# Solidity API

## ILocationSearch

Defines data structures for geospatial search operations

_Inherits common data types from DataTypes interface_

### inAreaInput

Structure defining search criteria for location queries

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct inAreaInput {
  string topRightLat;
  string topRightLong;
  string bottomLeftLat;
  string bottomLeftLong;
  uint64 offset;
  uint8[] connectors;
  bool onlyFreeConnectors;
  bool publish;
  uint256 max_payment_by_kwt;
  uint256 max_payment_buy_time;
  uint256[] favorite_evse;
}
```

### inAreaOutput

Contains essential location data for search results

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct inAreaOutput {
  uint256 id;
  struct DataTypes.GeoLocation coordinates;
}
```

### getVersion

```solidity
function getVersion() external pure returns (string)
```

### inArea

```solidity
function inArea(struct ILocationSearch.inAreaInput input) external view returns (struct ILocationSearch.inAreaOutput[], uint256)
```

### addLocationToIndex

```solidity
function addLocationToIndex(int16 lat, int16 lon, uint256 location_id) external
```

