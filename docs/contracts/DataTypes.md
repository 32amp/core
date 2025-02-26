# Solidity API

## DataTypes

_Comprehensive interface for electric vehicle charging infrastructure management system
Contains all data types required to describe charging stations, their specifications, and related entities_

### ConnectorTypes

Charging connector types

_Complete list of standardized and proprietary connector types_

```solidity
enum ConnectorTypes {
  None,
  Type1,
  Type2,
  Chademo,
  CCS1,
  CCS2,
  GBTDC,
  GBTAC,
  DOMESTIC_A,
  DOMESTIC_B,
  DOMESTIC_C,
  DOMESTIC_D,
  DOMESTIC_E,
  DOMESTIC_F,
  DOMESTIC_G,
  DOMESTIC_H,
  DOMESTIC_I,
  DOMESTIC_J,
  DOMESTIC_K,
  DOMESTIC_L,
  DOMESTIC_M,
  DOMESTIC_N,
  DOMESTIC_O,
  IEC_60309_2_single_16,
  IEC_60309_2_three_16,
  IEC_60309_2_three_32,
  IEC_60309_2_three_64,
  IEC_62196_T3A,
  NEMA_5_20,
  NEMA_6_30,
  NEMA_6_50,
  NEMA_10_30,
  NEMA_10_50,
  NEMA_14_30,
  NEMA_14_50,
  PANTOGRAPH_BOTTOM_UP,
  PANTOGRAPH_TOP_DOWN,
  TSL
}
```

### ConnectorErrors

Charging equipment error codes

_Detailed fault statuses for diagnostics_

```solidity
enum ConnectorErrors {
  None,
  ConnectorLockFailure,
  EVCommunicationError,
  GroundFailure,
  HighTemperature,
  InternalError,
  LocalListConflict,
  NoError,
  OtherError,
  OverCurrentFailure,
  PowerMeterFailure,
  PowerSwitchFailure,
  ReaderFailure,
  ResetFailure,
  UnderVoltage,
  OverVoltage,
  WeakSignal,
  PowerModuleFailure,
  EmergencyButtonPressed
}
```

### ConnectorStatus

Charging connector statuses

_States according to OCPP 2.0.1 standard_

```solidity
enum ConnectorStatus {
  None,
  Available,
  Preparing,
  Charging,
  SuspendedEVSE,
  SuspendedEV,
  Finishing,
  Reserved,
  Unavailable,
  Faulted
}
```

### EVSEStatus

EVSE (Electric Vehicle Supply Equipment) statuses

```solidity
enum EVSEStatus {
  None,
  Available,
  Unavailable,
  Planned,
  Removed,
  Blocked,
  Maintenance
}
```

### ConnectorFormat

Physical connection format

```solidity
enum ConnectorFormat {
  None,
  Socket,
  Cable
}
```

### Facility

Infrastructure facility types

```solidity
enum Facility {
  None,
  Hotel,
  Restaurant,
  Cafe,
  Mall,
  Supermarket,
  Sport,
  RecreationArea,
  Nature,
  Museum,
  BikeSharing,
  BusStop,
  TaxiStand,
  TramStop,
  MetroStation,
  TrainStation,
  Airport,
  ParkingLot,
  CarpoolParking,
  FuelStation,
  Wifi
}
```

### ImageCategory

Image categorization

```solidity
enum ImageCategory {
  None,
  Charger,
  Entrance,
  Location,
  Network,
  Operator,
  Other,
  Owner
}
```

### ParkingRestriction

Parking restrictions

```solidity
enum ParkingRestriction {
  None,
  EvOnly,
  Plugged,
  Disabled,
  Customers,
  Motorcycles
}
```

### ParkingType

Parking facility types

```solidity
enum ParkingType {
  None,
  AlongMotorway,
  ParkingGarage,
  ParkingLot,
  OnDriveway,
  OnStreet,
  UndergroundGarage
}
```

### PowerType

Electrical power types

```solidity
enum PowerType {
  None,
  AC_1_PHASE,
  AC_2_PHASE,
  AC_2_PHASE_SPLIT,
  AC_3_PHASE,
  DC
}
```

### Capabilities

EVSE capabilities

```solidity
enum Capabilities {
  ChargingProfileCapable,
  ChargingPreferencesCapable,
  ChipCardSupport,
  ContactlessCardSupport,
  CreditCardPayable,
  DebitCardPayable,
  PedTerminal,
  RemoteStartStopCapable,
  Reservable,
  RfidReader,
  StartSessionConnectorRequired,
  TokenGroupCapable,
  UnlockCapable
}
```

### ImageType

Supported image formats

