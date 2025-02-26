# Solidity API

## IBaseErrors

Defines custom error types for access control, validation, and system constraints

_Provides detailed error messages for debugging and error handling_

### AddConnectorFirst

```solidity
error AddConnectorFirst()
```

Emitted when attempting to set status without adding connectors

_Raised when trying to mark an EVSE as available without connectors_

### AccessDenied

```solidity
error AccessDenied(string module)
```

Emitted when user lacks required access to a module

_Raised when account doesn't have sufficient permissions for the module_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| module | string | Name of the module where access was denied |

### AccessDeniedLevel

```solidity
error AccessDeniedLevel(string module, uint256 level)
```

Emitted when user lacks required access level

_Raised when account's access level is lower than required_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| module | string |  |
| level | uint256 | Actual access level of the caller |

### AccessDeniedObjectLevel

```solidity
error AccessDeniedObjectLevel(string module, bytes32 object, uint256 level)
```

Emitted when user lacks required access level for a specific object

_Raised when account doesn't have sufficient permissions for the object in the module_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| module | string | Name of the module where access was denied |
| object | bytes32 | Identifier of the object being accessed |
| level | uint256 | Required access level for the operation |

### BigOffset

```solidity
error BigOffset(uint256 offset)
```

Emitted when an offset exceeds valid bounds

_Raised during pagination or data retrieval when the offset is too large_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| offset | uint256 | Invalid offset value |

### FieldLenghtNoMore

```solidity
error FieldLenghtNoMore(string field, uint256 lenght)
```

Emitted when a field exceeds its maximum allowed length

_Raised during input validation for string or array fields_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| field | string | Name of the field with invalid length |
| lenght | uint256 | Maximum allowed length for the field |

### MaximumOfObject

```solidity
error MaximumOfObject(string object, uint256 maximum)
```

Emitted when the maximum limit for an object is exceeded

_Raised when attempting to create more instances than allowed_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| object | string | Name of the object type (e.g., "cards", "connectors") |
| maximum | uint256 | Maximum allowed number of objects |

### AlreadyExist

```solidity
error AlreadyExist(string object)
```

Emitted when attempting to create a duplicate object

_Raised when an object with the same identifier already exists_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| object | string | Name of the object type (e.g., "location", "EVSE") |

### AmountNotEnouth

```solidity
error AmountNotEnouth(uint256 required_amount)
```

Emitted when the provided amount is insufficient

_Raised during transactions or payments_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| required_amount | uint256 | Minimum required amount |

### ModuleNotFound

```solidity
error ModuleNotFound(string module)
```

Emitted when a referenced module is not found

_Raised when attempting to access a non-registered module_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| module | string | Name of the missing module |

### ObjectNotFound

```solidity
error ObjectNotFound(string object, uint256 object_id)
```

Emitted when a referenced object is not found

_Raised when attempting to access a non-registered object_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| object | string | Name of the object type (e.g., "location", "connector") |
| object_id | uint256 | ID of the missing object |

### InsufficientBalance

```solidity
error InsufficientBalance()
```

Emitted when an account has insufficient balance

_Raised during transfers or withdrawals_

### InvalidReceiver

```solidity
error InvalidReceiver(address reciver)
```

Emitted when an invalid receiver address is provided

_Raised during transfers to zero address or invalid addresses_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| reciver | address | Invalid receiver address |

### InvalidSender

```solidity
error InvalidSender(address sender)
```

Emitted when an invalid sender address is provided

_Raised during transfers from zero address or invalid addresses_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| sender | address | Invalid sender address |

