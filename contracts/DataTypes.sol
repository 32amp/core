// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title DataTypes
 * @dev Comprehensive interface for electric vehicle charging infrastructure management system
 * Contains all data types required to describe charging stations, their specifications, and related entities
 */
interface DataTypes {

    /// @notice Charging connector types
    /// @dev Complete list of standardized and proprietary connector types
    enum ConnectorTypes {
        None,               // Undefined type
        Type1,              // SAE J1772-2009 (Yazaki) - 1-phase AC (up to 80A)
        Type2,              // IEC 62196-2 (Mennekes) - 3-phase AC (up to 63A)
        Chademo,            // Japanese DC fast charging standard (up to 200A)
        CCS1,               // Combined Charging System Type 1 (Combo 1) - DC + Type1 AC
        CCS2,               // Combined Charging System Type 2 (Combo 2) - DC + Type2 AC
        GBTDC,              // Chinese GB/T 20234.3 DC charging standard
        GBTAC,              // Chinese GB/T 20234.2 AC charging standard
        DOMESTIC_A,         // Country-specific domestic connectors (see regional documentation)
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
        IEC_60309_2_single_16,  // IEC 60309-2 industrial 16A 1-phase connector
        IEC_60309_2_three_16,   // IEC 60309-2 industrial 16A 3-phase connector
        IEC_60309_2_three_32,   // IEC 60309-2 industrial 32A 3-phase connector
        IEC_60309_2_three_64,   // IEC 60309-2 industrial 64A 3-phase connector
        IEC_62196_T3A,          // IEC 62196 Type 3A standard
        NEMA_5_20,              // North American 120V 20A connector
        NEMA_6_30,              // North American 240V 30A connector
        NEMA_6_50,              // North American 240V 50A connector
        NEMA_10_30,             // North American 3-wire 240V 30A
        NEMA_10_50,             // North American 3-wire 240V 50A
        NEMA_14_30,             // North American 4-wire 240V 30A
        NEMA_14_50,             // North American 4-wire 240V 50A
        PANTOGRAPH_BOTTOM_UP,   // Bottom-up pantograph connector (bus charging)
        PANTOGRAPH_TOP_DOWN,    // Top-down pantograph connector
        TSL                     // Tesla Supercharger proprietary connector
    }

    /// @notice Charging equipment error codes
    /// @dev Detailed fault statuses for diagnostics
    enum ConnectorErrors {
        None,                   // No errors
        ConnectorLockFailure,   // Connector locking mechanism failure
        EVCommunicationError,   // Vehicle communication error (PLC/ISO 15118)
        GroundFailure,          // Ground circuit fault
        HighTemperature,        // Overheating (>85°C)
        InternalError,          // Controller internal error
        LocalListConflict,      // Local authorization list conflict
        NoError,                // Normal operation (error reset)
        OtherError,             // Unspecified error
        OverCurrentFailure,     // Current overflow
        PowerMeterFailure,      // Energy meter malfunction
        PowerSwitchFailure,     // Power relay failure
        ReaderFailure,          // RFID/NFC module error
        ResetFailure,           // Reset failure
        UnderVoltage,           // Low input voltage
        OverVoltage,            // High input voltage
        WeakSignal,             // Weak communication signal
        PowerModuleFailure,     // Power module failure
        EmergencyButtonPressed  // Emergency stop activated
    }

    /// @notice Charging connector statuses
    /// @dev States according to OCPP 2.0.1 standard
    enum ConnectorStatus {
        None,           // Undefined status
        Available,      // Ready for use
        Occupied,
        Reserved,       // Reserved state
        Unavailable,    // Out of service
        Faulted         // Fault condition
    }

    /// @notice EVSE (Electric Vehicle Supply Equipment) statuses
    enum EVSEStatus {
        None,           // Undefined status
        Available,      // Operational
        Unavailable,    // Temporarily inactive
        Planned,        // Installation planned
        Removed,        // Decommissioned
        Blocked,        // Physically blocked
        Maintenance     // Under maintenance
    }

    /// @notice Physical connection format
    enum ConnectorFormat {
        None,   // Undefined
        Socket, // Socket (requires user cable)
        Cable   // Attached cable
    }

