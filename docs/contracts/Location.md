# Solidity API

## Location

Handles geolocation data and related services for charging stations

_Upgradeable contract integrated with Hub ecosystem_

### locations

```solidity
mapping(uint256 => struct DataTypes.Location) locations
```

_Main location storage mapped by location ID_

### related_locations

```solidity
mapping(uint256 => struct DataTypes.AdditionalGeoLocation[]) related_locations
```

_Additional geo-coordinates associated with locations_

### images_location

```solidity
mapping(uint256 => struct DataTypes.Image[]) images_location
```

_Image metadata storage for location visuals_

### opening_times_location

```solidity
mapping(uint256 => struct DataTypes.Hours) opening_times_location
```

_Opening hours configuration for locations_

### directions_location

```solidity
mapping(uint256 => struct DataTypes.DisplayText[]) directions_location
```

_Navigation instructions for locations_

### evses_location

```solidity
mapping(uint256 => uint256[]) evses_location
```

_List of EVSE IDs associated with locations_

### locationCounter

```solidity
uint256 locationCounter
```

_Auto-incrementing location ID tracker_

### hubContract

```solidity
address hubContract
```

Reference to Hub contract address

### partner_id

```solidity
uint256 partner_id
```

Associated partner ID from Hub

### timestampCounter

```solidity
uint256 timestampCounter
```

_Cyclic timestamp counter for update tracking_

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
modifier access(uint256 location_id)
```

Access control modifier requiring FOURTH level privileges

### addRelatedLocation

```solidity
function addRelatedLocation(uint256 location_id, struct DataTypes.AdditionalGeoLocation add) external
```

Adds supplementary geographic reference

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| location_id | uint256 | Target location ID |
| add | struct DataTypes.AdditionalGeoLocation | AdditionalGeoLocation data structure |

### removeRelatedLocation

```solidity
function removeRelatedLocation(uint256 location_id, uint256 loc_id) external
```

Removes geographic reference by index

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| location_id | uint256 | Target location ID |
| loc_id | uint256 | Index in related_locations array |

### addImage

```solidity
function addImage(uint256 location_id, struct DataTypes.Image add) external
```

Adds image metadata to location

_Stores image references off-chain (IPFS/HTTP)_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| location_id | uint256 | Target location ID |
| add | struct DataTypes.Image | Image structure containing URL and description |

### removeImage

```solidity
function removeImage(uint256 location_id, uint256 image_id) external
```

Removes image by index

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| location_id | uint256 | Target location ID |
| image_id | uint256 | Index in images array |

### addDirection

```solidity
function addDirection(uint256 location_id, struct DataTypes.DisplayText add) external
```

Adds navigation instructions

_Поддерживает мультиязычные инструкции_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| location_id | uint256 | Target location ID |
| add | struct DataTypes.DisplayText | DisplayText structure с языковыми переводами |

### removeDirection

```solidity
function removeDirection(uint256 location_id, uint256 direction_id) external
```

Removes direction by index

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| location_id | uint256 | Target location ID |
| direction_id | uint256 | Index in directions array |

### addEVSE

```solidity
function addEVSE(uint256 location_id, uint256 add) external
```

Links EVSE charging station to location

_Requires valid EVSE registration via the appropriate module_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| location_id | uint256 | Target location ID |
| add | uint256 | EVSE ID to associate |

### removeEVSE

```solidity
function removeEVSE(uint256 location_id, uint256 evse) external
```

Unlinks EVSE from location

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| location_id | uint256 | Target location ID |
| evse | uint256 | Index in evses array |

### setOpeningTimes

```solidity
function setOpeningTimes(uint256 location_id, struct DataTypes.Hours add) external
```

Updates operating hours schedule

_Completely replaces the previous work schedule_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| location_id | uint256 | Target location ID |
| add | struct DataTypes.Hours | Hours structure with time slots |

### addLocation

```solidity
function addLocation(struct ILocation.Add add) external
```

Creates new charging location entry

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| add | struct ILocation.Add | Add data structure containing location details |

### getLocation

```solidity
function getLocation(uint256 id) external view returns (struct ILocation.outLocation)
```

Retrieves complete location data

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | uint256 | Location ID to query |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct ILocation.outLocation | loc outLocation structure with aggregated data |

### exist

```solidity
function exist(uint256 location_id) public view returns (bool)
```

Checks existence of location ID

### _updated

```solidity
function _updated(uint256 location_id) internal
```

_Internal update tracker with cyclic timestamp counter_

