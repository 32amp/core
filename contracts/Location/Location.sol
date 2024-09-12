// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;


import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "../Hub/IHub.sol";
import "./DataTypes.sol";
import "./ILocation.sol";
import "../User/IUser.sol";
import "../User/IUserAccess.sol";

import "hardhat/console.sol";

contract Location is ILocation, Initializable {
    mapping(uint256 => DataTypesLocation.Location) locations;

    mapping(int256 => mapping(int256 => uint256[])) locations_index;

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
        newLocation.publish = add.publish;


        newLocation.operator = partner_id;
        newLocation.owner = user_id;
        newLocation.country_code = IHub(hubContract).getPartnerCountryCode(partner_id);
        newLocation.party_id = IHub(hubContract).getPartnerPartyId(partner_id);
        newLocation.last_updated = block.timestamp;
        newLocation.uid = locationCounter;
        locations[locationCounter] = newLocation;
        int256 lat_integerPart = splitCoordinate(newLocation.coordinates.latitude);
        int256 lon_integerPart = splitCoordinate(newLocation.coordinates.longitude);
        locations_index[lat_integerPart][lon_integerPart].push(locationCounter);
        emit AddLocation(locationCounter, partner_id, user_id);

        return locationCounter;
    }


    function getLocation(uint256 id) external view returns (DataTypesLocation.Location memory){
        return locations[id];
    }

    function inArea(
        string memory topRightLat,
        string memory topRightLong,
        string memory bottomLeftLat,
        string memory bottomLeftLong,
        uint256 offset,
        uint8[] memory connectors, // TODO add filter by connector
        bool onlyFreeConnectors // TODO add filter by connector
    ) public view returns (DataTypesLocation.Location[] memory, uint256) {
        int256 topRightLat_integerPart = splitCoordinate(topRightLat);
        int256 topRightLong_integerPart = splitCoordinate(topRightLong);
        int256 bottomLeftLat_integerPart = splitCoordinate(bottomLeftLat);
        int256 bottomLeftLong_integerPart = splitCoordinate(bottomLeftLong);

        uint256 count = 0;
        uint256 output_count = 40;
        int256 i_vertical_start;
        int256 i_vertical_end;
        int256 i_horisontal_start;
        int256 i_horisontal_end;

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

        for (int i = i_vertical_start; i <= i_vertical_end; i++) {
            for (int i_2 = i_horisontal_start; i_2 < i_horisontal_end; i_2++) {

                if(locations_index[i_2][i].length > 0){
                    count += locations_index[i_2][i].length;

                }
            }
        }


        if(count < output_count )
            output_count = count;

        if(count-offset < output_count)
            output_count = count-offset;

        DataTypesLocation.Location[] memory results = new DataTypesLocation.Location[](output_count);

        console.log("output_count %s",output_count);

        uint index = 0;
        uint index_2 = 0;

        for (int i = i_vertical_start; i <= i_vertical_end; i++) {
            for (int i_2 = i_horisontal_start; i_2 < i_horisontal_end; i_2++) {

                if(locations_index[i_2][i].length > 0){
                    for (uint i_loc = 0; i_loc < locations_index[i_2][i].length; i_loc++) {
                            if(index >= offset && index_2 < output_count){
                                results[index_2] = locations[locations_index[i_2][i][i_loc]];
                                index_2++;
                            }
                        index++;
                    }
                }
            }
        }

    

/* 
        // Создание массива для хранения результатов
        DataTypesLocation.Location[] memory results = new DataTypesLocation.Location[](output_count);
        uint256 _index = 0;

        // Заполнение массива результатами
        for (uint256 i = offset; i < outputIds.length; i++) {
            uint256 id = outputIds[i];

            if(output_count == _index)
                break;

            results[_index] = locations[id];
            _index++;

        } */

        return (results,count);
    }




    function exist(uint256 location_id) public view returns (bool) {
        
        if(locations[location_id].uid == location_id)
            return true;
        
        return false;
    }

    function splitCoordinate(string memory coordinate) public pure returns (int256) {
        bytes memory coordinateBytes = bytes(coordinate);
        uint dotIndex;
        bool dotFound = false;
        bool isNegative = false;
        uint startIndex = 0;

        // Проверить, есть ли знак минус в начале
        if (coordinateBytes[0] == "-") {
            isNegative = true;
            startIndex = 1;
        }

        // Найти индекс точки
        for (uint i = startIndex; i < coordinateBytes.length; i++) {
            if (coordinateBytes[i] == ".") {
                dotIndex = i;
                dotFound = true;
                break;
            }
        }

        require(dotFound, "No decimal point found");

        // Создать массив байтов для целой части
        bytes memory integerPartBytes = new bytes(dotIndex - startIndex);

        // Заполнить целую часть
        for (uint i = startIndex; i < dotIndex; i++) {
            integerPartBytes[i - startIndex] = coordinateBytes[i];
        }

        // Преобразовать целую часть в int256
        int256 integerPart = parseInt(integerPartBytes);

        // Учитывать отрицательность числа
        if (isNegative) {
            integerPart = -integerPart;
        }
        return integerPart;
    }

    function parseInt(bytes memory b) internal pure returns (int256) {
        int256 result = 0;
        for (uint i = 0; i < b.length; i++) {
            require(b[i] >= 0x30 && b[i] <= 0x39, "Invalid character in integer part");
            result = result * 10 + int256(uint256(uint8(b[i]) - 48));
        }
        return result;
    }

}