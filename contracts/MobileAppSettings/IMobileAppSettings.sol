// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;
import "../DataTypes.sol";

interface IMobileAppSettings is DataTypes {


    struct Config {
        File privacy_policy;
        File license_agreement;
        bool technical_work;
        string support_phone;
    }

    function getVersion() external pure returns(string memory);
    function setConfig(Config memory) external;
    function setTechnicalWork(bool technical_work) external;
    function getConfig() external view returns(Config memory);
}