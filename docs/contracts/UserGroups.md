# Solidity API

## UserGroups

Handles creation and management of user groups within the system

_Implements group-based access control with hierarchical permissions_

### groups

```solidity
mapping(uint256 => struct IUserGroups.Group) groups
```

_Group data storage by group ID_

### users_group

```solidity
mapping(uint256 => address[]) users_group
```

_Group membership storage: group ID => member addresses_

### user_group_list

```solidity
mapping(address => uint256[]) user_group_list
```

_User-group associations: address => group IDs[]_

### groupIndex

```solidity
uint256 groupIndex
```

_Auto-incrementing group ID counter_

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
function initialize(uint256 _partner_id, address _hubContract) external
```

Initializes the contract with default sudo group

_Creates initial "sudo" group with contract owner as member_

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

### onlyUser

```solidity
modifier onlyUser()
```

Access control modifier requiring for check user exist

### addGroup

```solidity
function addGroup(string name) external
```

Creates a new user group

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| name | string | Display name for the new group |

### _addGroup

```solidity
function _addGroup(string name, address owner) internal
```

_Internal group creation mechanism_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| name | string | Group display name |
| owner | address | Initial group owner address |

### getMyGroups

```solidity
function getMyGroups() external view returns (struct IUserGroups.Group[])
```

Retrieves caller's associated groups

_Returns both owned and member groups for the caller_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct IUserGroups.Group[] | Group[] Array of group structures |

