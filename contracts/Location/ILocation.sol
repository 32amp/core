// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;


import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../Hub/IHub.sol";
import "./DataTypes.sol";


interface ILocation {

    struct GeoLocation {
        string latitude;
        string longitude;
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

    function addLocation(bytes32 _token, Add memory add) external returns(uint256);
    function getLocation(uint256 id) external returns (DataTypesLocation.Location memory);

    function exist(uint256 location_id) external returns(bool);

}