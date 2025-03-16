// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "../IBaseErrors.sol";

/**
 * @title IHub Interface
 * @notice Core interface for Partner Management System
 * @dev Defines data structures and events for Hub contract ecosystem
 */
interface IHub is IBaseErrors {
    /**
     * @title System Roles
     * @notice Enumeration of available system roles
     * @member None - Unassigned role
     * @member CPO - Charge Point Operator
     * @member EMSP - Electric Mobility Service Provider
     * @member HUB - Central management system
     * @member NSP - Network Service Provider
     * @member SCSP - Smart Charging Service Provider
     */
    enum Roles {
        None,
        CPO,
        EMSP,
        HUB,
        NSP,
        SCSP
    }

    /**
     * @title System Modules
     * @notice Enumeration of available functional modules
     * @member None - Empty placeholder
     * @member Location - Geolocation services module
     * @member Users - User management module
     * @member ChargingProfiles - EV charging profiles module
     * @member Commands - Command execution module
     * @member Credentials - Authentication module
     */
    enum Modules {
        None,
        Location,
        Users,
        ChargingProfiles,
        Commands,
        Credentials
    }

    /**
     * @title Connection Statuses
     * @notice Enumeration of partner connection states
     * @member None - Initial state
     * @member CONNECTED - Active connection
     * @member OFFLINE - Temporary disconnection
     * @member PLANNED - Registration pending
     * @member SUSPENDED - Blocked by system
     */
    enum ConnectionStatus {
        None,
        CONNECTED,
        OFFLINE,
        PLANNED,
        SUSPENDED
    }

    /**
     * @title Member Structure
     * @notice Contains complete partner profile data
     * @param id Unique partner identifier
     * @param country_code ISO 3166-1 alpha-2 country code
     * @param party_id Organization identifier within country
     * @param name Legal entity name
     * @param role Array of assigned system roles
     * @param status Current connection state
     * @param owner_address Wallet address of administrator
     * @param last_updated Timestamp of last modification
     */
    struct Member {
        uint256 id;
        bytes2 country_code;
        bytes3 party_id;
        bytes32 name;
        Roles[] role;
        ConnectionStatus status;
        address owner_address;
        uint256 last_updated;
    }

    /**
     * @title Service Configuration
     * @notice Structure for initial service registration
     * @param name Service name identifier
     * @param contract_address Deployed service contract address
     */
    struct addService {
        string name;
        address contract_address;
    }

    /**
     * @notice Emitted when new partner joins the network
     * @param id Assigned partner ID
     * @param country_code 2-byte country designation
     * @param party_id 3-byte organization identifier
     * @param owner_address Control wallet address
     */
    event AddPartner(
        uint256 indexed id,
        bytes2 indexed country_code,
        bytes3 indexed party_id,
        address owner_address
    );


    function getVersion() external pure returns(string memory);
    function registerPartner(bytes32 name,bytes2 country_code,bytes3 party_id) external payable returns (uint256);
    function addModule(string memory name, address contractAddress) external;
    function changeModuleAddress(string memory name, address contractAddress)  external;
    function getService(string memory name) external view returns(address);
    function getModule(string memory name, uint256 partner_id)  external view returns (address);
    function checkModuleExist(string memory name, uint256 partner_id)  external view returns (address);
    function getPartnerModules(uint256 partner_id) external view returns (string[] memory);
    function getPartners() external view returns(Member[] memory);
    function me() external view returns(Member memory);
    function getPartnerByAddress(address partner_address) external view returns(Member memory);
    function getPartnerIdByAddress(address partner_address) external view returns(uint256);
    function getPartner(uint256 partner_id) external view returns(Member memory);
    function getPartnerName(uint256 partner_id) external view returns(bytes32);
    function getPartnerPartyId(uint256 partner_id) external view returns(bytes3);
    function getPartnerCountryCode(uint256 partner_id) external view returns(bytes2);
}