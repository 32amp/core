// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;
import "../DataTypes.sol";
/**
 * @title Mobile Application Settings Interface
 * @notice Defines data structures for mobile application configuration
 * @dev Inherits common data types from DataTypes interface
 */
interface IMobileAppSettings is DataTypes {
    
    /**
     * @title Application Configuration
     * @notice Structure containing mobile app settings and legal documents
     * @param privacy_policy Privacy policy document reference
     * @param license_agreement End-user license agreement document
     * @param technical_work Maintenance mode status flag
     * @param support_phone Customer support contact number
     */
    struct Config {
        File privacy_policy;
        File license_agreement;
        bool technical_work;
        string support_phone;
    }

    function getVersion() external pure returns(string memory);
    function setConfig(Config calldata) external;
    function setTechnicalWork(bool technical_work) external;
    function getConfig() external view returns(Config memory);
}