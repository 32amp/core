// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../Hub/IHub.sol";
import "./ITariff.sol";
import "../User/IUserAccess.sol";
import "../Services/ICurrencies.sol";

/**
 * @title Tariff Management Contract
 * @notice Handles the storage and management of tariff information
 * @dev Manages tariff data including pricing, energy mix, and validity periods
 * @custom:warning Requires proper initialization and access control for modifications
 */
contract Tariff is ITariff, Initializable {
    // State variables documentation
    /// @notice Hub contract reference
    address hubContract;
    
    /// @notice Associated partner ID
    uint256 partner_id;
    
    /// @dev Auto-incrementing tariff ID counter
    uint256 counter;

    // Storage mappings documentation
    /// @dev Timestamp of last update for each tariff
    mapping(uint256 => uint256) last_updated;
    
    /// @dev Tariff data storage
    mapping(uint256 => Tariff) tariffs;
    
    /// @dev Minimum price configuration for tariffs
    mapping(uint256 => Price) min_price;
    
    /// @dev Maximum price configuration for tariffs
    mapping(uint256 => Price) max_price;
    
    /// @dev Start date and time for tariff validity
    mapping(uint256 => uint256) start_date_time;
    
    /// @dev End date and time for tariff validity
    mapping(uint256 => uint256) end_date_time;
    
    /// @dev Energy mix configuration for tariffs
    mapping(uint256 => EnergyMix) energy_mix;
    
    /// @dev Country code associated with tariffs
    mapping(uint256 => bytes2) country_code;
    
    /// @dev Party ID associated with tariffs
    mapping(uint256 => bytes3) party_id;

    /**
     * @notice Initializes the contract with Hub connection
     * @param _partner_id Partner ID from Hub registry
     * @param _hubContract Address of Hub contract
     * @custom:init Called once during proxy deployment
     */
    function initialize(uint256 _partner_id, address _hubContract) public initializer {
        hubContract = _hubContract;
        partner_id = _partner_id;
    }

    /**
     * @notice Returns the current contract version
     * @return string Contract version identifier
     */
    function getVersion() external pure returns(string memory) {
        return "1.0";
    }

    /**
     * @notice Checks if a tariff exists by ID
     * @param id Tariff ID to check
     * @return bool True if the tariff exists, false otherwise
     */
    function exist(uint256 id) external view returns(bool) {
        return last_updated[id] != 0;
    }

    /**
     * @notice Access control modifier requiring FOURTH level privileges
     * @param id Tariff ID to check access for
     */
    modifier access(uint256 id) {
        _UserAccess().checkAccess(msg.sender, "Tariff", bytes32(id), uint(IUserAccess.AccessLevel.FOURTH));
        _;
    }

    /**
     * @dev Internal function to update the last modified timestamp
     * @param id Tariff ID to update
     */
    function _updated(uint256 id) internal {
        last_updated[id] = block.timestamp;
    }

    /**
     * @dev Returns UserAccess module interface
     * @return IUserAccess UserAccess module instance
     */
    function _UserAccess() private view returns(IUserAccess) {
        return IUserAccess(IHub(hubContract).getModule("UserAccess", partner_id));
    }

    /**
     * @dev Returns Currencies service interface
     * @return ICurrencies Currencies service instance
     */
    function _Currencies() private view returns(ICurrencies) {
        return ICurrencies(IHub(hubContract).getService("Currencies"));
    }

    /**
     * @notice Adds a new tariff to the registry
     * @param tariff Tariff data structure to add
     * @custom:reverts AccessDenied If caller lacks FOURTH level access
     * @custom:reverts ObjectNotFound If referenced currency does not exist
     * @custom:emits AddTariff On successful tariff addition
     */
    function add(Tariff calldata tariff) external {

        uint access_level = _UserAccess().getModuleAccessLevel("Tariff", msg.sender);

        if(access_level < uint(IUserAccess.AccessLevel.FOURTH)){
            revert AccessDenied("Tariff");
        }

        if(!_Currencies().exist(tariff.currency))
            revert ObjectNotFound("Currency",tariff.currency);

        counter++;
        tariffs[counter] = tariff;
        country_code[counter] = IHub(hubContract).getPartnerCountryCode(partner_id);
        party_id[counter] = IHub(hubContract).getPartnerPartyId(partner_id);

        _updated(counter);

        emit AddTariff(counter, partner_id, msg.sender);

        _UserAccess().setAccessLevelToModuleObject(bytes32(counter),msg.sender,"Tariff",IUserAccess.AccessLevel.FOURTH);

    }

    
    /**
     * @notice Sets the minimum price for a tariff
     * @param id Tariff ID to update
     * @param _min_price Price structure containing minimum price details
     * @custom:reverts AccessDenied If caller lacks FOURTH level access
     */
    function setMinPrice(uint256 id, Price calldata _min_price) access(id) external{
        min_price[id] = _min_price;
    }

    /**
     * @notice Sets the maximum price for a tariff
     * @param id Tariff ID to update
     * @param _max_price Price structure containing maximum price details
     * @custom:reverts AccessDenied If caller lacks FOURTH level access
     */    
    function setMaxPrice(uint256 id, Price calldata _max_price) access(id) external{
        max_price[id] = _max_price;
    }

    /**
     * @notice Sets the start date and time for a tariff
     * @param id Tariff ID to update
     * @param _start_date_time Unix timestamp for tariff start
     * @custom:reverts AccessDenied If caller lacks FOURTH level access
     */    
    function setStartDateTime(uint256 id, uint256 _start_date_time) access(id) external {
        start_date_time[id] = _start_date_time;
    }

    /**
     * @notice Sets the end date and time for a tariff
     * @param id Tariff ID to update
     * @param _end_date_time Unix timestamp for tariff end
     * @custom:reverts AccessDenied If caller lacks FOURTH level access
     */    
    function setEndDateTime(uint256 id, uint256 _end_date_time) access(id) external {
        end_date_time[id] = _end_date_time;
    }

    /**
     * @notice Sets the energy mix configuration for a tariff
     * @param id Tariff ID to update
     * @param _energy_mix EnergyMix structure containing energy source details
     * @custom:reverts AccessDenied If caller lacks FOURTH level access
     */    
    function setEnergyMix(uint256 id, EnergyMix calldata _energy_mix ) access(id) external {
        energy_mix[id] = _energy_mix;
    }

    /**
     * @notice Retrieves complete tariff details by ID
     * @param id Tariff ID to query
     * @return Output Tariff data structure with all associated details
     */    
    function get(uint256 id) external view returns(Output memory) {
        Output memory ret;

        ret.country_code = country_code[id];
        ret.party_id = party_id[id];
        ret.id = id;
        ret.last_updated = last_updated[id];
        ret.tariff = tariffs[id];
        ret.min_price = min_price[id];
        ret.max_price = max_price[id];
        ret.start_date_time = start_date_time[id];
        ret.end_date_time = end_date_time[id];
        ret.energy_mix = energy_mix[id];

        return ret;
    }

    /**
     * @notice Retrieves lightweight tariff details by ID
     * @param id Tariff ID to query
     * @return OutputLight Simplified tariff data structure
     */    
    function getLight(uint256 id) external view returns(OutputLight memory) {
        OutputLight memory ret;

        ret.id = id;
        ret.tariff = tariffs[id];


        return ret;
    }
}
