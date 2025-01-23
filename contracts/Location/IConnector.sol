// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

import "../DataTypes.sol";
import "../Tariff/ITariff.sol";

interface IConnector is DataTypes {


    struct output {
        uint256 id;
        uint256 last_updated;
        Connector connector;
        ConnectorStatus status;
        ITariff.OutputLight tariff;
    }
    
    event AddConnector(uint256 indexed uid, uint256 indexed partner_id, uint256 indexed user_id );
    
    function getVersion() external pure returns(string memory);
    function add(bytes32 _token, Connector memory connector, uint256 evse_id) external;
    function get(uint256 id) external view returns (output memory);
    function setTariffs(bytes32 _token, uint256 id, uint256 _tariff) external;
    function exist(uint256 id) external view returns(bool);
}