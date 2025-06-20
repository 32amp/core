// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;


import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../Hub/IHub.sol";
import "./ILocation.sol";
import "./IConnector.sol";
import "./IEVSE.sol";
import "../User/IUserAccess.sol";


/**
 * @title EVSE Management Contract
 * @notice Handles Electric Vehicle Supply Equipment (EVSE) operations
 * @dev Upgradeable contract integrated with Hub ecosystem
 * @custom:warning Requires proper initialization via Hub contract
 */
contract EVSE is IEVSE, Initializable {
    // Storage mappings documentation
    /// @dev Mapping of EVSE IDs to EVSE structs
    mapping (uint256 => EVSE)  evses;
    
    /// @dev Mapping of EVSE IDs to their metadata
    mapping (uint256 => EVSEMeta)  evses_meta;
    
    /// @dev Mapping of EVSE IDs to their operational status
    mapping (uint256 => EVSEStatus)  evses_status;
    
    /// @dev Mapping of EVSE IDs to related location IDs
    mapping (uint256 => uint256)  evses_related_location;
    
    /// @dev Mapping of EVSE IDs to last update timestamps
    mapping (uint256 => uint256) evses_last_updated;
    
    /// @dev Mapping of EVSE IDs to their images
    mapping (uint256 => Image[]) evse_images;
    
    /// @dev Mapping of EVSE IDs to their connector IDs
    mapping (uint256 => uint256[]) evse_connectors;

    // State variables documentation
    /// @notice Reference to the Hub contract
    address hubContract;
    
    /// @notice Partner ID associated with this contract
    uint256 partner_id;
    
    /// @dev Auto-incrementing EVSE ID counter
    uint256 evsecounter;
    
    /// @dev Cyclic timestamp counter for updates
    uint256 timestampCounter;

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

    // Module accessors documentation
    /**
     * @dev Returns the UserAccess module interface for the current partner
     * @return IUserAccess interface instance
     */
    function _UserAccess() private view returns(IUserAccess) {
        return IUserAccess(IHub(hubContract).getModule("UserAccess", partner_id));
    }

    /**
     * @dev Returns the Location module interface for the current partner
     * @return ILocation interface instance
     */
    function _Location() private view returns(ILocation) {
        return ILocation(IHub(hubContract).getModule("Location", partner_id));
    }

    /**
     * @dev Returns the Connector module interface for the current partner
     * @return IConnector interface instance
     */
    function _Connector() private view returns(IConnector) {
        return IConnector(IHub(hubContract).getModule("Connector", partner_id));
    }


    /**
     * @notice Checks EVSE existence
     * @param id EVSE ID to check
     * @return bool True if EVSE exists
     */
    function exist(uint256 id) external view returns(bool){
        if(evses_last_updated[id] != 0)
            return true;
        
        return false;
    }

    /// @notice Access control modifier requiring FOURTH level privileges
    modifier access(uint256 evse_id) {
        _UserAccess().checkAccess( msg.sender, "EVSE", bytes32(evse_id), uint(IUserAccess.AccessLevel.FOURTH));
        _;
    }

    /**
     * @notice Registers new EVSE
     * @param evse EVSE data structure
     * @param location_id Associated location ID
     * @custom:reverts "AccessDenied" if access level < FOURTH
     * @custom:reverts "ObjectNotFound:Location" if invalid location
     * @custom:emits AddEVSE On successful registration
     */
    function add(EVSE calldata evse, uint256 location_id) external {
        
        uint access_level = _UserAccess().getModuleAccessLevel("EVSE", msg.sender);

        if(access_level < uint(IUserAccess.AccessLevel.FOURTH)){
            revert AccessDenied("EVSE");
        }

        if(!_Location().exist(location_id))
            revert ObjectNotFound("Location", location_id);

        evsecounter++;

        evses[evsecounter] = evse;
        evses_status[evsecounter] = EVSEStatus.Planned;
        evses_related_location[evsecounter] = location_id;

        _UserAccess().setAccessLevelToModuleObject(bytes32(evsecounter), msg.sender, "EVSE", IUserAccess.AccessLevel.FOURTH);

        _Location().addEVSE(location_id, evsecounter);

        emit AddEVSE(evsecounter, partner_id, msg.sender);        
        _updated(evsecounter);
    }

    /**
     * @notice Updates EVSE metadata
     * @param evse_id Target EVSE ID
     * @param meta Metadata structure
     * @custom:reverts "AccessDenied" if insufficient privileges
     */    
    function setMeta(uint256 evse_id, EVSEMeta calldata meta) access(evse_id) external {
        evses_meta[evse_id] = meta;
        _updated(evse_id);
    }

    /**
     * @notice Updates address of OCPP proxy contract
     * @param evse_id Target EVSE ID
     * @param ocpp_proxy Address of OCPP proxy contract
     * @custom:reverts "AccessDenied" if insufficient privileges
     */  
    function setOcppProxy(uint256 evse_id, address ocpp_proxy) access(evse_id) external {
        evses[evse_id].ocpp_proxy = ocpp_proxy;
        _updated(evse_id);
    }

    /**
     * @notice Adds image reference to EVSE
     * @param evse_id Target EVSE ID
     * @param image Image data structure
     * @custom:reverts "AccessDenied" if insufficient privileges
     */
    function addImage( uint256 evse_id, Image calldata image ) access(evse_id) external {
        evse_images[evse_id].push(image);
        _updated(evse_id);
    }

    /**
     * @notice Removes image by index
     * @param evse_id Target EVSE ID
     * @param image_id Image array index
     * @custom:reverts "AccessDenied" if insufficient privileges
     * @custom:warning No bounds checking - may revert on invalid index
     */    
    function removeImage(uint256 evse_id, uint image_id) access(evse_id) external {

        for (uint i = image_id; i < evse_images[evse_id].length - 1; i++) {
            evse_images[evse_id][i] = evse_images[evse_id][i + 1];
        }

        evse_images[evse_id].pop();
        _updated(evse_id);
    }

    /**
     * @notice Updates EVSE operational status
     * @param evse_id Target EVSE ID
     * @param status New status value
     * @custom:reverts "AddConnectorFirst" if setting Available without connectors
     * @custom:reverts "AccessDenied" if insufficient privileges
     */    
    function setStatus( uint256 evse_id, EVSEStatus status) access(evse_id) external {
        
        if(evse_connectors[evse_id].length == 0 && status == EVSEStatus.Available)
            revert AddConnectorFirst();

        evses_status[evse_id] = status;
    }

    /**
     * @notice Associates connector with EVSE
     * @param evse_id Target EVSE ID
     * @param connector_id Connector ID to add
     * @custom:reverts "ObjectNotFound:Connector" if invalid connector
     * @custom:reverts "AccessDenied" if insufficient privileges
     */    
    function addConnector(uint256 evse_id,  uint256 connector_id ) access(evse_id) external {
        
        if(IHub(hubContract).getModule("Connector", partner_id) != msg.sender)
            if(!_Connector().exist(connector_id))
                revert ObjectNotFound("Connector", connector_id);

        evse_connectors[evse_id].push(connector_id);
        _updated(evse_id);
    }

    /**
     * @notice Removes connector association
     * @param evse_id Target EVSE ID
     * @param connector_id Connector array index
     * @custom:reverts "AccessDenied" if insufficient privileges
     * @custom:warning No bounds checking - may revert on invalid index
     */
    function removeConnector(uint256 evse_id, uint connector_id) access(evse_id) external {
        
        for (uint i = connector_id; i < evse_connectors[evse_id].length - 1; i++) {
            evse_connectors[evse_id][i] = evse_connectors[evse_id][i + 1];
        }

        evse_connectors[evse_id].pop();
        _updated(evse_id);
    }



    /**
     * @notice Retrieves complete EVSE data
     * @param evse_id EVSE ID to query
     * @return outEVSE Aggregated EVSE information
     */
    function get(uint256 evse_id) external view returns(outEVSE memory){
        outEVSE memory ret;

        ret.evse = evses[evse_id];
        ret.meta = evses_meta[evse_id];
        ret.evses_status = evses_status[evse_id];
        ret.last_updated = evses_last_updated[evse_id];
        ret.location_id = evses_related_location[evse_id];
        ret.images = evse_images[evse_id];

        if(evse_connectors[evse_id].length > 0){
            IConnector.output[] memory connectors = new IConnector.output[](evse_connectors[evse_id].length);

            for (uint i = 0; i < evse_connectors[evse_id].length; i++) {
                connectors[i] = _Connector().get(evse_connectors[evse_id][i]);
            }
            ret.connectors = connectors;
        }


        return ret;
    }


    /**
     * @notice Retrieves address of OCPP proxy contract
     * @param evse_id EVSE ID to query
     * @return address address of OCPP proxy contract
     */
    function getOcppProxy(uint256 evse_id)  external view returns (address) {
        return evses[evse_id].ocpp_proxy;
    }

    /**
     * @dev Internal function to update the last_updated timestamp for an EVSE
     * @param id EVSE ID to update
     */
    function _updated(uint256 id) internal {
        evses_last_updated[id] = block.timestamp;
    }

}