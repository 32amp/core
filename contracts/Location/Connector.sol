// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../Hub/IHub.sol";
import "../Location/EVSE.sol";
import "../Location/Location.sol";
import "./DataTypes.sol";


contract Connector is Initializable {
    address hubContract;
    string version;
    uint256 partner_id;
    uint256 connectorcounter;


    function initialize(uint256 _partner_id, address _hubContract) public initializer {
        hubContract = _hubContract;
        partner_id = _partner_id;
        version = "1.0";
    }

    function getVersion() public view returns(string memory){
        return version;
    }

    function addConnector(DataTypesLocation.Connector memory connector, bytes32 _token) external {
        
        //require(evse.exist(connector.evse_id), "evse_not_exist");
        //require(location.exist(connector.location_id), "location_not_exist");
        
        
    }

}