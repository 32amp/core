# Solidity API

## ILocation

Defines data structures and events for charging station locations

_Inherits common data types from DataTypes interface_

### GeoLocationString

String-based latitude/longitude representation

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct GeoLocationString {
  string latitude;
  string longitude;
}
```

### Add

Input structure for new location registration

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct Add {
  string name;
  string _address;
  bytes32 city;
  bytes32 postal_code;
  bytes32 state;
  bytes32 country;
  struct ILocation.GeoLocationString coordinates;
  enum DataTypes.ParkingType parking_type;
  enum DataTypes.Facility[] facilities;
  string time_zone;
  bool charging_when_closed;
  bool publish;
}
```

### outLocation

Aggregated location information structure

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct outLocation {
  struct DataTypes.Location location;
  struct DataTypes.AdditionalGeoLocation[] related_locations;
  struct DataTypes.Image[] images;
  struct DataTypes.Hours opening_times;
  struct DataTypes.DisplayText[] directions;
  struct IEVSE.outEVSE[] evses;
}
```

### AddLocation

```solidity
event AddLocation(uint256 uid, uint256 partner_id, address account)
```

Emitted when new charging location is registered

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| uid | uint256 | Auto-generated location ID |
| partner_id | uint256 | Hub-registered operator ID |
| account | address | Creator's wallet address |

### getVersion

```solidity
function getVersion() external pure returns (string)
```

### addLocation

```solidity
function addLocation(struct ILocation.Add add) external
```

### getLocation

```solidity
function getLocation(uint256 id) external view returns (struct ILocation.outLocation)
```

### exist

```solidity
function exist(uint256 location_id) external returns (bool)
```

### addRelatedLocation

```solidity
function addRelatedLocation(uint256 location_id, struct DataTypes.AdditionalGeoLocation add) external
```

### removeRelatedLocation

```solidity
function removeRelatedLocation(uint256 location_id, uint256 loc_id) external
```

### addImage

```solidity
function addImage(uint256 location_id, struct DataTypes.Image add) external
```

### removeImage

```solidity
function removeImage(uint256 location_id, uint256 image_id) external
```

### addDirection

```solidity
function addDirection(uint256 location_id, struct DataTypes.DisplayText add) external
```

### removeDirection

```solidity
function removeDirection(uint256 location_id, uint256 direction_id) external
```

### setOpeningTimes

```solidity
function setOpeningTimes(uint256 location_id, struct DataTypes.Hours add) external
```

### addEVSE

```solidity
function addEVSE(uint256 location_id, uint256 add) external
```

### removeEVSE

```solidity
function removeEVSE(uint256 location_id, uint256 evse) external
```

