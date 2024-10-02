// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

import "./DataTypes.sol";


interface ILocation {

    struct GeoLocation {
        string latitude;
        string longtitude;
    }


    struct Add {
        string name;
        string _address;
        bytes32 city;
        bytes32 postal_code;
        bytes32 state;
        bytes32 country;
        GeoLocation coordinates;
        DataTypesLocation.ParkingType parking_type;
        DataTypesLocation.Facility[] facilities;
        string time_zone;
        bool charging_when_closed;
        bool publish;
    }

    struct inAreaInput {
        string topRightLat;
        string topRightLong;
        string bottomLeftLat;
        string bottomLeftLong;
        uint64 offset;
        uint8[] connectors; // TODO add filter by connector
        bool onlyFreeConnectors; // TODO add filter by connector
    }

    event AddLocation(uint256 indexed uid, uint256 indexed partner_id, uint256 indexed user_id );

    function getVersion() external view returns(string memory);

    function addLocation(bytes32 _token, Add memory add) external;
    function getLocation(uint256 id) external returns (DataTypesLocation.Location memory, DataTypesLocation.AdditionalGeoLocation[] memory, DataTypesLocation.Image[] memory, DataTypesLocation.Hours memory, DataTypesLocation.DisplayText[] memory);

    function exist(uint256 location_id) external returns(bool);
    function inArea(inAreaInput memory input) external view returns (DataTypesLocation.Location[] memory, uint256);
    function addRelatedLocation(uint256 location_id, bytes32 _token, DataTypesLocation.AdditionalGeoLocation calldata add ) external;
    function removeRelatedLocation(uint256 location_id, bytes32 _token, uint loc_id) external;
    function addImage(uint256 location_id, bytes32 _token, DataTypesLocation.Image calldata add ) external;
    function removeImage(uint256 location_id, bytes32 _token, uint image_id) external;
    function addDirection(uint256 location_id, bytes32 _token, DataTypesLocation.DisplayText calldata add ) external;
    function removeDirection(uint256 location_id, bytes32 _token, uint direction_id) external;
    function setOpeningTimes(uint256 location_id, bytes32 _token, DataTypesLocation.Hours calldata add ) external;

}