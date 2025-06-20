// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "../DataTypes.sol";
import "../IBaseErrors.sol";
import "./IConnector.sol";

/**
 * @title EVSE Management Interface
 * @notice Defines data structures and events for Electric Vehicle Supply Equipment
 * @dev Inherits common data types from DataTypes interface
 */
interface IEVSE is DataTypes, IBaseErrors {
    /**
     * @title EVSE Metadata Structure
     * @notice Extended operational data for EVSE units
     * @dev Contains status schedule, capabilities, coordinates, parking restrictions, and floor level
     * @param status_schedule Array of availability periods
     * @param capabilities Array of supported charging features
     * @param coordinates Physical location details
     * @param parking_restrictions Array of vehicle accommodation rules
     * @param floor_level Building floor identifier
     */
    struct EVSEMeta {
        StatusSchedule[] status_schedule;
        Capabilities[] capabilities;
        GeoLocation coordinates;
        ParkingRestriction[] parking_restrictions;
        int8 floor_level;
    }

    /**
     * @title Complete EVSE Data Structure
     * @notice Aggregated EVSE information structure
     * @dev Contains core EVSE details, metadata, status, location, images, and connectors
     * @param evse Core EVSE details
     * @param meta Extended metadata
     * @param evses_status Current operational state
     * @param location_id Associated location reference
     * @param last_updated Timestamp of last modification
     * @param images Array of visual references
     * @param connectors Array of associated charging connectors
     */
    struct outEVSE {
        EVSE evse;
        EVSEMeta meta;
        EVSEStatus evses_status;
        uint256 location_id;
        uint256 last_updated;
        Image[] images;
        IConnector.output[] connectors;
    }

    /**
     * @notice Emitted when new EVSE is added to the system
     * @param uid Auto-generated EVSE ID
     * @param partner_id Hub-registered operator ID
     * @param account Creator's wallet address
     */
    event AddEVSE(
        uint256 indexed uid,
        uint256 indexed partner_id,
        address indexed account
    );
        
    function getVersion() external pure returns(string memory);
    function exist(uint256 id) external view returns(bool);
    function add(EVSE calldata evse, uint256 location_id) external;
    function setMeta(uint256 evse_id, EVSEMeta calldata meta) external;
    function setOcppProxy(uint256 evse_id, address ocpp_proxy) external;
    function addImage(uint256 evse_id, Image calldata image ) external;
    function removeImage(uint256 evse_id, uint image_id) external;
    function setStatus(uint256 evse_id, EVSEStatus status) external;
    function addConnector(uint256 evse_id,  uint256 connector_id ) external;
    function removeConnector(uint256 evse_id, uint connector_id) external;
    function get(uint256 id) external view returns(outEVSE memory);
    function getOcppProxy(uint256 evse_id)  external view returns (address);

}