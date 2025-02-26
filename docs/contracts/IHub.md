# Solidity API

## IHub

Core interface for Partner Management System

_Defines data structures and events for Hub contract ecosystem_

### Roles

Enumeration of available system roles

```solidity
enum Roles {
  None,
  CPO,
  EMSP,
  HUB,
  NSP,
  SCSP
}
```

### Modules

Enumeration of available functional modules

```solidity
enum Modules {
  None,
  Location,
  Users,
  ChargingProfiles,
  Commands,
  Credentials
}
```

### ConnectionStatus

Enumeration of partner connection states

```solidity
enum ConnectionStatus {
  None,
  CONNECTED,
  OFFLINE,
  PLANNED,
  SUSPENDED
}
```

### Member

Contains complete partner profile data

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct Member {
  uint256 id;
  bytes2 country_code;
  bytes3 party_id;
  bytes32 name;
  enum IHub.Roles[] role;
  enum IHub.ConnectionStatus status;
  address owner_address;
  uint256 last_updated;
}
```

### addService

Structure for initial service registration

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct addService {
  string name;
  address contract_address;
}
```

### AddPartner

```solidity
event AddPartner(uint256 id, bytes2 country_code, bytes3 party_id, address owner_address)
```

Emitted when new partner joins the network

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | uint256 | Assigned partner ID |
| country_code | bytes2 | 2-byte country designation |
| party_id | bytes3 | 3-byte organization identifier |
| owner_address | address | Control wallet address |

### getVersion

```solidity
function getVersion() external pure returns (string)
```

### registerPartner

```solidity
function registerPartner(bytes32 name, bytes2 country_code, bytes3 party_id) external payable returns (uint256)
```

### addModule

```solidity
function addModule(string name, address contractAddress) external
```

### changeModuleAddress

```solidity
function changeModuleAddress(string name, address contractAddress) external
```

### getService

```solidity
function getService(string name) external view returns (address)
```

### getModule

```solidity
function getModule(string name, uint256 partner_id) external view returns (address)
```

### checkModuleExist

```solidity
function checkModuleExist(string name, uint256 partner_id) external view returns (address)
```

### getPartnerModules

```solidity
function getPartnerModules(uint256 partner_id) external view returns (string[])
```

### getPartners

```solidity
function getPartners() external view returns (struct IHub.Member[])
```

### me

```solidity
function me() external view returns (struct IHub.Member)
```

### getPartnerByAddress

```solidity
function getPartnerByAddress(address partner_address) external view returns (struct IHub.Member)
```

### getPartnerIdByAddress

```solidity
function getPartnerIdByAddress(address partner_address) external view returns (uint256)
```

### getPartner

```solidity
function getPartner(uint256 partner_id) external view returns (struct IHub.Member)
```

### getPartnerName

```solidity
function getPartnerName(uint256 partner_id) external view returns (bytes32)
```

### getPartnerPartyId

```solidity
function getPartnerPartyId(uint256 partner_id) external view returns (bytes3)
```

### getPartnerCountryCode

```solidity
function getPartnerCountryCode(uint256 partner_id) external view returns (bytes2)
```

