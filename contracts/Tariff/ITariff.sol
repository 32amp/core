// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

import "../DataTypes.sol";
import "../IBaseErrors.sol";

/**
 * @title Tariff Management Interface
 * @notice Defines tariff structures and enumerations for charging systems
 * @dev Inherits data types and error handling from DataTypes and IBaseErrors
 */
interface ITariff is DataTypes, IBaseErrors {
    /**
     * @title Days of Week Enumeration
     * @notice Represents days for tariff restrictions
     * @dev None = 0, Weekdays follow standard order
     */
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

    /**
     * @title Tariff Dimension Types
     * @notice Defines different tariff calculation methods
     */
    enum TariffDimensionType {
        ENERGY,    // kWh-based pricing
        FLAT,      // Fixed price
        PARKING_TIME, // Time-based parking fees
        TIME       // Time-based charging fees
    }

    /**
     * @title Reservation Restriction Types
     * @notice Defines reservation-related tariff limitations
     */
    enum ReservationRestrictionType {
        None,
        RESERVATION,          // Requires reservation
        RESERVATION_EXPIRES   // Reservation expiration policy
    }

    /**
     * @title Complete Tariff Output
     * @notice Contains full tariff details with all components
     * @param country_code ISO 3166-1 alpha-2 country code
     * @param party_id Operator identifier within country
     * @param id Unique tariff identifier
     * @param last_updated UNIX timestamp of last modification
     * @param tariff Main tariff structure
     * @param min_price Minimum price constraints
     * @param max_price Maximum price constraints
     * @param start_date_time Effective start timestamp
     * @param end_date_time Expiration timestamp
     * @param energy_mix Renewable energy composition data
     */
    struct Output {
        bytes2 country_code;
        bytes3 party_id;
        uint256 id;
        uint256 last_updated;
        Tariff tariff;
        Price min_price;
        Price max_price;   
        uint256 start_date_time;
        uint256 end_date_time;
        EnergyMix energy_mix;             
    }

    /**
     * @title Simplified Tariff Output
     * @notice Contains basic tariff information
     * @param id Unique tariff identifier
     * @param tariff Core tariff structure
     */
    struct OutputLight {
        uint256 id;
        Tariff tariff;
    }

    /**
     * @title Main Tariff Structure
     * @notice Contains complete tariff configuration
     * @param currency Currency ID from Currencies contract
     * @param tariff_alt_url URL to full tariff details
     * @param tariff_alt_text Localized tariff descriptions
     * @param elements Array of tariff components
     */
    struct Tariff {
        uint256 currency; 
        string tariff_alt_url;
        DisplayText[] tariff_alt_text;
        TariffElement[] elements;
    }

    /**
     * @title Price Component Structure
     * @notice Defines pricing parameters for tariff dimensions
     * @param _type Pricing dimension type
     * @param price Price per unit (in specified currency)
     * @param vat VAT percentage (0-100)
     * @param step_size Minimum billing increment
     */
    struct PriceComponent {
        TariffDimensionType _type;
        uint256 price;
        uint8 vat;
        uint256 step_size;
    }

    /**
     * @title Tariff Restrictions Structure
     * @notice Defines temporal and quantitative limitations
     * @dev All time values use 24-hour format
     * @param start_time_hour Start hour (0-24)
     * @param start_time_minute Start minute (0-59)
     * @param end_time_hour End hour (0-24)
     * @param end_time_minute End minute (0-59)
     * @param start_date Effective start date (UNIX timestamp)
     * @param end_date Expiration date (UNIX timestamp)
     * @param min_kwh Minimum energy requirement
     * @param max_kwh Maximum energy limit
     * @param min_current Minimum current (in A)
     * @param max_current Maximum current (in A)
     * @param min_power Minimum power (in kW)
     * @param max_power Maximum power (in kW)
     * @param min_duration Minimum charging duration (seconds)
     * @param max_duration Maximum charging duration (seconds)
     * @param day_of_week Applicable days of week
     * @param reservation Reservation requirements
     */
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
        DayOfWeek[] day_of_week;
        ReservationRestrictionType reservation;
    }

    /**
     * @title Tariff Element Structure
     * @notice Combines pricing components with restrictions
     * @param restrictions Usage limitations
     * @param price_components Array of pricing models
     */
    struct TariffElement {
        TariffRestrictions restrictions;
        PriceComponent[] price_components;
    }

    /**
     * @notice Emitted when new tariff is added
     * @param uid New tariff ID
     * @param partner_id Hub-registered operator ID
     * @param account Creator's wallet address
     */
    event AddTariff(
        uint256 indexed uid,
        uint256 indexed partner_id,
        address indexed account
    );

    function getVersion() external pure returns(string memory);
    function exist(uint256 id) external returns(bool);
    function add(Tariff calldata tariff) external;
    function setMinPrice(uint256 id, Price calldata _min_price) external;
    function setMaxPrice(uint256 id, Price calldata _max_price) external;
    function setStartDateTime(uint256 id, uint256 _start_date_time) external;
    function setEndDateTime(uint256 id, uint256 _end_date_time) external;
    function setEnergyMix(uint256 id, EnergyMix calldata _energy_mix ) external;
    function get(uint256 id) external view returns(Output memory);
    function getLight(uint256 id) external view returns(OutputLight memory);
}