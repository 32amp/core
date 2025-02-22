// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

import "../DataTypes.sol";


interface ITariff is DataTypes {

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

    enum TariffDimensionType {
        ENERGY,
        FLAT,
        PARKING_TIME,
        TIME
    }

    enum ReservationRestrictionType {
        None,
        RESERVATION,
        RESERVATION_EXPIRES
    }

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

    struct OutputLight {
        uint256 id;
        Tariff tariff;
    }

    struct Tariff {
        uint256 currency; 
        string tariff_alt_url;
        DisplayText[] tariff_alt_text;
        TariffElement[] elements;
    }


    struct PriceComponent {
        TariffDimensionType _type;
        uint256 price;
        uint8 vat;
        uint256 step_size;
    }

    struct TariffRestrictions {
        int16 start_time_hour; // 0-24
        int16 start_time_minute; // 0-59
        int16 end_time_hour; // 0-24
        int16 end_time_minute; // 0-59
        int256 start_date; // unix timestamp
        int256 end_date; // unix timestamp
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

    struct TariffElement {
        TariffRestrictions restrictions;
        PriceComponent[] price_components;
    }

    event AddTariff(uint256 indexed uid, uint256 indexed partner_id, address indexed account );

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