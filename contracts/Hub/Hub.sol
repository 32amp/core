// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./IHub.sol";


/**
 * @title Hub Contract
 * @author Mikhail Ivantsov
 * @notice Central contract for managing partners and their modules
 * @dev Inherits upgradeable contract functionality and Ownable pattern
 * @custom:warning This contract uses initialization instead of constructor
 */

contract Hub is IHub, Initializable, OwnableUpgradeable {
    
    /// @dev Storage for partner data mapped by partner ID
    mapping (uint256 => IHub.Member) partners;
    
    /// @dev Unique index for country_code + party_id combinations
    mapping (bytes2 => mapping(bytes3 => uint256)) unique_idex;
    
    /// @dev Mapping of owner addresses to their partner ID
    mapping (address => uint256) owner_address_to_id;
    
    /// @dev Partner modules mapped by name and partner ID
    mapping (uint256 => mapping(string => address)) modules;
    
    /// @dev List of module names for each partner
    mapping (uint256 => string[]) modules_list;

    /// @dev Registry of services by their name
    mapping (string => address) services;
    
    /// @dev Partner deposits mapped by their address
    mapping (address => uint256) deposit;

    /// @dev Counter for generating unique partner IDs
    uint256 counter;
    
    /// @dev Required deposit amount for partner registration
    uint256 addPartnerAmount;
    
    /**
     * @notice Returns contract version
     * @return Contract version as string
     */
    function getVersion() external pure returns(string memory){
        return "1.2";
    }

    /**
     * @notice Initializes the contract
     * @dev Called instead of constructor for upgradeable contracts
     * @param _services Array of services to initialize
     * @custom:init Only called once during contract deployment
     */    
    function initialize(addService[] calldata _services) public initializer {
        addPartnerAmount = 1 ether;

        for (uint i = 0; i < _services.length; i++) {
            services[_services[i].name] = _services[i].contract_address;
        }

        __Ownable_init(msg.sender);
    }


    /**
     * @notice Gets service address by name
     * @param name Service name
     * @return Address of the service contract
     */    
    function getService(string calldata name) external view returns(address){
        return services[name];
    }

    function setService(string calldata name, address service) external onlyOwner() {
        services[name] = service;
    }

   /**
     * @notice Registers new partner
     * @dev Requires deposit of addPartnerAmount
     * @param name Partner name (min 3 characters)
     * @param country_code 2-byte country code
     * @param party_id 3-byte party identifier
     * @return Registered partner's ID
     * @custom:reverts "FieldLenghtNoMore" if name shorter than 3 characters
     * @custom:reverts "AlreadyExist" if country_code+party_id exists
     * @custom:reverts "AmountNotEnouth" if sent value is too low
     * @custom:reverts "AlreadyExist" if address is already registered
     */
    function registerPartner(bytes32 name, bytes2 country_code, bytes3 party_id) external payable returns(uint256) {

        if(name.length < 3)
            revert FieldLenghtNoMore("name", 3);

        if(unique_idex[country_code][party_id] > 0){
            revert AlreadyExist("Partner");
        }

        if(msg.value < addPartnerAmount){
            revert AmountNotEnouth(addPartnerAmount);
        }

        if(owner_address_to_id[msg.sender] != 0)
            revert AlreadyExist("Partner");


        counter++;

        IHub.Member memory partnerData;
        partnerData.id = counter;
        partnerData.name = name;
        partnerData.country_code = country_code;
        partnerData.party_id = party_id;
        partnerData.status = IHub.ConnectionStatus.PLANNED;
        partnerData.owner_address = msg.sender;
        partnerData.last_updated = block.timestamp;
        
        owner_address_to_id[partnerData.owner_address] = counter;

        partners[counter] = partnerData;
        unique_idex[country_code][party_id] = counter;
        deposit[msg.sender] = msg.value;

        emit AddPartner(counter, country_code, party_id, msg.sender);
        return counter;
    }


    /**
     * @notice Adds new module for partner
     * @param name Module name
     * @param contractAddress Module contract address
     * @custom:reverts "AccessDenied:Hub" if caller not registered
     */    
    function addModule(string calldata name, address contractAddress) external {
        uint256 partner_id = owner_address_to_id[msg.sender];

        if(partner_id == 0)
            revert AccessDenied("Hub");

        modules[partner_id][name] = contractAddress;
        modules_list[partner_id].push(name);        
    }

    /// @notice Changes module address
    /// @dev Requires partner privileges    
    function changeModuleAddress(string calldata name, address contractAddress)  external {
        uint256 partner_id = owner_address_to_id[msg.sender];

        if(partner_id == 0)
            revert AccessDenied("Hub");
        
        modules[partner_id][name] = contractAddress;        
    }

    /// @notice Gets module address by name and partner ID
    function getModule(string calldata name, uint256 partner_id)  external view returns (address) {
        return modules[partner_id][name];
    }

    /// @notice Checks module existence
    /// @custom:reverts "ModuleNotFound" if module doesn't exist
    function checkModuleExist(string calldata name, uint256 partner_id)  external view  returns (address){
        if(modules[partner_id][name] == address(0))
            revert ModuleNotFound(name);

        return modules[partner_id][name];
    }

    /// @notice Gets list of partner's modules
    function getPartnerModules(uint256 partner_id) external view returns (string[] memory){
        return modules_list[partner_id];
    }

    /// @notice Retrieves all partners
    function getPartners() external view returns(IHub.Member[] memory){
        
        IHub.Member[] memory ret = new IHub.Member[](counter);

        for (uint i = 1; i <= counter; i++) {
            ret[i-1] = partners[i];
        }

        return ret;
    }

    /// @notice Gets current partner's information
    function me() external view returns(IHub.Member memory){
        return this.getPartnerByAddress(msg.sender);
    }

    /// @notice Finds partner by wallet address
    function getPartnerByAddress(address partner_address) external view returns(IHub.Member memory){
        return partners[owner_address_to_id[partner_address]];
    }

    /// @notice Get partner id by wallet address
    function getPartnerIdByAddress(address partner_address) external view returns(uint256){
        return owner_address_to_id[partner_address];
    }

    /// @notice Get partner data by partner_id
    function getPartner(uint256 partner_id) external view returns(IHub.Member memory){
        return partners[partner_id];
    }

    /// @notice Get partner name by partner_id
    function getPartnerName(uint256 partner_id) external view returns(bytes32){
        return partners[partner_id].name;
    }

    /// @notice Get partner party_id by partner_id
    function getPartnerPartyId(uint256 partner_id) external view returns(bytes3){
        return partners[partner_id].party_id;
    }

    /// @notice Get partner country_code by partner_id
    function getPartnerCountryCode(uint256 partner_id) external view returns(bytes2){
        return partners[partner_id].country_code;
    }


    // Internal functions documentation:
    
    /// @dev Updates partner status (internal use only)
    function _updateStatus(uint256 id, IHub.ConnectionStatus status) internal {
        partners[id].status = status;
    }

    /// @dev Updates partner roles (internal use only)
    function _updateRole(uint256 id, IHub.Roles[] memory role) internal {
        partners[id].role = role;
    }
}