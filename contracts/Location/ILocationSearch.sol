// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "../DataTypes.sol";
import "../IBaseErrors.sol";

/**
 * @title Location Search Interface
 * @notice Defines data structures for geospatial search operations
 * @dev Inherits common data types from DataTypes interface
 */
interface ILocationSearch is DataTypes, IBaseErrors {
    /**
     * @title Search Input Parameters
     * @notice Structure defining search criteria for location queries
     * @param topRightLat Latitude of top-right bounding box corner
     * @param topRightLong Longitude of top-right bounding box corner
     * @param bottomLeftLat Latitude of bottom-left bounding box corner
     * @param bottomLeftLong Longitude of bottom-left bounding box corner
     * @param offset Pagination offset for results
     * @param connectors Filter by supported connector types
     * @param onlyFreeConnectors Filter for locations with available connectors
     * @param publish Filter by publication status
     * @param max_payment_by_kwt Maximum payment per kilowatt threshold
     * @param max_payment_buy_time Maximum payment per time unit threshold
     * @param favorite_evse Preferred EVSE identifiers
     * @custom:todo Implement connector-based filtering
     * @custom:todo Implement publish flag filtering
     */
    struct inAreaInput {
        string topRightLat;
        string topRightLong;
        string bottomLeftLat;
        string bottomLeftLong;
        uint64 offset;
        uint8[] connectors;
        bool onlyFreeConnectors;
        bool publish;
        uint256 max_payment_by_kwt;
        uint256 max_payment_buy_time;
        uint256[] favorite_evse;
    }

    /**
     * @title Search Output Structure
     * @notice Contains essential location data for search results
     * @param id Unique location identifier
     * @param coordinates Geographic coordinates of the location
     */
    struct inAreaOutput {
        uint256 id;
        GeoLocation coordinates;
    }

    function getVersion() external pure returns(string memory);
    function inArea(inAreaInput calldata input) external view returns (inAreaOutput[] memory, uint256);
    function addLocationToIndex(int16 lat, int16 lon, uint256 location_id) external;

}