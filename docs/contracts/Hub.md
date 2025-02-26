# Solidity API

## Hub

Central contract for managing partners and their modules

_Inherits upgradeable contract functionality and Ownable pattern_

### partners

```solidity
mapping(uint256 => struct IHub.Member) partners
```

_Storage for partner data mapped by partner ID_

### unique_idex

```solidity
mapping(bytes2 => mapping(bytes3 => uint256)) unique_idex
```

_Unique index for country_code + party_id combinations_

### owner_address_to_id

```solidity
mapping(address => uint256) owner_address_to_id
```

_Mapping of owner addresses to their partner ID_

### modules

```solidity
mapping(uint256 => mapping(string => address)) modules
```

_Partner modules mapped by name and partner ID_

### modules_list

```solidity
mapping(uint256 => string[]) modules_list
```

_List of module names for each partner_

### services

```solidity
mapping(string => address) services
```

_Registry of services by their name_

### deposit

```solidity
mapping(address => uint256) deposit
```

_Partner deposits mapped by their address_

### counter

```solidity
uint256 counter
```

_Counter for generating unique partner IDs_

### addPartnerAmount

```solidity
uint256 addPartnerAmount
```

_Required deposit amount for partner registration_

### getVersion

```solidity
function getVersion() external pure returns (string)
```

Returns contract version

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string | Contract version as string |

### initialize

```solidity
function initialize(struct IHub.addService[] _services) public
```

Initializes the contract

_Called instead of constructor for upgradeable contracts_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _services | struct IHub.addService[] | Array of services to initialize |

### getService

```solidity
function getService(string name) external view returns (address)
```

Gets service address by name

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| name | string | Service name |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | Address of the service contract |

### registerPartner

```solidity
function registerPartner(bytes32 name, bytes2 country_code, bytes3 party_id) external payable returns (uint256)
```

Registers new partner

_Requires deposit of addPartnerAmount_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| name | bytes32 | Partner name (min 3 characters) |
| country_code | bytes2 | 2-byte country code |
| party_id | bytes3 | 3-byte party identifier |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | Registered partner's ID |

### addModule

```solidity
function addModule(string name, address contractAddress) external
```

Adds new module for partner

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| name | string | Module name |
| contractAddress | address | Module contract address |

### changeModuleAddress

```solidity
function changeModuleAddress(string name, address contractAddress) external
```

Changes module address

_Requires partner privileges_

### getModule

```solidity
function getModule(string name, uint256 partner_id) external view returns (address)
```

Gets module address by name and partner ID

### checkModuleExist

```solidity
function checkModuleExist(string name, uint256 partner_id) external view returns (address)
```

Checks module existence

### getPartnerModules

```solidity
function getPartnerModules(uint256 partner_id) external view returns (string[])
```

Gets list of partner's modules

### getPartners

```solidity
function getPartners() external view returns (struct IHub.Member[])
```

Retrieves all partners

### me

```solidity
function me() external view returns (struct IHub.Member)
```

Gets current partner's information

### getPartnerByAddress

```solidity
function getPartnerByAddress(address partner_address) external view returns (struct IHub.Member)
```

Finds partner by wallet address

### getPartnerIdByAddress

```solidity
function getPartnerIdByAddress(address partner_address) external view returns (uint256)
```

Get partner id by wallet address

### getPartner

```solidity
function getPartner(uint256 partner_id) external view returns (struct IHub.Member)
```

Get partner data by partner_id

### getPartnerName

```solidity
function getPartnerName(uint256 partner_id) external view returns (bytes32)
```

Get partner name by partner_id

### getPartnerPartyId

```solidity
function getPartnerPartyId(uint256 partner_id) external view returns (bytes3)
```

Get partner party_id by partner_id

### getPartnerCountryCode

```solidity
function getPartnerCountryCode(uint256 partner_id) external view returns (bytes2)
```

Get partner country_code by partner_id

### _updateStatus

```solidity
function _updateStatus(uint256 id, enum IHub.ConnectionStatus status) internal
```

_Updates partner status (internal use only)_

### _updateRole

```solidity
function _updateRole(uint256 id, enum IHub.Roles[] role) internal
```

_Updates partner roles (internal use only)_

