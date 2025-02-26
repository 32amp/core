# Solidity API

## IMobileAppSettings

Defines data structures for mobile application configuration

_Inherits common data types from DataTypes interface_

### Config

Structure containing mobile app settings and legal documents

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct Config {
  struct DataTypes.File privacy_policy;
  struct DataTypes.File license_agreement;
  bool technical_work;
  string support_phone;
}
```

### getVersion

```solidity
function getVersion() external pure returns (string)
```

### setConfig

```solidity
function setConfig(struct IMobileAppSettings.Config) external
```

### setTechnicalWork

```solidity
function setTechnicalWork(bool technical_work) external
```

### getConfig

```solidity
function getConfig() external view returns (struct IMobileAppSettings.Config)
```