```solidity
enum ImageType {
  None,
  JPG,
  PNG,
  GIF,
  SVG
}
```

### FileType

Document file types

```solidity
enum FileType {
  None,
  JSON,
  HTML,
  PDF,
  CSV,
  XLSX,
  XLS,
  DOC,
  DOCX,
  JPG,
  PNG,
  GIF,
  SVG
}
```

### EnergySourceCategory

Energy generation sources

```solidity
enum EnergySourceCategory {
  None,
  NUCLEAR,
  GENERAL_FOSSIL,
  COAL,
  GAS,
  GENERAL_GREEN,
  SOLAR,
  WIND,
  WATER
}
```

### EnvironmentalImpactCategory

Environmental impact categories

```solidity
enum EnvironmentalImpactCategory {
  None,
  NUCLEAR_WASTE,
  CARBON_DIOXIDE
}
```

### EnergySource

Energy source composition

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct EnergySource {
  enum DataTypes.EnergySourceCategory source;
  uint8 percentage;
}
```

### EnvironmentalImpact

Environmental impact metrics

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct EnvironmentalImpact {
  enum DataTypes.EnvironmentalImpactCategory category;
  uint256 amount;
}
```

### EnergyMix

Energy supply composition

_Compliant with ISO 14068_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct EnergyMix {
  bool is_green_energy;
  struct DataTypes.EnergySource[] energy_sources;
  struct DataTypes.EnvironmentalImpact[] environ_impact;
  string supplier_name;
  string energy_product_name;
}
```

### Price

Pricing information

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct Price {
  uint256 excl_vat;
  uint256 incl_vat;
}
```

### AdditionalGeoLocation

Supplemental coordinates

_For complex locations with multiple access points_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct AdditionalGeoLocation {
  int256 latitude;
  int256 longtitude;
  struct DataTypes.DisplayText[] name;
}
```

### BusinessDetails

Business entity details

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct BusinessDetails {
  string name;
  string website;
  struct DataTypes.Image logo;
}
```

### Directions

Localized navigation instructions

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct Directions {
  string lang;
  string text;
}
```

### StatusSchedule

Status change schedule

_For maintenance planning_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct StatusSchedule {
  uint256 begin;
  uint256 end;
  enum DataTypes.EVSEStatus status;
}
```

### Image

Image metadata

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct Image {
  string url;
  string ipfs_cid;
  enum DataTypes.ImageCategory category;
  enum DataTypes.ImageType _type;
  uint16 width;
  uint16 height;
}
```

### File

Document file reference

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct File {
  string name_file;
  string ipfs_cid;
  enum DataTypes.FileType file_type;
}
```

### ExceptionalPeriod

Exceptional time period

_For special operating hours_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct ExceptionalPeriod {
  uint256 begin;
  uint256 end;
}
```

### Hours

Operating hours configuration

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct Hours {
  bool twentyfourseven;
  struct DataTypes.RegularHours[] regular_hours;
  struct DataTypes.ExceptionalPeriod[] exceptional_openings;
  struct DataTypes.ExceptionalPeriod[] exceptional_closings;
}
```

### RegularHours

Recurring weekly schedule

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct RegularHours {
  int256 week_day;
  string period_begin;
  string period_end;
}
```

### DisplayText

Localized text content

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct DisplayText {
  string language;
  string text;
}
```

### GeoLocation

Geographic coordinates

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct GeoLocation {
  int256 latitude;
  int256 longtitude;
}
```

### Location

Complete location description

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct Location {
  uint256 uid;
  bytes2 country_code;
  bytes3 party_id;
  bool publish;
  uint32[] publish_allowed_to;
  string name;
  string _address;
  bytes32 city;
  bytes32 postal_code;
  bytes32 state;
  bytes32 country;
  struct DataTypes.GeoLocation coordinates;
  enum DataTypes.ParkingType parking_type;
  uint256[] evses;
  uint256 operator;
  address owner;
  enum DataTypes.Facility[] facilities;
  string time_zone;
  bool charging_when_closed;
  uint256 last_updated;
}
```

### EVSE

EVSE unit description

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct EVSE {
  string evse_id;
  uint256 evse_model;
  bytes32 physical_reference;
  struct DataTypes.DisplayText[] directions;
}
```

### Connector

Technical connector specifications

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct Connector {
  enum DataTypes.ConnectorTypes standard;
  enum DataTypes.ConnectorFormat format;
  enum DataTypes.PowerType power_type;
  int16 max_voltage;
  int16 max_amperage;
  int16 max_electric_power;
  string terms_and_conditions_url;
}
```