    /// @notice Infrastructure facility types
    enum Facility {
        None,               // Undefined
        Hotel,              // Hotel accommodation
        Restaurant,         // Dining establishment
        Cafe,               // Coffee shop
        Mall,               // Shopping mall
        Supermarket,        // Grocery store
        Sport,              // Sports facility
        RecreationArea,     // Leisure area
        Nature,             // Natural reserve
        Museum,             // Museum institution
        BikeSharing,        // Bicycle rental
        BusStop,            // Bus station
        TaxiStand,          // Taxi rank
        TramStop,           // Tram station
        MetroStation,       // Subway station
        TrainStation,       // Railway station
        Airport,            // Airport complex
        ParkingLot,         // Parking area
        CarpoolParking,     // Carpool parking
        FuelStation,        // Gasoline station
        Wifi                // Wireless internet zone
    }

    /// @notice Image categorization
    enum ImageCategory {
        None,       // Undefined
        Charger,    // Charging equipment photo
        Entrance,   // Location entrance
        Location,   // Site overview
        Network,    // Network logo
        Operator,   // Operator branding
        Other,      // Miscellaneous
        Owner       // Ownership documentation
    }

    /// @notice Parking restrictions
    enum ParkingRestriction {
        None,           // No restrictions
        EvOnly,         // Electric vehicles only
        Plugged,        // Must be charging
        Disabled,       // Accessible parking
        Customers,      // Patron-only
        Motorcycles     // Two-wheelers only
    }

    /// @notice Parking facility types
    enum ParkingType {
        None,               // Undefined
        AlongMotorway,      // Highway-adjacent
        ParkingGarage,     // Multi-story garage
        ParkingLot,        // Surface parking
        OnDriveway,        // Driveway parking
        OnStreet,          // Street parking
        UndergroundGarage  // Underground facility
    }

    /// @notice Electrical power types
    enum PowerType {
        None,           // Undefined
        AC_1_PHASE,     // Single-phase AC
        AC_2_PHASE,     // Two-phase AC
        AC_2_PHASE_SPLIT, // Split-phase (120V/240V)
        AC_3_PHASE,     // Three-phase AC
        DC              // Direct Current
    }

    /// @notice EVSE capabilities
    enum Capabilities {
        ChargingProfileCapable,      // Charging profile support
        ChargingPreferencesCapable,  // Preference configuration
        ChipCardSupport,             // Smart card support
        ContactlessCardSupport,      // NFC payments
        CreditCardPayable,          // Credit card acceptance
        DebitCardPayable,           // Debit card acceptance
        PedTerminal,                // Payment terminal
        RemoteStartStopCapable,     // Remote control
        Reservable,                 // Reservation capability
        RfidReader,                 // RFID authentication
        StartSessionConnectorRequired, // Physical connection required
        TokenGroupCapable,          // Token group management
        UnlockCapable               // Remote unlock
    }

    /// @notice Supported image formats
    enum ImageType {
        None,   // Undefined
        JPG,    // JPEG/JFIF
        PNG,    // Portable Network Graphics
        GIF,    // Graphics Interchange
        SVG     // Scalable Vector Graphics
    }

    /// @notice Document file types
    enum FileType {
        None,   // Undefined
        JSON,    // JavaScript Object Notation
        HTML,    // Hypertext Markup
        PDF,     // Portable Document
        CSV,     // Comma-Separated
        XLSX,    // Excel OpenXML
        XLS,     // Excel 97-2003
        DOC,     // Word 97-2003
        DOCX,    // Word OpenXML
        JPG,     // JPEG image
        PNG,     // PNG image
        GIF,     // GIF image
        SVG      // SVG vector
    }

    /// @notice Energy generation sources
    enum EnergySourceCategory {
        None,           // Undefined
        NUCLEAR,        // Nuclear fission
        GENERAL_FOSSIL, // Fossil fuels
        COAL,          // Coal power
        GAS,           // Natural gas
        GENERAL_GREEN, // Renewable mix
        SOLAR,         // Solar power
        WIND,          // Wind power
        WATER          // Hydroelectric
    }

    /// @notice Environmental impact categories
    enum EnvironmentalImpactCategory {
        None,               // Undefined
        NUCLEAR_WASTE,      // Radioactive waste (g/kWh)
        CARBON_DIOXIDE      // CO2 emissions (g/kWh)
    }

