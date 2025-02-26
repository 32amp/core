# Solidity API

## ITariff

Defines tariff structures and enumerations for charging systems

_Inherits data types and error handling from DataTypes and IBaseErrors_

### DayOfWeek

Represents days for tariff restrictions

_None = 0, Weekdays follow standard order_

```solidity
enum DayOfWeek {
  None,
  MONDAY,
  TUESDAY,
  WEDNESDAY,
  THURSDAY,
  FRIDAY,
  SATURDAY,
  SUNDAY
}
```

### TariffDimensionType

Defines different tariff calculation methods

```solidity
enum TariffDimensionType {
  ENERGY,
  FLAT,
  PARKING_TIME,
  TIME
}
```

### ReservationRestrictionType

Defines reservation-related tariff limitations

```solidity
enum ReservationRestrictionType {
  None,
  RESERVATION,
  RESERVATION_EXPIRES
}
```

### Output

Contains full tariff details with all components

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct Output {
  bytes2 country_code;
  bytes3 party_id;
  uint256 id;
  uint256 last_updated;
  struct ITariff.Tariff tariff;
  struct DataTypes.Price min_price;
  struct DataTypes.Price max_price;
  uint256 start_date_time;
  uint256 end_date_time;
  struct DataTypes.EnergyMix energy_mix;
}
```

### OutputLight

Contains basic tariff information

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct OutputLight {
  uint256 id;
  struct ITariff.Tariff tariff;
}
```

### Tariff

Contains complete tariff configuration

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct Tariff {
  uint256 currency;
  string tariff_alt_url;
  struct DataTypes.DisplayText[] tariff_alt_text;
  struct ITariff.TariffElement[] elements;
}
```

### PriceComponent

Defines pricing parameters for tariff dimensions

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct PriceComponent {
  enum ITariff.TariffDimensionType _type;
  uint256 price;
  uint8 vat;
  uint256 step_size;
}
```

### TariffRestrictions

Defines temporal and quantitative limitations

_All time values use 24-hour format_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct TariffRestrictions {
  int16 start_time_hour;
  int16 start_time_minute;
  int16 end_time_hour;
  int16 end_time_minute;
  int256 start_date;
  int256 end_date;
  uint32 min_kwh;
  uint32 max_kwh;
  uint32 min_current;
  uint32 max_current;
  uint32 min_power;
  uint32 max_power;
  uint32 min_duration;
  uint32 max_duration;
  enum ITariff.DayOfWeek[] day_of_week;
  enum ITariff.ReservationRestrictionType reservation;
}
```

### TariffElement

Combines pricing components with restrictions

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct TariffElement {
  struct ITariff.TariffRestrictions restrictions;
  struct ITariff.PriceComponent[] price_components;
}
```

### AddTariff

```solidity
event AddTariff(uint256 uid, uint256 partner_id, address account)
```

Emitted when new tariff is added

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| uid | uint256 | New tariff ID |
| partner_id | uint256 | Hub-registered operator ID |
| account | address | Creator's wallet address |

### getVersion

```solidity
function getVersion() external pure returns (string)
```

### exist

```solidity
function exist(uint256 id) external returns (bool)
```

### add

```solidity
function add(struct ITariff.Tariff tariff) external
```

### setMinPrice

```solidity
function setMinPrice(uint256 id, struct DataTypes.Price _min_price) external
```

### setMaxPrice

```solidity
function setMaxPrice(uint256 id, struct DataTypes.Price _max_price) external
```

### setStartDateTime

```solidity
function setStartDateTime(uint256 id, uint256 _start_date_time) external
```

### setEndDateTime

```solidity
function setEndDateTime(uint256 id, uint256 _end_date_time) external
```

### setEnergyMix

```solidity
function setEnergyMix(uint256 id, struct DataTypes.EnergyMix _energy_mix) external
```

### get

```solidity
function get(uint256 id) external view returns (struct ITariff.Output)
```

### getLight

```solidity
function getLight(uint256 id) external view returns (struct ITariff.OutputLight)
```

