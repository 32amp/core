// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

import "./DataTypes.sol";


interface IConnector {


    struct output {
        uint256 id;
        uint256 last_updated;
        DataTypesLocation.Connector connector;
        DataTypesLocation.ConnectorStatus status;
        uint256[] tariffs;
    }
    
    event AddConnector(uint256 indexed uid, uint256 indexed partner_id, uint256 indexed user_id );

    function add(bytes32 _token, DataTypesLocation.Connector memory connector, uint256 evse_id) external;
    function get(uint256 id) external view returns (output memory);
    function exist(uint256 id) external view returns(bool);
}