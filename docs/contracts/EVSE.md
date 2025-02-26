# Solidity API

## EVSE

Handles Electric Vehicle Supply Equipment (EVSE) operations

_Upgradeable contract integrated with Hub ecosystem_

### evses

```solidity
mapping(uint256 => struct DataTypes.EVSE) evses
```

_Primary EVSE data storage_

### evses_meta

```solidity
mapping(uint256 => struct IEVSE.EVSEMeta) evses_meta
```

_Metadata storage for EVSEs_

### evses_status

```solidity
mapping(uint256 => enum DataTypes.EVSEStatus) evses_status
```

_Operational status tracking_

### evses_related_location

```solidity
mapping(uint256 => uint256) evses_related_location
```

_Location association mapping_

### evses_last_updated

```solidity
mapping(uint256 => uint256) evses_last_updated
```

_Timestamp of last updates_

### evse_images

```solidity
mapping(uint256 => struct DataTypes.Image[]) evse_images
```

_Image references storage_

### evse_connectors

```solidity
mapping(uint256 => uint256[]) evse_connectors
```

_Connector associations_

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

### evsecounter

```solidity
uint256 evsecounter
```

_Auto-incrementing EVSE ID counter_

### timestampCounter

```solidity
uint256 timestampCounter
```

_Cyclic timestamp counter for updates_

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

### exist

```solidity
function exist(uint256 id) external view returns (bool)
```

Checks EVSE existence

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | uint256 | EVSE ID to check |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | bool True if EVSE exists |

### access

```solidity
modifier access(uint256 evse_id)
```

Access control modifier requiring FOURTH level privileges

### add

```solidity
function add(struct DataTypes.EVSE evse, uint256 location_id) external
```

Registers new EVSE

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| evse | struct DataTypes.EVSE | EVSE data structure |
| location_id | uint256 | Associated location ID |

### setMeta

```solidity
function setMeta(uint256 evse_id, struct IEVSE.EVSEMeta meta) external
```

Updates EVSE metadata

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| evse_id | uint256 | Target EVSE ID |
| meta | struct IEVSE.EVSEMeta | Metadata structure |

### addImage

```solidity
function addImage(uint256 evse_id, struct DataTypes.Image image) external
```

Adds image reference to EVSE

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| evse_id | uint256 | Target EVSE ID |
| image | struct DataTypes.Image | Image data structure |

### removeImage

```solidity
function removeImage(uint256 evse_id, uint256 image_id) external
```

Removes image by index

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| evse_id | uint256 | Target EVSE ID |
| image_id | uint256 | Image array index |

### setStatus

```solidity
function setStatus(uint256 evse_id, enum DataTypes.EVSEStatus status) external
```

Updates EVSE operational status

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| evse_id | uint256 | Target EVSE ID |
| status | enum DataTypes.EVSEStatus | New status value |

### addConnector

```solidity
function addConnector(uint256 evse_id, uint256 connector_id) external
```

Associates connector with EVSE

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| evse_id | uint256 | Target EVSE ID |
| connector_id | uint256 | Connector ID to add |

### removeConnector

```solidity
function removeConnector(uint256 evse_id, uint256 connector_id) external
```

Removes connector association

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| evse_id | uint256 | Target EVSE ID |
| connector_id | uint256 | Connector array index |

### get

```solidity
function get(uint256 id) external view returns (struct IEVSE.outEVSE)
```

Retrieves complete EVSE data

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | uint256 | EVSE ID to query |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct IEVSE.outEVSE | outEVSE Aggregated EVSE information |

### _updated

```solidity
function _updated(uint256 id) internal
```

_Internal update tracker with cyclic timestamp counter_

