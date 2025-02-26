# Solidity API

## IUser

_This interface defines the user-related structures and events._

### TypeUser

_Enum representing the type of user._

```solidity
enum TypeUser {
  DEFAULT,
  COMPANY
}
```

### User

_Struct representing a user._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct User {
  uint256 id;
  uint256 tg_id;
  string phone;
  string email;
  string first_name;
  string last_name;
  string language_code;
  enum IUser.TypeUser user_type;
  bool enable;
  uint256 last_updated;
}
```

### Company

_Struct representing company-specific information for a user._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct Company {
  string name;
  string description;
  string inn;
  string kpp;
  string ogrn;
  string bank_account;
  string bank_name;
  string bank_bik;
  string bank_corr_account;
  string bank_inn;
  string bank_kpp_account;
}
```

### CarData

_Struct representing data related to a car owned by a user._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct CarData {
  string brand;
  string model;
  uint8[] connectors;
}
```

### AddUser

```solidity
event AddUser(address account)
```

_Event emitted when a new user is added to the system._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address of the newly added user account. |

### getVersion

```solidity
function getVersion() external pure returns (string)
```

### addUser

```solidity
function addUser(address account) external returns (uint256)
```

### whoami

```solidity
function whoami() external view returns (struct IUser.User)
```

### getUser

```solidity
function getUser(address account) external view returns (struct IUser.User)
```

### addCar

```solidity
function addCar(address account, struct IUser.CarData car_data) external
```

### removeCar

```solidity
function removeCar(address account, uint256 _index) external
```

### getCars

```solidity
function getCars(address account) external view returns (struct IUser.CarData[])
```

### updateCompanyInfo

```solidity
function updateCompanyInfo(address account, struct IUser.Company company_data) external
```

### getCompanyInfo

```solidity
function getCompanyInfo(address account) external view returns (struct IUser.Company)
```

