// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;


import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../Hub/IHub.sol";
import "./DataTypes.sol";
import "./ILocation.sol";
import "../User/IUser.sol";
import "../User/IUserAccess.sol";

contract Location is ILocation, Initializable {
    mapping(uint256 => DataTypesLocation.Location) locations;
    uint256 locationCounter;
    address hubContract;
    string version;
    uint256 partner_id;

    function initialize(uint256 _partner_id, address _hubContract) public initializer {
        hubContract = _hubContract;
        partner_id = _partner_id;
        version = "1.0";
    }

    function getVersion() external view returns (string memory) {
        return version;
    }

    function _UserAccess() private view returns(IUserAccess) {
        return IUserAccess(IHub(hubContract).getModule("UserAccess", partner_id));
    }

    function _User() private view returns(IUser) {
        return IUser(IHub(hubContract).getModule("User", partner_id));
    }

    function addLocation(bytes32 _token, Add memory add ) public returns(uint256) {

        uint256 user_id = _User().isLogin(_token);

        uint access_level = _UserAccess().getModuleAccessLevel("Location", user_id);

        if(access_level < uint(IUserAccess.AccessLevel.FOURTH)){
            revert("access_denied");
        }
        
        locationCounter++;
        DataTypesLocation.Location memory newLocation;
        newLocation.name = add.name;

        newLocation._address = add._address;
        newLocation.city = add.city;
        newLocation.postal_code = add.postal_code;
        newLocation.state = add.state;
        newLocation.country = add.country;
        newLocation.coordinates = add.coordinates;
        newLocation.parking_type = add.parking_type;
        newLocation.facilities = add.facilities;
        newLocation.time_zone = add.time_zone;
        newLocation.charging_when_closed = add.charging_when_closed;


        newLocation.operator = partner_id;
        newLocation.owner = user_id;
        newLocation.country_code = IHub(hubContract).getPartnerCountryCode(partner_id);
        newLocation.party_id = IHub(hubContract).getPartnerPartyId(partner_id);
        newLocation.last_updated = block.timestamp;
        newLocation.uid = locationCounter;
        locations[locationCounter] = newLocation;
        
        emit AddLocation(locationCounter, partner_id, user_id);
        
        return locationCounter;
    }


    function getLocation(uint256 id) external view returns (DataTypesLocation.Location memory){
        return locations[id];
    }

    function exist(uint256 location_id) public view returns (bool) {
        
        if(locations[location_id].uid == location_id)
            return true;
        
        return false;
    }

}