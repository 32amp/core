// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../Hub/IHub.sol";
import "../Location/EVSE.sol";
import "../Location/Location.sol";
import "./DataTypes.sol";


contract Connector is Initializable {
    mapping (uint256 => DataTypesLocation.Connector)  connectors;
    mapping (bytes5 => uint256)  connectorIndexPartner;
    uint256 connectorIndex;

    IHub hub;
    EVSE evse;
    Location location;
    string version;

    function initialize(address hubContract, address evseContract, address locationContract) external initializer {
        hub = IHub(hubContract);
        evse = EVSE(evseContract);
        location = Location(locationContract);
        version = "1.0";
        connectorIndex = 0;
    }

    function getVersion() public view returns(string memory){
        return version;
    }

    function addConnector(DataTypesLocation.Connector memory connector, bytes32 _token) external {
        
        require(evse.exist(connector.evse_id), "evse_not_exist");
        require(location.exist(connector.location_id), "location_not_exist");
        
        connectorIndex++;
    }

}