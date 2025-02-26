# Solidity API

## LocationSearch

Provides geospatial search capabilities for charging locations

_Implements grid-based spatial indexing for efficient location queries_

### locations_index

```solidity
mapping(int16 => mapping(int16 => uint256[])) locations_index
```

_Grid-based spatial index [latitude][longitude] => location IDs_

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

### addLocationToIndex

```solidity
function addLocationToIndex(int16 lat, int16 lon, uint256 location_id) external
```

Adds location to spatial index

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| lat | int16 | Integer latitude coordinate |
| lon | int16 | Integer longitude coordinate |
| location_id | uint256 | Location ID to index |

### inArea

```solidity
function inArea(struct ILocationSearch.inAreaInput input) external view returns (struct ILocationSearch.inAreaOutput[], uint256)
```

Searches locations within specified area

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| input | struct ILocationSearch.inAreaInput | Search parameters including coordinates |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct ILocationSearch.inAreaOutput[] | (inAreaOutput[] memory, uint256) Array of results and total count |
| [1] | uint256 |  |

