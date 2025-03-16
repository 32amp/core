// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;


import "./IMobileAppSettings.sol";
import "../User/IUserAccess.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../Hub/IHub.sol";

/**
 * @title Mobile Application Settings Contract
 * @notice Manages configuration settings for mobile applications
 * @dev Upgradeable contract integrated with Hub ecosystem
 * @custom:warning Requires proper initialization via Hub contract
 */
contract MobileAppSettings is IMobileAppSettings, Initializable {
    // State variables documentation
    /// @notice Hub contract reference
    address hubContract;
    
    /// @notice Associated partner ID
    uint256 partner_id;
    
    /// @dev Current configuration settings
    Config config;

    /**
     * @notice Initializes contract with Hub connection
     * @param _partner_id Partner ID from Hub registry
     * @param _hubContract Address of Hub contract
     * @custom:init Called once during proxy deployment
     */
    function initialize(uint256 _partner_id, address _hubContract) external initializer {
        hubContract = _hubContract;
        partner_id = _partner_id;
    }

    /// @notice Returns current contract version
    function getVersion() external pure returns(string memory){
        return "1.0";
    }

    /// @notice Access control modifier requiring GOD level privileges
    modifier access() {
        _UserAccess().checkAccessModule(msg.sender, "MobileAppSettings", uint(IUserAccess.AccessLevel.GOD));
        _;
    }

    /// @dev Returns UserAccess module interface
    function _UserAccess() private view returns(IUserAccess) {
        return IUserAccess(IHub(hubContract).getModule("UserAccess", partner_id));
    }

    /**
     * @notice Updates complete configuration settings
     * @param _config New configuration structure
     * @custom:reverts If caller lacks GOD access level
     */
    function setConfig(Config calldata _config) external access() {
        config = _config;
    }

    /**
     * @notice Toggles technical work status
     * @param technical_work New technical work status
     * @custom:reverts If caller lacks GOD access level
     */
    function setTechnicalWork(bool technical_work) external access() {
        config.technical_work = technical_work;
    }

    /**
     * @notice Retrieves current configuration
     * @return Config Current settings structure
     */
    function getConfig() external view returns(Config memory) {
        return config;
    }
}