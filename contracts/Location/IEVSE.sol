// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

import "../DataTypes.sol";
import "./IConnector.sol";

interface IEVSE is DataTypes {

    struct EVSEMeta {
        StatusSchedule[] status_schedule;
        Capabilities[] capabilities;
        GeoLocation coordinates;
        
        ParkingRestriction[] parking_restrictions;
        int8 floor_level;
    }

    struct outEVSE {
        EVSE evse;
        EVSEMeta meta;
        EVSEStatus evses_status;
        uint256 location_id;
        uint256 last_updated;
        Image[] images;
        IConnector.output[] connectors;

    }

    event AddEVSE(uint256 indexed uid, uint256 indexed partner_id, address indexed user_address );

    function getVersion() external pure returns(string memory);
    function exist(uint256 id) external view returns(bool);
    function add(EVSE calldata evse, uint256 location_id) external;
    function setMeta(uint256 evse_id, EVSEMeta calldata meta) external;
    function addImage(uint256 evse_id, Image calldata image ) external;
    function removeImage(uint256 evse_id, uint image_id) external;
    function setStatus(uint256 evse_id, EVSEStatus status) external;
    function addConnector(uint256 evse_id,  uint256 connector_id ) external;
    function removeConnector(uint256 evse_id, uint connector_id) external;
    function get(uint256 id) external view returns(outEVSE memory);

}