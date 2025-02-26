# Solidity API

## UserAccess

Handles granular access control for modules and objects

_Implements multi-level permissions system with individual and group access_

### partner_id

```solidity
uint256 partner_id
```

Associated partner ID from Hub

### hubContract

```solidity
address hubContract
```

Hub contract address

### initialize

```solidity
function initialize(uint256 _partner_id, address _hubContract) external
```

Initializes access control system

_Automatically grants GOD access to contract owner and modules_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _partner_id | uint256 | Partner ID from Hub registry |
| _hubContract | address | Hub contract address |

### getVersion

```solidity
function getVersion() external pure returns (string)
```

Returns contract version

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string | string Constant version identifier |

### _setAccessLevelToObject

```solidity
function _setAccessLevelToObject(address user_address, string module, bytes32 object_id, enum IUserAccess.AccessLevel access_level) internal
```

_Internal function to set object-level access_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user_address | address | Target address |
| module | string | Module name |
| object_id | bytes32 | Object identifier |
| access_level | enum IUserAccess.AccessLevel | Permission level to set |

### _setAccessLevelToModule

```solidity
function _setAccessLevelToModule(address user_address, string module, enum IUserAccess.AccessLevel access_level) internal
```

_Internal function to set module-level access_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user_address | address | Target address |
| module | string | Module name |
| access_level | enum IUserAccess.AccessLevel | Permission level to set |

### _groupSetAccessLevelToObject

```solidity
function _groupSetAccessLevelToObject(uint256 group_id, string module, bytes32 object_id, enum IUserAccess.AccessLevel access_level) internal
```

_Internal function to set group-based object access_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| group_id | uint256 | Group identifier |
| module | string | Module name |
| object_id | bytes32 | Object identifier |
| access_level | enum IUserAccess.AccessLevel | Permission level to set |

### _groupSetAccessLevelToModule

```solidity
function _groupSetAccessLevelToModule(uint256 group_id, string module, enum IUserAccess.AccessLevel access_level) internal
```

_Internal function to set group-based module access_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| group_id | uint256 | Group identifier |
| module | string | Module name |
| access_level | enum IUserAccess.AccessLevel | Permission level to set |

### setAccessLevelToModule

```solidity
function setAccessLevelToModule(address user_address, string module, enum IUserAccess.AccessLevel access_level) external
```

Sets module access level for a user

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user_address | address | Target address |
| module | string | Module name |
| access_level | enum IUserAccess.AccessLevel | New permission level |

### setAccessLevelToModuleObject

```solidity
function setAccessLevelToModuleObject(bytes32 object_id, address user_address, string module, enum IUserAccess.AccessLevel access_level) external
```

Sets object-level access within a module

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| object_id | bytes32 | Object identifier |
| user_address | address | Target address |
| module | string | Module name |
| access_level | enum IUserAccess.AccessLevel | New permission level |

### getModuleAccessLevel

```solidity
function getModuleAccessLevel(string module, address user_address) public view returns (uint256)
```

Retrieves module access level for a user

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| module | string | Module name to check |
| user_address | address | Address to check |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint Numeric representation of access level |

### getObjectAccessLevel

```solidity
function getObjectAccessLevel(string module, bytes32 object_id, address user_address) public view returns (uint256)
```

Retrieves object access level for a user

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| module | string | Module name |
| object_id | bytes32 | Object identifier |
| user_address | address | Address to check |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint Numeric representation of access level |

### getGroupModuleAccessLevel

```solidity
function getGroupModuleAccessLevel(string module, uint256 group_id) external view returns (uint256)
```

Retrieves module access level for a group

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| module | string | Module name |
| group_id | uint256 | Group identifier |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint Numeric representation of access level |

### getGroupObjectAccessLevel

```solidity
function getGroupObjectAccessLevel(string module, bytes32 object_id, uint256 group_id) external view returns (uint256)
```

Retrieves object access level for a group

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| module | string | Module name |
| object_id | bytes32 | Object identifier |
| group_id | uint256 | Group identifier |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint Numeric representation of access level |

### getMyModulesAccess

```solidity
function getMyModulesAccess() external view returns (string[], uint256[])
```

Retrieves caller's module access list

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string[] | (string[] memory, uint[] memory) Module names and corresponding access levels |
| [1] | uint256[] |  |

### checkAccess

```solidity
function checkAccess(address user_address, string module, bytes32 object_id, uint256 level) external view
```

Validates access rights for module+object combination

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user_address | address | Address to check |
| module | string | Module name |
| object_id | bytes32 | Object identifier |
| level | uint256 | Required access level |

### checkAccessModule

```solidity
function checkAccessModule(address user_address, string module, uint256 level) external view
```

Validates module access rights

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user_address | address | Address to check |
| module | string | Module name |
| level | uint256 | Required access level |

