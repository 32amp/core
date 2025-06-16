// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "../DataTypes.sol";
import "../IBaseErrors.sol";
import "../Tariff/ITariff.sol";

/**
 * @title Connector Management Interface
 * @notice Defines data structures and events for charging connectors
 * @dev Inherits common data types from DataTypes interface
 */
interface IConnector is DataTypes, IBaseErrors {


    /**
     * @title Connector Output Data
     * @notice Aggregated connector information structure
     * @param id Unique connector identifier
     * @param last_updated Timestamp of last modification
     * @param connector Core connector details
     * @param status Current operational state
     * @param tariff Associated pricing information
     */
    struct output {
        uint256 id;
        uint256 last_updated;
        Connector connector;
        ConnectorStatus status;
        uint256 tariff;
    }

    /**
     * @notice Emitted when new connector is added to the system
     * @param uid Auto-generated connector ID
     * @param partner_id Hub-registered operator ID
     * @param account Creator's wallet address
     */
    event AddConnector(
        uint256 indexed uid,
        uint256 indexed partner_id,
        address indexed account
    );

    function getVersion() external pure returns(string memory);
    function add(Connector memory connector, uint256 evse_id) external;
    function get(uint256 id) external view returns (output memory);
    function setTariffs(uint256 id, uint256 _tariff) external;
    function exist(uint256 id) external view returns(bool);
    function setStatus(uint256 id, ConnectorStatus status) external;
    function getTariff(uint256 id) external view returns(uint256);
    function getStatus(uint256 id) external view returns(ConnectorStatus);
}