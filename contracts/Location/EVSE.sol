// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;


import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../Hub/IHub.sol";
import "./DataTypes.sol";


contract EVSE is Initializable {
    mapping (bytes => DataTypesLocation.Location)  locations;
    IHub hub;
    string version;


    function initialize(address hubContract, address locationContract) public initializer {
        hub = IHub(hubContract);
        version = "1.0";
    }

    function getVersion() public view returns(string memory){
        return version;
    }

    function exist(uint256 evse_id) public returns(bool){

    }

    function addStation() public {
        
    }

}