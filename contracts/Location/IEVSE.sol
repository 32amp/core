// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

import "./DataTypes.sol";


interface IEVSE {

    struct EVSEMeta {
        DataTypesLocation.StatusSchedule[] status_schedule;
        DataTypesLocation.Capabilities[] capabilities;
        DataTypesLocation.GeoLocation coordinates;
        
        DataTypesLocation.ParkingRestriction[] parking_restrictions;
        int8 floor_level;
    }

    struct outEVSE {
        DataTypesLocation.EVSE evse;
        EVSEMeta meta;
        DataTypesLocation.EVSEStatus evses_status;
        uint256 location_id;
        uint256 last_updated;
        DataTypesLocation.Image[] images;
    }

    event AddEVSE(uint256 indexed uid, uint256 indexed partner_id, uint256 indexed user_id );

}