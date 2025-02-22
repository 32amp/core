// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

import "../DataTypes.sol";
import "./IEVSE.sol";

interface ILocation is DataTypes {

    struct GeoLocationString {
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
        GeoLocationString coordinates;
        ParkingType parking_type;
        Facility[] facilities;
        string time_zone;
        bool charging_when_closed;
        bool publish;
    }


    struct outLocation {
        Location location;
        AdditionalGeoLocation[] related_locations;
        Image[] images;
        Hours opening_times;
        DisplayText[] directions;
        IEVSE.outEVSE[] evses;
    }
    


    event AddLocation(uint256 indexed uid, uint256 indexed partner_id, address indexed user_address );

    function getVersion() external pure returns(string memory);
    function addLocation(Add memory add) external;
    function getLocation(uint256 id) external view returns (outLocation memory);
    function exist(uint256 location_id) external returns(bool);
    function addRelatedLocation(uint256 location_id, AdditionalGeoLocation calldata add ) external;
    function removeRelatedLocation(uint256 location_id, uint loc_id) external;
    function addImage(uint256 location_id, Image calldata add ) external;
    function removeImage(uint256 location_id, uint image_id) external;
    function addDirection(uint256 location_id, DisplayText calldata add ) external;
    function removeDirection(uint256 location_id, uint direction_id) external;
    function setOpeningTimes(uint256 location_id, Hours calldata add ) external;
    function addEVSE(uint256 location_id, uint256 add ) external;
    function removeEVSE(uint256 location_id, uint evse) external;

}