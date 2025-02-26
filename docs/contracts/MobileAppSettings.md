# Solidity API

## MobileAppSettings

Manages configuration settings for mobile applications

_Upgradeable contract integrated with Hub ecosystem_

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

### config

```solidity
struct IMobileAppSettings.Config config
```

_Current configuration settings_

### initialize

```solidity
function initialize(uint256 _partner_id, address _hubContract) external
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

### access

```solidity
modifier access()
```

Access control modifier requiring GOD level privileges

### setConfig

```solidity
function setConfig(struct IMobileAppSettings.Config _config) external
```

Updates complete configuration settings

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _config | struct IMobileAppSettings.Config | New configuration structure |

### setTechnicalWork

```solidity
function setTechnicalWork(bool technical_work) external
```

Toggles technical work status

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| technical_work | bool | New technical work status |

### getConfig

```solidity
function getConfig() external view returns (struct IMobileAppSettings.Config)
```

Retrieves current configuration

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct IMobileAppSettings.Config | Config Current settings structure |

