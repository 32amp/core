// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

import "../DataTypes.sol";
import "../IBaseErrors.sol";
import "./IEVSE.sol";

/**
 * @title Location Management Interface
 * @notice Defines data structures and events for charging station locations
 * @dev Inherits common data types from DataTypes interface
 */
interface ILocation is DataTypes, IBaseErrors {
    /**
     * @title Geographic Coordinates
     * @notice String-based latitude/longitude representation
     * @param latitude Decimal degree format ("41.40338")
     * @param longitude Decimal degree format ("2.17403")
     */
    struct GeoLocationString {
        string latitude;
        string longitude;
    }

    /**
     * @title Location Creation Data
     * @notice Input structure for new location registration
     * @param name Location display name
     * @param _address Physical street address
     * @param city Municipality name
     * @param postal_code ZIP/postal code
     * @param state Province/region
     * @param country ISO country code
     * @param coordinates GPS position data
     * @param parking_type Vehicle accommodation type
     * @param facilities Amenities available on site
     * @param time_zone IANA time zone identifier
     * @param charging_when_closed 24/7 availability flag
     * @param publish Public visibility status
     */
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

    /**
     * @title Complete Location Data
     * @notice Aggregated location information structure
     * @param location Core location details
     * @param related_locations Associated geo-points
     * @param images Visual references
     * @param opening_times Operational schedule
     * @param directions Multilingual navigation guides
     * @param evses Connected charging stations
     */
    struct outLocation {
        Location location;
        AdditionalGeoLocation[] related_locations;
        Image[] images;
        Hours opening_times;
        DisplayText[] directions;
        IEVSE.outEVSE[] evses;
    }

    /**
     * @notice Emitted when new charging location is registered
     * @param uid Auto-generated location ID
     * @param partner_id Hub-registered operator ID
     * @param account Creator's wallet address
     */
    event AddLocation(
        uint256 indexed uid,
        uint256 indexed partner_id,
        address indexed account
    );

    function getVersion() external pure returns(string memory);
    function addLocation(Add calldata add) external;
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