# Solidity API

## IUserGroups

Defines the data structures and error handling for group management

_Inherits from IBaseErrors for standardized error handling_

### Group

Represents a user group within the system

_Groups are used to organize users and manage permissions collectively_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct Group {
  uint256 id;
  string name;
  address owner;
  bool deleted;
}
```

### getVersion

```solidity
function getVersion() external pure returns (string)
```

### addGroup

```solidity
function addGroup(string name) external
```

### getMyGroups

```solidity
function getMyGroups() external view returns (struct IUserGroups.Group[])
```

