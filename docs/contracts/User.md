# Solidity API

## User

Handles user profiles, car data, and company information

_Manages user data storage and access control for user-related operations_

### users

```solidity
mapping(address => struct IUser.User) users
```

_User profile storage_

### user_company_data

```solidity
mapping(address => struct IUser.Company) user_company_data
```

_Company information storage_

### user_cars

```solidity
mapping(address => struct IUser.CarData[]) user_cars
```

_User car data storage_

### usersIndex

```solidity
uint256 usersIndex
```

_Auto-incrementing user ID counter_

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

### getVersion

```solidity
function getVersion() external pure returns (string)
```

Returns the current contract version

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string | string Contract version identifier |

### onlyAdmin

```solidity
modifier onlyAdmin()
```

### initialize

```solidity
function initialize(uint256 _partner_id, address _hubContract) external
```

Initializes the contract with Hub connection

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _partner_id | uint256 | Partner ID from Hub registry |
| _hubContract | address | Address of Hub contract |

### addUser

```solidity
function addUser(address account) external returns (uint256)
```

Adds a new user to the system

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | Address of the user to add |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint256 New user ID |

### whoami

```solidity
function whoami() external view returns (struct IUser.User)
```

Retrieves the caller's user profile

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct IUser.User | IUser.User User profile data |

### exist

```solidity
function exist(address account) public view
```

Checks if a user exists by address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | Address of the user to check |

### _exist

```solidity
modifier _exist()
```

Access control modifier requiring user existence

### getUser

```solidity
function getUser(address account) external view returns (struct IUser.User)
```

Retrieves user profile by address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | Address of the user to query |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct IUser.User | IUser.User User profile data |

### _updateData

```solidity
function _updateData(address account, string first_name, string last_name, string language_code) internal
```

_Internal function to update user profile data_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | Address of the user to update |
| first_name | string | User's first name |
| last_name | string | User's last name |
| language_code | string | Preferred language code |

### setPhone

```solidity
function setPhone(address account, string phone) external
```

Sets user phone number

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | Address of the user to update |
| phone | string | Phone number to set |

### setEmail

```solidity
function setEmail(address account, string email) external
```

Sets user email address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | Address of the user to update |
| email | string | Email address to set |

### setTgId

```solidity
function setTgId(address account, string tg_id) external
```

Sets user tg_id

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | Address of the user to update |
| tg_id | string | Telegram id to set |

### updateBaseData

```solidity
function updateBaseData(address account, string first_name, string last_name, string language_code) external
```

Updates user profile data

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | Address of the user to update |
| first_name | string | User's first name |
| last_name | string | User's last name |
| language_code | string | Preferred language code |

### addCar

```solidity
function addCar(address account, struct IUser.CarData car_data) external
```

Adds a car to a user's profile

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | Address of the user to update |
| car_data | struct IUser.CarData | Car data structure to add |

### _removeCar

```solidity
function _removeCar(address account, uint256 _index) internal
```

_Internal function to remove a car from a user's profile_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | Address of the user to update |
| _index | uint256 | Index of the car to remove |

### removeCar

```solidity
function removeCar(address account, uint256 _index) external
```

Removes a car from a user's profile

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | Address of the user to update |
| _index | uint256 | Index of the car to remove |

### getCars

```solidity
function getCars(address account) external view returns (struct IUser.CarData[])
```

Retrieves a user's car data

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | Address of the user to query |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct IUser.CarData[] | CarData[] Array of car data structures |

### updateCompanyInfo

```solidity
function updateCompanyInfo(address account, struct IUser.Company company_data) external
```

Updates company information for a user

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | Address of the user to update |
| company_data | struct IUser.Company | Company data structure to set |

### getCompanyInfo

```solidity
function getCompanyInfo(address account) external view returns (struct IUser.Company)
```

Retrieves company information for a user

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | Address of the user to query |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct IUser.Company | Company Company data structure |