    /// @notice Energy source composition
    /// @param source Generation type
    /// @param percentage Mix percentage (0-100)
    struct EnergySource {
        EnergySourceCategory source;
        uint8 percentage;
    }

    /// @notice Environmental impact metrics
    /// @param category Impact type
    /// @param amount Quantity in category units
    struct EnvironmentalImpact {
        EnvironmentalImpactCategory category;
        uint256 amount; 
    }

    /// @notice Energy supply composition
    /// @dev Compliant with ISO 14068
    /// @param is_green_energy Renewable energy flag
    /// @param energy_sources Source mix (sum 100%)
    /// @param environ_impact Environmental metrics
    /// @param supplier_name Energy provider
    /// @param energy_product_name Tariff plan
    struct EnergyMix {
        bool is_green_energy;
        EnergySource[] energy_sources;
        EnvironmentalImpact[] environ_impact;
        string supplier_name;
        string energy_product_name;
    }

    /// @notice Pricing information
    /// @param excl_vat Pre-tax amount (milliunits)
    /// @param incl_vat Tax-inclusive amount (milliunits)
    struct Price {
        uint256 excl_vat;
        uint256 incl_vat;
    }

    /// @notice Supplemental coordinates
    /// @dev For complex locations with multiple access points
    /// @param latitude WGS84 decimal degrees (±90°, 1e-7 precision)
    /// @param longitude WGS84 decimal degrees (±180°, 1e-7 precision)
    /// @param name Localized location names
    struct AdditionalGeoLocation {
        int256 latitude;
        int256 longitude;
        DisplayText[] name;
    }

    /// @notice Business entity details
    /// @param name Legal entity name
    /// @param website Official URL
    /// @param logo Branding image
    struct BusinessDetails {
        string name;
        string website;
        Image logo;
    }

    /// @notice Localized navigation instructions
    /// @param lang BCP-47 language code (en-US, zh-CN)
    /// @param text Localized directions
    struct Directions {
        string lang;
        string text;
    }

    /// @notice Status change schedule
    /// @dev For maintenance planning
    /// @param begin Start timestamp (UTC)
    /// @param end End timestamp (UTC)
    /// @param status Scheduled status
    struct StatusSchedule {
        uint256 begin;
        uint256 end;
        EVSEStatus status;
    }

    /// @notice Image metadata
    /// @param url Direct image URL
    /// @param ipfs_cid IPFS content identifier
    /// @param category Image purpose
    /// @param _type File format
    /// @param width Pixel width
    /// @param height Pixel height
    struct Image {
        string url;
        string ipfs_cid;
        ImageCategory category;
        ImageType _type;
        uint16 width;
        uint16 height;
    }

    /// @notice Document file reference
    /// @param name_file Original filename
    /// @param ipfs_cid IPFS content identifier
    /// @param file_type File MIME type
    struct File {
        string name_file;
        string ipfs_cid;
        FileType file_type;
    }

    /// @notice Exceptional time period
    /// @dev For special operating hours
    /// @param begin Start timestamp
    /// @param end End timestamp
    struct ExceptionalPeriod {
        uint256 begin;
        uint256 end;
    }

    /// @notice Operating hours configuration
    /// @param twentyfourseven 24/7 operation flag
    /// @param regular_hours Standard weekly schedule
    /// @param exceptional_openings Special openings
    /// @param exceptional_closings Special closures
    struct Hours {
        bool twentyfourseven;
        RegularHours[] regular_hours;
        ExceptionalPeriod[] exceptional_openings;
        ExceptionalPeriod[] exceptional_closings;
    }

    /// @notice Recurring weekly schedule
    /// @param week_day Weekday index (0-6, Monday=0)
    /// @param period_begin Start time (HH:MM)
    /// @param period_end End time (HH:MM)
    struct RegularHours {
        int week_day;
        string period_begin;
        string period_end;
    }

    /// @notice Localized text content
    /// @param language BCP-47 language tag
    /// @param text Translated content
    struct DisplayText {
        string language;
        string text;
    }

    /// @notice Geographic coordinates
    /// @param latitude WGS84 decimal degrees
    /// @param longitude WGS84 decimal degrees
    struct GeoLocation {
        int256 latitude;
        int256 longitude;
    }

