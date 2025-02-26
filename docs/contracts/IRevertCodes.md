# Solidity API

## IRevertCodes

### Output

```solidity
struct Output {
  string code;
  string message;
}
```

### UpdateLocales

```solidity
struct UpdateLocales {
  string lang;
  string code;
  string message;
}
```

### getRevertMessages

```solidity
function getRevertMessages(string module, string lang) external view returns (struct IRevertCodes.Output[] output)
```

### updateLocale

```solidity
function updateLocale(string module, struct IRevertCodes.UpdateLocales[] update_locales) external
```

### registerRevertCode

```solidity
function registerRevertCode(string module, string code, string message) external
```

### panic

```solidity
function panic(string module, string code) external
```

