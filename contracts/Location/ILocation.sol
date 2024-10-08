// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

import "./DataTypes.sol";
import "./IEVSE.sol";

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


    struct outLocation {
        DataTypesLocation.Location location;
        DataTypesLocation.AdditionalGeoLocation[] related_locations;
        DataTypesLocation.Image[] images;
        DataTypesLocation.Hours opening_times;
        DataTypesLocation.DisplayText[] directions;
        IEVSE.outEVSE[] evses;
    }
    


    event AddLocation(uint256 indexed uid, uint256 indexed partner_id, uint256 indexed user_id );

    function getVersion() external view returns(string memory);

    function addLocation(bytes32 _token, Add memory add) external;
    function getLocation(uint256 id) external view returns (outLocation memory);

    function exist(uint256 location_id) external returns(bool);
    function addRelatedLocation(bytes32 _token, uint256 location_id, DataTypesLocation.AdditionalGeoLocation calldata add ) external;
    function removeRelatedLocation(bytes32 _token, uint256 location_id, uint loc_id) external;
    function addImage(bytes32 _token, uint256 location_id, DataTypesLocation.Image calldata add ) external;
    function removeImage(bytes32 _token, uint256 location_id, uint image_id) external;
    function addDirection( bytes32 _token, uint256 location_id, DataTypesLocation.DisplayText calldata add ) external;
    function removeDirection( bytes32 _token, uint256 location_id, uint direction_id) external;
    function setOpeningTimes( bytes32 _token, uint256 location_id, DataTypesLocation.Hours calldata add ) external;
    function addEVSE( bytes32 _token, uint256 location_id, uint256 add ) external;
    function removeEVSE(bytes32 _token, uint256 location_id, uint evse) external;

}