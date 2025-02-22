// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;


import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../Hub/IHub.sol";
import "./ILocation.sol";
import "./ILocationSearch.sol";
import "./IEVSE.sol";
import "../User/IUserAccess.sol";
import "../Utils.sol";
import "../RevertCodes/IRevertCodes.sol";

contract Location is ILocation, Initializable {

    using Utils for string;

    mapping(uint256 => Location) locations;

    mapping(uint256 => AdditionalGeoLocation[]) related_locations;
    mapping(uint256 => Image[]) images_location;
    mapping(uint256 => Hours) opening_times_location; 
    mapping(uint256 => DisplayText[]) directions_location;
    mapping(uint256 => uint256[]) evses_location;

 

    uint256 locationCounter;
    address hubContract;
    uint256 partner_id;
    uint256 timestampCounter;

    function initialize(uint256 _partner_id, address _hubContract) public initializer {
        hubContract = _hubContract;
        partner_id = _partner_id;
    }

    function registerRevertCodes() external {
        _RevertCodes().registerRevertCode("Location", "EVSE_does_not_exist", "EVSE does not exist");
        _RevertCodes().registerRevertCode("Location", "access_denied", "Access denied, you must have access to module Location not lower than four");
    }

    function getVersion() external pure returns(string memory){
        return "1.0";
    }

    function _UserAccess() private view returns(IUserAccess) {
        return IUserAccess(IHub(hubContract).getModule("UserAccess", partner_id));
    }

    function _EVSE() private view returns(IEVSE) {
        return IEVSE(IHub(hubContract).getModule("EVSE", partner_id));
    }

    function _LocationSearch() private view returns(ILocationSearch) {
        return ILocationSearch(IHub(hubContract).getModule("LocationSearch", partner_id));
    }

    function _RevertCodes() private view returns(IRevertCodes) {
        return IRevertCodes(IHub(hubContract).getModule("RevertCodes", partner_id));
    }

    function _panic(string memory code) private {
        _RevertCodes().panic("Location", code);
    }

    modifier access(uint256 location_id){
        _UserAccess().checkAccess( msg.sender, "Location", bytes32(location_id), uint(IUserAccess.AccessLevel.FOURTH));
        _;
    }

    function addRelatedLocation(uint256 location_id, AdditionalGeoLocation calldata add ) access(location_id) external {
        related_locations[location_id].push(add);
        _updated(location_id);
    }

    function removeRelatedLocation( uint256 location_id, uint loc_id) access(location_id) external {

        for (uint i = loc_id; i < related_locations[location_id].length - 1; i++) {
            related_locations[location_id][i] = related_locations[location_id][i + 1];
        }

        related_locations[location_id].pop();
        _updated(location_id);
    }

    function addImage(uint256 location_id, Image calldata add ) access(location_id) external {
        images_location[location_id].push(add);
        _updated(location_id);
    }

    function removeImage( uint256 location_id, uint image_id) access(location_id) external {

        for (uint i = image_id; i < images_location[location_id].length - 1; i++) {
            images_location[location_id][i] = images_location[location_id][i + 1];
        }

        images_location[location_id].pop();
        
        _updated(location_id);
    }

    function addDirection(uint256 location_id, DisplayText calldata add ) access(location_id) external {
        directions_location[location_id].push(add);
        _updated(location_id);
    }


    function removeDirection(uint256 location_id, uint direction_id) access(location_id) external {
        for (uint i = direction_id; i < directions_location[location_id].length - 1; i++) {
            directions_location[location_id][i] = directions_location[location_id][i + 1];
        }

        directions_location[location_id].pop();
        _updated(location_id);
    }


    function addEVSE(uint256 location_id,  uint256 add ) access(location_id) external {
        
        if(IHub(hubContract).getModule("EVSE", partner_id) != msg.sender)
            if(!_EVSE().exist(add))
                revert("EVSE_does_not_exist");

        evses_location[location_id].push(add);

        _updated(location_id);
    }


    function removeEVSE(uint256 location_id, uint evse) access(location_id) external {

        for (uint i = evse; i < evses_location[location_id].length - 1; i++) {
            evses_location[location_id][i] = evses_location[location_id][i + 1];
        }

        evses_location[location_id].pop();

        _updated(location_id);
    }

    function setOpeningTimes( uint256 location_id, Hours calldata add ) access(location_id) external {
        opening_times_location[location_id] = add;
        _updated(location_id); 
    }


    function addLocation(Add memory add ) external {

        

        uint access_level = _UserAccess().getModuleAccessLevel("Location", msg.sender);

        if(access_level < uint(IUserAccess.AccessLevel.FOURTH)){
            revert("access_denied");
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
    

    function exist(uint256 location_id) public view returns (bool) {
        
        if(locations[location_id].uid == location_id)
            return true;
        
        return false;
    }

    function _updated(uint256 location_id) internal {
        locations[location_id].last_updated = block.timestamp+timestampCounter;

        timestampCounter++;

        if(timestampCounter == 20)
            timestampCounter = 0;
    }
}