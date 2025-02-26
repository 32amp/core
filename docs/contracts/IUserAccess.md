# Solidity API

## IUserAccess

Defines the access control levels and permission hierarchy

_Inherits from IBaseErrors for standardized error handling_

### AccessLevel

Tiered permission system for granular access control

_The access levels are ordered hierarchically with increasing privileges:

- **ZERO**: No access (default state)
- **FIRST**: Read-only access (view operations only)
- **SECOND**: Read + Execute (view and trigger basic operations)
- **THIRD**: Read + Execute + Edit (modify existing resources)
- **FOURTH**: Read + Edit + Add (create new resources)
- **FIFTH**: Full CRUD access (Create, Read, Update, Delete)
- **GOD**: Unlimited system access (bypass all permission checks)_

```solidity
enum AccessLevel {
  ZERO,
  FIRST,
  SECOND,
  THIRD,
  FOURTH,
  FIFTH,
  GOD
}
```

### getVersion

```solidity
function getVersion() external pure returns (string)
```

### setAccessLevelToModule

```solidity
function setAccessLevelToModule(address account, string module, enum IUserAccess.AccessLevel access_level) external
```

### getModuleAccessLevel

```solidity
function getModuleAccessLevel(string module, address account) external view returns (uint256)
```

### getObjectAccessLevel

```solidity
function getObjectAccessLevel(string module, bytes32 object_id, address account) external view returns (uint256)
```

### setAccessLevelToModuleObject

```solidity
function setAccessLevelToModuleObject(bytes32 object_id, address account, string module, enum IUserAccess.AccessLevel access_level) external
```

### getGroupModuleAccessLevel

```solidity
function getGroupModuleAccessLevel(string module, uint256 group_id) external view returns (uint256)
```

### getGroupObjectAccessLevel

```solidity
function getGroupObjectAccessLevel(string module, bytes32 object_id, uint256 group_id) external view returns (uint256)
```

### getMyModulesAccess

```solidity
function getMyModulesAccess() external view returns (string[], uint256[])
```

### checkAccess

```solidity
function checkAccess(address account, string module, bytes32 object_id, uint256 level) external view
```

### checkAccessModule

```solidity
function checkAccessModule(address account, string module, uint256 level) external view
```

