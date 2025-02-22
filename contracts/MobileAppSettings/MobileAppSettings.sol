// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;


import "./IMobileAppSettings.sol";
import "../User/IUserAccess.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../Hub/IHub.sol";

contract MobileAppSettings is IMobileAppSettings,  Initializable {
    
    address hubContract;
    uint256 partner_id;
    Config config;

    function initialize(uint256 _partner_id, address _hubContract) external initializer {
        hubContract = _hubContract;
        partner_id = _partner_id;        
    }

    function getVersion() external pure returns(string memory){
        return "1.0";
    }

    modifier access() {
        _UserAccess().checkAccessModule( msg.sender, "MobileAppSettings",  uint(IUserAccess.AccessLevel.GOD));
        _;
    }

    function _UserAccess() private view returns(IUserAccess) {
        return IUserAccess(IHub(hubContract).getModule("UserAccess", partner_id));
    }

    function setConfig(Config memory _config) external access() {
        config = _config;
    }

    function setTechnicalWork(bool technical_work) external access() {
        config.technical_work = technical_work;
    }

    function getConfig() external view returns(Config memory) {
        return config;
    }
}