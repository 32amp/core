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
    function exist(uint256 id) external view returns(bool);
    function add(bytes32 _token, DataTypesLocation.EVSE calldata evse, uint256 location_id) external;
    function setMeta(bytes32 _token, uint256 id, EVSEMeta calldata meta) external;
    function addImage(uint256 id, bytes32 _token, DataTypesLocation.Image calldata image ) external;
    function removeImage(uint256 id, bytes32 _token, uint image_id) external;
    function setStatus(bytes32 _token, uint256 id, DataTypesLocation.EVSEStatus status) external;
    function get(uint256 id) external view returns(outEVSE memory);

}