// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;


import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../Hub/IHub.sol";
import "./ILocation.sol";
import "./ILocationSearch.sol";
import "./IEVSE.sol";
import "../User/IUserAccess.sol";
import "../Utils.sol";

/**
 * @title Location Management Contract
 * @notice Handles geolocation data and related services for charging stations
 * @dev Upgradeable contract integrated with Hub ecosystem
 * @custom:warning Requires proper initialization via Hub contract
 */
contract Location is ILocation, Initializable {
    using Utils for string;

    /// @dev Main location storage mapped by location ID
    mapping(uint256 => Location) locations;
    
    /// @dev Additional geo-coordinates associated with locations
    mapping(uint256 => AdditionalGeoLocation[]) related_locations;
    
    /// @dev Image metadata storage for location visuals
    mapping(uint256 => Image[]) images_location;
    
    /// @dev Opening hours configuration for locations
    mapping(uint256 => Hours) opening_times_location;
    
    /// @dev Navigation instructions for locations
    mapping(uint256 => DisplayText[]) directions_location;
    
    /// @dev List of EVSE IDs associated with locations
    mapping(uint256 => uint256[]) evses_location;

    /// @dev Auto-incrementing location ID tracker
    uint256 locationCounter;
    
    /// @notice Reference to Hub contract address
    address hubContract;
    
    /// @notice Associated partner ID from Hub
    uint256 partner_id;
    
    /// @dev Cyclic timestamp counter for update tracking
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

    /// @dev Returns UserAccess module interface
    function _UserAccess() private view returns(IUserAccess) {
        return IUserAccess(IHub(hubContract).getModule("UserAccess", partner_id));
    }

    /// @dev Returns EVSE module interface
    function _EVSE() private view returns(IEVSE) {
        return IEVSE(IHub(hubContract).getModule("EVSE", partner_id));
    }

    /// @dev Returns LocationSearch module interface
    function _LocationSearch() private view returns(ILocationSearch) {
        return ILocationSearch(IHub(hubContract).getModule("LocationSearch", partner_id));
    }


    /// @notice Access control modifier requiring FOURTH level privileges
    modifier access(uint256 location_id){
        _UserAccess().checkAccess( msg.sender, "Location", bytes32(location_id), uint(IUserAccess.AccessLevel.FOURTH));
        _;
    }

    /**
     * @notice Adds supplementary geographic reference
     * @param location_id Target location ID
     * @param add AdditionalGeoLocation data structure
     * @custom:reverts "AccessDenied" if insufficient privileges
     */    
    function addRelatedLocation(uint256 location_id, AdditionalGeoLocation calldata add ) access(location_id) external {
        related_locations[location_id].push(add);
        _updated(location_id);
    }

    /**
     * @notice Removes geographic reference by index
     * @param location_id Target location ID
     * @param loc_id Index in related_locations array
     * @custom:reverts "AccessDenied" if insufficient privileges
     */    
    function removeRelatedLocation( uint256 location_id, uint loc_id) access(location_id) external {

        for (uint i = loc_id; i < related_locations[location_id].length - 1; i++) {
            related_locations[location_id][i] = related_locations[location_id][i + 1];
        }

        related_locations[location_id].pop();
        _updated(location_id);
    }

    /**
     * @notice Adds image metadata to location
     * @param location_id Target location ID
     * @param add Image structure containing URL and description
     * @custom:reverts "AccessDenied" если уровень доступа ниже FOURTH
     * @dev Stores image references off-chain (IPFS/HTTP)
     */    
    function addImage(uint256 location_id, Image calldata add ) access(location_id) external {
        images_location[location_id].push(add);
        _updated(location_id);
    }

    /**
     * @notice Removes image by index
     * @param location_id Target location ID
     * @param image_id Index in images array
     * @custom:warning Не проверяет существование индекса - может вызвать out-of-bounds ошибку
     * @custom:reverts "AccessDenied" при недостаточных правах
     */    
    function removeImage( uint256 location_id, uint image_id) access(location_id) external {

        for (uint i = image_id; i < images_location[location_id].length - 1; i++) {
            images_location[location_id][i] = images_location[location_id][i + 1];
        }

        images_location[location_id].pop();
        
        _updated(location_id);
    }

    /**
     * @notice Adds navigation instructions
     * @param location_id Target location ID
     * @param add DisplayText structure с языковыми переводами
     * @custom:reverts "AccessDenied" если нет прав FOURTH уровня
     * @dev Поддерживает мультиязычные инструкции
     */    
    function addDirection(uint256 location_id, DisplayText calldata add ) access(location_id) external {
        directions_location[location_id].push(add);
        _updated(location_id);
    }


    /**
    * @notice Removes direction by index
    * @param location_id Target location ID
    * @param direction_id Index in directions array
    * @custom:warning Shifts array elements when removing
    * @custom:reverts "AccessDenied" if permissions are insufficient
    */  
    function removeDirection(uint256 location_id, uint direction_id) access(location_id) external {
        for (uint i = direction_id; i < directions_location[location_id].length - 1; i++) {
            directions_location[location_id][i] = directions_location[location_id][i + 1];
        }

        directions_location[location_id].pop();
        _updated(location_id);
    }

    /**
    * @notice Links EVSE charging station to location
    * @param location_id Target location ID
    * @param add EVSE ID to associate
    * @custom:reverts "EvseDoesNotExist" if EVSE is not registered
    * @custom:reverts "AccessDenied" if there are insufficient rights
    * @dev Requires valid EVSE registration via the appropriate module
    */
    function addEVSE(uint256 location_id,  uint256 add ) access(location_id) external {
        
        if(IHub(hubContract).getModule("EVSE", partner_id) != msg.sender)
            if(!_EVSE().exist(add))
                revert ObjectNotFound("EVSE",add);

        evses_location[location_id].push(add);

        _updated(location_id);
    }

    /**
    * @notice Unlinks EVSE from location
    * @param location_id Target location ID
    * @param evse Index in evses array
    * @custom:warning Doesn't check for EVSE existence when deleting
    * @custom:reverts "AccessDenied" if permissions are insufficient
    */
    function removeEVSE(uint256 location_id, uint evse) access(location_id) external {

        for (uint i = evse; i < evses_location[location_id].length - 1; i++) {
            evses_location[location_id][i] = evses_location[location_id][i + 1];
        }

        evses_location[location_id].pop();

        _updated(location_id);
    }

    /**
    * @notice Updates operating hours schedule
    * @param location_id Target location ID
    * @param add Hours structure with time slots
    * @custom:reverts "AccessDenied" if insufficient rights
    * @dev Completely replaces the previous work schedule
    */  
    function setOpeningTimes( uint256 location_id, Hours calldata add ) access(location_id) external {
        opening_times_location[location_id] = add;
        _updated(location_id); 
    }

    /**
     * @notice Creates new charging location entry
     * @param add Add data structure containing location details
     * @custom:reverts "AccessDenied" if access level < FOURTH
     * @custom:emits AddLocation On successful creation
     */
    function addLocation(Add calldata add ) external {

        

        uint access_level = _UserAccess().getModuleAccessLevel("Location", msg.sender);

        if(access_level < uint(IUserAccess.AccessLevel.FOURTH)){
            revert AccessDenied("Location");
        }
        
        locationCounter++;
        Location memory newLocation;
        newLocation.name = add.name;

        newLocation._address = add._address;
        newLocation.city = add.city;
        newLocation.postal_code = add.postal_code;
        newLocation.state = add.state;
        newLocation.country = add.country;
        newLocation.coordinates.latitude = add.coordinates.latitude.stringToInt32();
        newLocation.coordinates.longtitude = add.coordinates.longtitude.stringToInt32();
        newLocation.parking_type = add.parking_type;
        newLocation.facilities = add.facilities;
        newLocation.time_zone = add.time_zone;
        newLocation.charging_when_closed = add.charging_when_closed;
        newLocation.publish = add.publish;


        newLocation.operator = partner_id;
        newLocation.owner = msg.sender;
        newLocation.country_code = IHub(hubContract).getPartnerCountryCode(partner_id);
        newLocation.party_id = IHub(hubContract).getPartnerPartyId(partner_id);
        
        newLocation.uid = locationCounter;
        
        locations[locationCounter] = newLocation;
        

        _updated(locationCounter); 

        int16 lat_integerPart = add.coordinates.latitude.splitCoordinate();
        int16 lon_integerPart = add.coordinates.longtitude.splitCoordinate();
        
        _LocationSearch().addLocationToIndex(lat_integerPart,lon_integerPart,locationCounter);
        _UserAccess().setAccessLevelToModuleObject(bytes32(locationCounter),msg.sender,"Location",IUserAccess.AccessLevel.FOURTH);   
        
        emit AddLocation(locationCounter, partner_id, msg.sender);
    }

    /**
     * @notice Retrieves complete location data
     * @param id Location ID to query
     * @return loc outLocation structure with aggregated data
     */
    function getLocation(uint256 id) external view returns (outLocation memory){

        outLocation memory loc;


        loc.location = locations[id];
        loc.related_locations = related_locations[id];
        loc.images = images_location[id];
        loc.opening_times = opening_times_location[id];
        loc.directions = directions_location[id];

        if(evses_location[id].length > 0){
            IEVSE.outEVSE[] memory evses = new IEVSE.outEVSE[](evses_location[id].length);

            for (uint i = 0; i < evses_location[id].length; i++) {
                evses[i] = _EVSE().get(evses_location[id][i]);
            }
    
            loc.evses = evses;
        }


        return loc;
    }
    
    /// @notice Checks existence of location ID
    function exist(uint256 location_id) public view returns (bool) {
        
        if(locations[location_id].uid == location_id)
            return true;
        
        return false;
    }

    /// @dev Internal update tracker with cyclic timestamp counter    
    function _updated(uint256 location_id) internal {
        locations[location_id].last_updated = block.timestamp+timestampCounter;

        timestampCounter++;

        if(timestampCounter == 20)
            timestampCounter = 0;
    }
}