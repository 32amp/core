# DataTypes

Общий интерфейс со структурами данных который используется контрактами Location, EVSE, Connector.


## Структуры данных

#### enum ConnectorTypes
---
Список типов коннекторов для зарядной станции

```
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
#### enum ConnectorErrors
---

Список возможных ошибок у коннектора зарядной станции

```
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
        WeakSignalint,
        PowerModuleFailure,
        EmergencyButtonPressed
    }
```

#### enum ConnectorStatus
---

Список возможных статусов у коннектора зарядной станции

```
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

#### enum EVSEStatus
---

Список статусов зарядной станции

```
    enum EVSEStatus {
        None,
        Available,
        Unavailable,
        Planned,
        Removed,
        Blocked,
        Maintance
    }
```
#### enum ConnectorFormat
---

Форма коннектора у зарядной станции

```
    enum ConnectorFormat {
        None,
        Socket,
        Cable
    }
```

#### enum Facility
---
Используется модулем Location для перечисления того что есть рядом

```
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

#### enum ImageCategory
---
Категория изображения

```
    enum ImageCategory {
        None,
        Charger,
        Enterence,
        Location,
        Network,
        Operator,
        Other,
        Owner
    }
```

#### enum ParkingRestriction
---

Используется контрактом EVSE для обозначения кто может парковаться у зарядной станции

```
    enum ParkingRestriction {
        None,
        EvOnly,
        Plugged,
        Disabled,
        Customers,
        Motorcycles
    }
```

#### enum ParkingType
---
Тип парковки 

```
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

#### enum PowerType
---

Тип коннектора у зарядной станции

```
    enum PowerType {
        None,
        AC_1_PHASE,
        AC_2_PHASE,
        AC_2_PHASE_SPLIT,
        AC_3_PHASE,
        DC
    }
```

#### enum Capabilities
---
Совместимость у конкретной зарядной станции.

```
    enum Capabilities {
        ChargingProfileCapabile,
        ChargingPreferencesCcapabale,
        ChipCardSupport,
        ContactlesCardSupport,
        CreditCardPayble,
        DebitCardPayble,
        PedTerminal,
        RemoteStartStopCapable,
        Reservable,
        RfidReader,
        StartSessionConnectorRequired,
        TokenGroupCapable,
        UnlockCapable
    }
```

#### enum ImageType
---
Тип изображения

```
    enum ImageType {
        None,
        JPG,
        PNG,
        GIF,
        SVG
    }
```

#### enum EnergySourceCategory
---

Категория источника энергии


```
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

#### enum EnvironmentalImpactCategory
---

Категория воздействия на окружающую среду

```
    enum EnvironmentalImpactCategory {
        None,
        NUCLEAR_WASTE,
        CARBON_DIOXIDE
    }
```

#### struct EnergySource
---
Источник энергии, основная структура

```
    struct EnergySource {
        EnergySourceCategory source;
        uint8 percentage;
    }
```

#### struct EnvironmentalImpact
---

Воздействие на окружающую среду, основная стрктура

```
    struct EnvironmentalImpact {
        EnvironmentalImpactCategory category;
        uint256 amount; 
    }
```

#### struct EnergyMix 
---
Структура указывающая на то какие источники энергии используются

```
    struct EnergyMix {
        bool is_green_energy;
        EnergySource[] energy_sources;
        EnvironmentalImpact[] environ_impact;
        string supplier_name;
        string energy_product_name;
    }
```


#### struct Price
---

Цена с ндс и без, используется в тарифах

```
    struct Price {
        uint256 excl_vat;
        uint256 incl_vat;
    }
```

#### struct AdditionalGeoLocation
---
Дополнительная локация, нужна для обозначения дополнительных точек на карте в любых целях.

```
    struct AdditionalGeoLocation {
        int256 latitude;
        int256 longtitude;
        DisplayText[] name;
    }
```

#### struct BusinessDetails
---
Структура детализации бизнеса у конкретной зарядной станции

```
    struct BusinessDetails {
        string name;
        string website;
        Image logo;
    }
```


#### struct Directions
---
Описание на конкретном языке

```
    struct Directions {
        string lang;
        string text;
    }
```

#### struct StatusSchedule
---
Запланированный статус у зарядной станции, допустим для проведения ремонтных работ.

```
    struct StatusSchedule {
        uint256 begin;
        uint256 end;
        EVSEStatus status;
    }
```

#### struct Image
---

Изображение 

```
    struct Image {
        string url;
        string thumbnail_ipfs;
        ImageCategory category;
        ImageType _type;
        uint16 width;
        uint16 height;
    }
```

#### struct ExceptionalPeriod
---
Структура, используемая в структуре Hours, обозначает исключение конкретного периода времени

```
    struct ExceptionalPeriod {
        uint256 begin;
        uint256 end;
    }
```

#### struct Hours
---
Часы работы локации

```
    struct Hours {
        bool twentyfourseven;
        RegularHours[] regular_hours;
        ExceptionalPeriod[] exceptional_openings;
        ExceptionalPeriod[] exceptional_closings;
    }
```

#### struct RegularHours
---
Структура, используемая в структуре Hours, обозначает день недели и период работы

```
    struct RegularHours {
        int week_day;
        string period_begin;
        string period_end;
    }
```

#### struct DisplayText
---

Текст отображения на разных языках

```
    struct DisplayText {
        string language;
        string text;
    }
```

#### struct GeoLocation
---
Геоданные для локации или зарядной станции

```
    struct GeoLocation {
        int256 latitude;
        int256 longtitude;
    }
```

#### struct Location
---

Основная структура локации

```
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
        GeoLocation coordinates;
        ParkingType parking_type;
        uint256[] evses;
        uint256 operator;
        uint256 owner;
        Facility[] facilities;
        string time_zone;
        bool charging_when_closed;
        uint256 last_updated;
    }
```

#### struct EVSE
---
Основная структура зарядной станции

```
    struct EVSE {
        string evse_id; 
        uint256 evse_model;
        bytes32 physical_reference;
        DisplayText[] directions;
    }
```

#### struct Connector
---
Основная структура коннектора зарядной станции
```
    struct Connector {
        ConnectorTypes standard;
        ConnectorFormat format;
        PowerType power_type;
        int16 max_voltage;
        int16 max_amperage;
        int16 max_electric_power;
        string terms_and_conditions_url;
    }
```