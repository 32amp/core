// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

import "../DataTypes.sol";


interface ILocationSearch is DataTypes {

    struct inAreaInput {
        string topRightLat;
        string topRightLong;
        string bottomLeftLat;
        string bottomLeftLong;
        uint64 offset;
        uint8[] connectors; // TODO add filter by connector
        bool onlyFreeConnectors; // TODO add filter by connector
        bool publish; //TODO add filter by publish flag
    }


    struct inAreaOutput {
        uint256 id;
        GeoLocation coordinates;
    }

    event AddLocation(uint256 indexed uid, uint256 indexed partner_id, uint256 indexed user_id );

    function getVersion() external view returns(string memory);

    function inArea(inAreaInput memory input) external view returns (inAreaOutput[] memory, uint256);
    function addLocationToIndex(int16 lat, int16 lon, uint256 location_id) external;

}