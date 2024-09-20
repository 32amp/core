// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;


import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "../Hub/IHub.sol";
import "./DataTypes.sol";
import "./ILocation.sol";
import "../User/IUser.sol";
import "../User/IUserAccess.sol";
import "../Utils.sol";
import "hardhat/console.sol";

contract Location is ILocation, Initializable {

    using Utils for string;

    mapping(uint256 => DataTypesLocation.Location) locations;

    mapping(int16 => mapping(int16 => uint256[])) locations_index;

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
        newLocation.coordinates.latitude = add.coordinates.latitude.stringToInt32();
        newLocation.coordinates.longitude = add.coordinates.longitude.stringToInt32();
        newLocation.parking_type = add.parking_type;
        newLocation.facilities = add.facilities;
        newLocation.time_zone = add.time_zone;
        newLocation.charging_when_closed = add.charging_when_closed;
        newLocation.publish = add.publish;


        newLocation.operator = partner_id;
        newLocation.owner = user_id;
        newLocation.country_code = IHub(hubContract).getPartnerCountryCode(partner_id);
        newLocation.party_id = IHub(hubContract).getPartnerPartyId(partner_id);
        newLocation.last_updated = block.timestamp;
        newLocation.uid = locationCounter;
        locations[locationCounter] = newLocation;
        int16 lat_integerPart = add.coordinates.latitude.splitCoordinate();
        int16 lon_integerPart = add.coordinates.longitude.splitCoordinate();
        locations_index[lat_integerPart][lon_integerPart].push(locationCounter);
        emit AddLocation(locationCounter, partner_id, user_id);

        return locationCounter;
    }


    function getLocation(uint256 id) external view returns (DataTypesLocation.Location memory){
        return locations[id];
    }


    function inArea(inAreaInput memory input) external view returns (DataTypesLocation.Location[] memory, uint256) {

        uint64 output_count = 50;


        int16 topRightLat_integerPart = input.topRightLat.splitCoordinate();
        int16 topRightLong_integerPart = input.topRightLong.splitCoordinate();
        int16 bottomLeftLat_integerPart = input.bottomLeftLat.splitCoordinate();
        int16 bottomLeftLong_integerPart = input.bottomLeftLong.splitCoordinate();


        if(topRightLat_integerPart != bottomLeftLat_integerPart && topRightLong_integerPart != bottomLeftLong_integerPart)
            return inAreaGlobalSearch(input,output_count);
        else
            return inAreaLocalSearch(input,output_count);
    }


    function inAreaLocalSearch(inAreaInput memory input, uint64 output_count) private view returns (DataTypesLocation.Location[] memory, uint256) {
        uint64 count = 0;

        uint256[] storage locationIds =  locations_index[input.topRightLat.splitCoordinate()][input.topRightLong.splitCoordinate()];

        int256 topRightLat = input.topRightLat.stringToInt32();
        int256 bottomLeftLat = input.bottomLeftLat.stringToInt32();
        int256 topRightLong = input.topRightLong.stringToInt32();
        int256 bottomLeftLong = input.bottomLeftLong.stringToInt32();

        // Первоначальный подсчет количества локаций в области
        for (uint256 i = 0; i < locationIds.length; i++) {
            uint256 id = locationIds[i];

            if (
                locations[id].coordinates.latitude <= topRightLat &&
                locations[id].coordinates.latitude >= bottomLeftLat &&
                locations[id].coordinates.longitude <= topRightLong &&
                locations[id].coordinates.longitude >= bottomLeftLong &&
                locations[id].publish
            ) {
                count++;
            }
        }
        
        
        if(input.offset >= count)
            revert("big_offset");

        // Создание идекса для вывода
        uint256[] memory outputIds = new uint256[](count);

        {
            uint256 _index = 0;
            for (uint256 i = 0; i < locationIds.length; i++) {
                uint256 id = locationIds[i];
    
                if (
                    locations[id].coordinates.latitude <= topRightLat &&
                    locations[id].coordinates.latitude >= bottomLeftLat &&
                    locations[id].coordinates.longitude <= topRightLong &&
                    locations[id].coordinates.longitude >= bottomLeftLong &&
                    locations[id].publish
                ) {
                    
                    outputIds[_index] = id;
                    _index++;
                }
            }
        }



        if(count < output_count )
            output_count = count;

        if(count-input.offset < output_count)
            output_count = count-input.offset;

        // Создание массива для хранения результатов
        DataTypesLocation.Location[] memory results = new DataTypesLocation.Location[](output_count);

        {
            uint256 index = 0;

            // Заполнение массива результатами
            for (uint256 i = input.offset; i < outputIds.length; i++) {
                uint256 id = outputIds[i];

                if(output_count == index)
                    break;

                results[index] = locations[id];
                index++;

            }
        }

        return (results,count);
    }

    function inAreaGlobalSearch(inAreaInput memory input, uint64 output_count) private view returns (DataTypesLocation.Location[] memory, uint256) {

        uint64 count = 0;
        int16 i_vertical_start;
        int16 i_vertical_end;
        int16 i_horisontal_start;
        int16 i_horisontal_end;
        
        {
            int16 topRightLat_integerPart = input.topRightLat.splitCoordinate();
            int16 topRightLong_integerPart = input.topRightLong.splitCoordinate();
            int16 bottomLeftLat_integerPart = input.bottomLeftLat.splitCoordinate();
            int16 bottomLeftLong_integerPart = input.bottomLeftLong.splitCoordinate();

            if(topRightLong_integerPart < bottomLeftLong_integerPart){
                i_vertical_start = topRightLong_integerPart;
                i_vertical_end = bottomLeftLong_integerPart;
            }else{
                i_vertical_start = bottomLeftLong_integerPart;
                i_vertical_end = topRightLong_integerPart;
            }

            if(topRightLat_integerPart < bottomLeftLat_integerPart){
                i_horisontal_start = topRightLat_integerPart;
                i_horisontal_end = bottomLeftLat_integerPart;
            }else{
                i_horisontal_start = bottomLeftLat_integerPart;
                i_horisontal_end = topRightLat_integerPart;
            }
        }

        
        for (int16 i = i_vertical_start; i <= i_vertical_end; i++) {
            for (int16 i_2 = i_horisontal_start; i_2 < i_horisontal_end; i_2++) {

                if(locations_index[i_2][i].length > 0){
                    count += uint64(locations_index[i_2][i].length);

                }
            }
        }

        if(input.offset >= count)
            revert("big_offset");
        
        if(count < output_count )
            output_count = count;

        if(count-input.offset < output_count)
            output_count = count-input.offset;

        DataTypesLocation.Location[] memory results = new DataTypesLocation.Location[](output_count);


        {
            uint32 index = 0;
            uint8 index_2 = 0;

            for (int16 i = i_vertical_start; i <= i_vertical_end; i++) {
                for (int16 i_2 = i_horisontal_start; i_2 < i_horisontal_end; i_2++) {

                    if(locations_index[i_2][i].length > 0){
                        for (uint i_loc = 0; i_loc < locations_index[i_2][i].length; i_loc++) {
                            if(index >= input.offset && index_2 < output_count){
                                results[index_2] = locations[locations_index[i_2][i][i_loc]];
                                index_2++;
                            }
                            index++;
                        }
                    }
                }
            }
        }

        return (results,count);
    }



    function exist(uint256 location_id) public view returns (bool) {
        
        if(locations[location_id].uid == location_id)
            return true;
        
        return false;
    }



}