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
        uint256 max_payment_by_kwt;
        uint256 max_payment_buy_time;
        uint256[] favorite_evse;
    }


    struct inAreaOutput {
        uint256 id;
        GeoLocation coordinates;
    }

    function getVersion() external pure returns(string memory);
    function inArea(inAreaInput memory input) external view returns (inAreaOutput[] memory, uint256);
    function addLocationToIndex(int16 lat, int16 lon, uint256 location_id) external;

}