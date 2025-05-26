// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../Hub/IHub.sol";
import "./IEVSE.sol";
import "./IConnector.sol";
import "../Tariff/ITariff.sol";
import "../User/IUserAccess.sol";

/**
 * @title Connector Management Contract
 * @author Mikhail Ivantsov
 * @notice Handles operations for charging connectors
 * @dev Upgradeable contract integrated with Hub ecosystem
 * @custom:warning Requires proper initialization via Hub contract
 */
contract Connector is IConnector, Initializable {
    // State variables documentation
    /// @notice Hub contract reference
    address hubContract;
    
    /// @notice Associated partner ID
    uint256 partner_id;
    
    /// @dev Auto-incrementing connector ID counter
    uint256 connector_counter;

    // Storage mappings documentation
    /// @dev Primary connector data storage
    mapping (uint256 => Connector) connectors;
    
    /// @dev Last update timestamps
    mapping (uint256 => uint256) last_updated;
    
    /// @dev Operational status tracking
    mapping (uint256 => ConnectorStatus) connector_status;
    
    /// @dev Tariff associations
    mapping (uint256 => uint256) connector_tariff;

    /**
     * @notice Initializes contract with Hub connection
     * @param _partner_id Partner ID from Hub registry
     * @param _hubContract Address of Hub contract
     * @custom:init Called once during proxy deployment
     */
    function initialize(uint256 _partner_id, address _hubContract) public initializer {
        hubContract = _hubContract;
        partner_id = _partner_id;
    }

    /// @notice Returns current contract version
    function getVersion() external pure returns(string memory){
        return "1.0";
    }

    /// @notice Access control modifier requiring FOURTH level privileges
    modifier access( uint256 id) {

        _UserAccess().checkAccess(msg.sender, "Connector", bytes32(id), uint(IUserAccess.AccessLevel.FOURTH));
        _;
    }

    // Module accessors documentation
    /// @dev Returns UserAccess module interface
    function _UserAccess() private view returns(IUserAccess) {
        return IUserAccess(IHub(hubContract).getModule("UserAccess", partner_id));
    }

    /// @dev Returns EVSE module interface
    function _EVSE() private view returns(IEVSE) {
        return IEVSE(IHub(hubContract).getModule("EVSE", partner_id));
    }

    /// @dev Returns Tariff module interface
    function _Tariff() private view returns(ITariff) {
        return ITariff(IHub(hubContract).getModule("Tariff", partner_id));
    }
    

    /**
     * @notice Registers new connector
     * @param connector Connector data structure
     * @param evse_id Associated EVSE ID
     * @custom:reverts "AccessDeniedLevel:Fourth" if access level < FOURTH
     * @custom:reverts "ObjectNotFound:EVSE" if invalid EVSE reference
     * @custom:emits AddConnector On successful registration
     */
    function add( Connector calldata connector, uint256 evse_id) external {
        
        uint access_level = _UserAccess().getModuleAccessLevel("Connector", msg.sender);

        if(access_level < uint(IUserAccess.AccessLevel.FOURTH)){
            revert AccessDeniedLevel("Connector",uint8(IUserAccess.AccessLevel.FOURTH));
        }

        if(!_EVSE().exist(evse_id))
            revert ObjectNotFound("EVSE",evse_id);

        connector_counter++;

        connectors[connector_counter] = connector;

        _UserAccess().setAccessLevelToModuleObject(bytes32(connector_counter),msg.sender,"Connector",IUserAccess.AccessLevel.FOURTH);
        _EVSE().addConnector(evse_id, connector_counter);


        emit AddConnector(connector_counter, partner_id, msg.sender);

        _updated(connector_counter);
    }

    /**
     * @notice Assigns tariff to connector
     * @param id Connector ID
     * @param _tariff Tariff ID to assign
     * @custom:reverts "ObjectNotFound:Tariff" if invalid tariff reference
     * @custom:reverts "AccessDenied" if insufficient privileges
     */
    function setTariffs( uint256 id, uint256  _tariff) access(id) external {

        if(!_Tariff().exist(_tariff))
            revert ObjectNotFound("Tariff", _tariff);

        connector_tariff[id] = _tariff;
    }

    /**
     * @notice Retrieves complete connector data
     * @param id Connector ID to query
     * @return output Aggregated connector information
     */
    function get(uint256 id) external view returns (output memory) {
        output memory ret;

        ret.id = id;
        ret.connector = connectors[id];
        ret.last_updated = last_updated[id];
        ret.status = connector_status[id];
        ret.tariff = connector_tariff[id];


        return ret;
    }

    /**
     * @notice Checks connector existence
     * @param id Connector ID to verify
     * @return bool True if connector exists
     */
    function exist(uint256 id) external view returns(bool){
        if(last_updated[id] != 0)
            return true;
        
        return false;
    }
    
    /// @dev Internal update tracker
    function _updated(uint256 id) internal {
        last_updated[id] = block.timestamp;
    }
}