    /// @notice Complete location description
    /// @param uid Unique database ID
    /// @param country_code ISO 3166-1 alpha-2
    /// @param party_id Operator ID (ISO 15118-1)
    /// @param publish Public visibility flag
    /// @param publish_allowed_to Whitelist for private access
    /// @param name Location title
    /// @param _address Postal address
    /// @param city ISO 3166-2 city code
    /// @param postal_code ZIP code
    /// @param state ISO 3166-2 region code
    /// @param country ISO 3166-1 alpha-3
    /// @param coordinates GPS position
    /// @param parking_type Facility type
    /// @param evses Installed EVSEs
    /// @param operator Operator ID
    /// @param owner Blockchain address
    /// @param facilities Available amenities
    /// @param time_zone IANA timezone
    /// @param charging_when_closed After-hours access
    /// @param last_updated Last update timestamp
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
        address owner;
        Facility[] facilities;
        string time_zone;
        bool charging_when_closed;
        uint256 last_updated;
    }

    /// @notice EVSE unit description
    /// @param evse_id Unique hardware ID
    /// @param evse_model Equipment model
    /// @param physical_reference Physical label
    /// @param directions Access instructions
    struct EVSE {
        string evse_id; 
        uint256 evse_model;
        bytes32 physical_reference;
        DisplayText[] directions;
        address ocpp_proxy;
    }

    /// @notice Technical connector specifications
    /// @param standard Connector type
    /// @param format Socket/cable type
    /// @param power_type AC/DC configuration
    /// @param max_voltage Maximum voltage (volts)
    /// @param max_amperage Maximum current (amps)
    /// @param max_electric_power Maximum power (watts)
    /// @param terms_and_conditions_url Usage terms URL
    struct Connector {
        ConnectorTypes standard;
        ConnectorFormat format;
        PowerType power_type;
        int16 max_voltage;
        int16 max_amperage;
        int16 max_electric_power;
        string terms_and_conditions_url;
    }


    /**
     * @title Charging Session Data
     * @notice Complete session information
     * @param uid Unique session identifier
     * @param evse_uid Connected EVSE ID
     * @param connector_id Physical connector ID
     * @param start_datetime Session start timestamp
     * @param end_datetime Session end timestamp
     * @param status Current session state
     */
    struct Session {
        uint256 uid;
        uint256 evse_uid;
        uint256 connector_id;
        uint256 meter_start;
        uint256 meter_stop;
        uint256 create_datetime;
        uint256 start_datetime;
        uint256 stop_datetime;
        uint256 end_datetime;
        uint256 tariff_id;
        uint256 reserve_id;
        address account;
        Price total_paid;
        SessionStatus status;
        SessionMeterLog last_log;
        uint16 tariff_version;
        uint16 paid_log_counter;
        uint256 min_price_for_start_session;
        uint256 writeoff_treshold;
    }

    struct SessionMeterLog {
        uint256 meter_value;
        uint256 percent;
        uint256 power;
        uint256 current;
        uint256 voltage;
        uint256 timestamp; 
    }

    /**
     * @title Session Status Enum
     * @notice Lifecycle states of charging sessions
     */
    enum SessionStatus {
        ACTIVE,     // Ongoing charging
        FINISHING,  // Successfully ended
        PAUSED,
        CHARGING_COMPLETED,
        INVALID,    // Rejected/errored
        PENDING     // Awaiting start
    }

    enum SessionLogInfoType {
        ERROR,
        WARNING,
        INFO
    }


    enum SessionLogInfo {
        ConnectorError, // Charging error. Please check the connector or try another station.
        EVConnected, // EV connected. Charging will start shortly.
        SuspendedEV, // Charging paused by the vehicle. Will resume automatically.
        SuspendedEVSE, // Charging paused by the station due to power limits.
        Charging, // Charging in progress…
        Preparing, // Connector ready. Try to start charging

        ChargingComplited, // Charging complete. You may unplug the cable, started count parking time.
        AcceptedStartingRequest, // Charging request accepted. Connecting…
        RejectedStartingRequest, // Charging request denied. 
        RejectedStoppingRequest, // Stopping request denied. Try again 
        SessionStartRequest, // Starting charging session…
        SessionStopRequest, // Stopping charging session…
        WriteOffFromBalance, // Funds deducted
        InsufficientBalance, // Insufficient balance
        SessionEnded // Session ended
    }

}