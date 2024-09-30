// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

interface DataTypesLocation {

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

    enum EVSEStatus {
        None,
        Available,
        Unavailable,
        Planned,
        Removed,
        Blocked,
        Maintance
    }

    enum ConnectorFormat {
        None,
        Socket,
        Cable
    }

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

    enum ParkingRestriction {
        None,
        EvOnly,
        Plugged,
        Disabled,
        Customers,
        Motorcycles
    }

    enum ParkingType {
        None,
        AlongMotorway,
        ParkingGarage,
        ParkingLot,
        OnDriveway,
        OnStreet,
        UndergroundGarage
    }

    enum PowerType {
        None,
        AC_1_PHASE,
        AC_2_PHASE,
        AC_2_PHASE_SPLIT,
        AC_3_PHASE,
        DC
    }

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

    enum ImageType {
        None,
        JPG,
        PNG,
        GIF,
        SVG
    }

    struct AdditionalGeoLocation {
        int256 latitude;
        int256 longtitude;
        DisplayText[] name;
    }

    struct BusinessDetails {
        string name;
        string website;
        Image logo;
    }


    struct Directions {
        string lang;
        string text;
    }

    struct StatusSchedule{
        uint256 begin;
        uint256 end;
        EVSEStatus status;
    }

    struct Image {
        string url;
        string thumbnail;
        ImageCategory category;
        ImageType _type;
        uint16 width;
        uint16 height;
    }

    struct ExceptionalPeriod {
        uint256 begin;
        uint256 end;
    }


    struct Hours {
        bool twentyfourseven;
        RegularHours[] regular_hours;
        ExceptionalPeriod[] exceptional_openings;
        ExceptionalPeriod[] exceptional_closings;
    }



    struct RegularHours {
        int week_day;
        string period_begin;
        string period_end;
    }

    struct DisplayText {
        string language;
        string text;
    }


   
    struct GeoLocation {
        int256 latitude;
        int256 longtitude;
    }



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

    struct EVSE {
        uint256 uid;
        string evse_id;
        bytes2 label;
        EVSEStatus status;
        StatusSchedule[] status_schedule;
        Capabilities[] capabilities;
        Connector[] connectors;
        bytes4 floor_level;
        GeoLocation coordinates;
        bytes16 physical_reference;
        DisplayText[] directions;
        ParkingRestriction[] parking_restrictions;
        Image[] images;
        uint256 location_id;
        uint256 sync_id;
        uint256 last_updated;
    }

    struct Connector {
        bytes32 id;
        ConnectorTypes standard;
        ConnectorFormat format;
        PowerType power_type;
        int16 max_voltage;
        int16 max_amperage;
        int16 max_electric_power;
        bytes32[] tariff_ids;
        string terms_and_conditions; // url
        uint256 partner_id;
        uint256 location_id;
        uint256 evse_id;
        uint256 sync_id;
        uint256 last_updated;
        ConnectorStatus status;
    }
}

