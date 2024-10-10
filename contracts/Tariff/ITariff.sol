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

    enum TariffType {
        AD_HOC_PAYMENT,
        PROFILE_CHEAP,
        PROFILE_FAST,
        PROFILE_GREEN,
        REGULAR
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

    struct Tariff {
        uint256 currency; // TODO, ADD currency
        TariffType _type;
        DisplayText[] tariff_alt_text;
        string tariff_alt_url;
        TariffElement[] elements;
    }


    struct PriceComponent {
        TariffDimensionType _type;
        uint256 price;
        uint8 vat;
        uint256 step_size;
    }

    struct TariffRestrictions {
        uint256 start_unixtime;
        uint256 end_unixtime;
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
        PriceComponent[] price_components;
        TariffRestrictions restrictions;
    }

    event AddTariff(uint256 indexed uid, uint256 indexed partner_id, uint256 indexed user_id );

    function getVersion() external view returns(string memory);
    function exist(uint256 id) external returns(bool);
    function add(bytes32 _token, Tariff calldata tariff) external;
    function setMinPrice(bytes32 _token, uint256 id, Price calldata _min_price) external;
    function setMaxPrice(bytes32 _token, uint256 id, Price calldata _max_price) external;
    function setStartDateTime(bytes32 _token, uint256 id, uint256 _start_date_time) external;
    function setEndDateTime(bytes32 _token, uint256 id, uint256 _end_date_time) external;
    function setEnergyMix(bytes32 _token, uint256 id, EnergyMix calldata _energy_mix ) external;
    function get(uint256 id) external view returns(Output memory);
}