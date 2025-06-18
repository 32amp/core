// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./DataTypes.sol";


library Utils  {

    /**
     * @notice Removes an element from AdditionalGeoLocation array by index
     * @dev Shifts elements to the left and reduces the array length
     * @param array Storage array of AdditionalGeoLocation
     * @param index Index of the element to remove
     */
    function removeElement(DataTypes.AdditionalGeoLocation[] storage array, uint index) internal {
        require(index < array.length, "Invalid index");
        for (uint i = index; i < array.length-1; i++) {
            array[i] = array[i+1];
        }
        array.pop();
    }

    /**
     * @notice Removes an element from Image array by index
     * @dev Shifts elements to the left and reduces the array length
     * @param array Storage array of Image
     * @param index Index of the element to remove
     */
    function removeElement(DataTypes.Image[] storage array, uint index) internal {
        require(index < array.length, "Invalid index");
        for (uint i = index; i < array.length-1; i++) {
            array[i] = array[i+1];
        }
        array.pop();
    }

    /**
     * @notice Removes an element from DisplayText array by index
     * @dev Shifts elements to the left and reduces the array length
     * @param array Storage array of DisplayText
     * @param index Index of the element to remove
     */
    function removeElement(DataTypes.DisplayText[] storage array, uint index) internal {
        require(index < array.length, "Invalid index");
        for (uint i = index; i < array.length-1; i++) {
            array[i] = array[i+1];
        }
        array.pop();
    }

    /**
     * @notice Removes an element from uint256 array by index
     * @dev Shifts elements to the left and reduces the array length
     * @param array Storage array of uint256
     * @param index Index of the element to remove
     */
    function removeElement(uint256[] storage array, uint index) internal {
        require(index < array.length, "Invalid index");
        for (uint i = index; i < array.length-1; i++) {
            array[i] = array[i+1];
        }
        array.pop();
    }

    /**
     * @notice Converts a coordinate string to int16 (integer part only)
     * @dev Returns only the integer part of the coordinate
     * @param coordinate Coordinate string (e.g. "55.7558")
     * @return Integer part of the coordinate
     */
    function splitCoordinate(string memory coordinate) internal pure returns (int16) {
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
        int16 integerPart = parseInt(integerPartBytes);

        // Учитывать отрицательность числа
        if (isNegative) {
            integerPart = -integerPart;
        }


        return integerPart;
    }


    /**
     * @notice Converts a float string to int256 (integer part only)
     * @dev Supports negative values
     * @param floatString String with a number (e.g. "-123.45")
     * @return Integer part of the number
     */
    function stringToInt32(string memory floatString) internal pure returns (int256) {
        bytes memory byteString = bytes(floatString);
        int256 integerPart = 0;
        bool isNegative = false;
        uint256 i = 0;

        // Check for negative sign
        if (byteString[i] == '-') {
            isNegative = true;
            i++;
        }

        uint limit = 18;

        // Iterate through each character until we hit a '.' or end of string
        for (; i <= limit; i++) {

            if(i < byteString.length){
                if (byteString[i] == '.') {
                    limit = limit + i;
                    continue; // Stop at the decimal point
                }
    
                require(byteString[i] >= '0' && byteString[i] <= '9', "Invalid character in input string");
    
                
                    integerPart = integerPart * 10 + int64(uint64(uint8(byteString[i]) - 48));
            }else
                integerPart = integerPart * 10 + int64(0);
        }

        if (isNegative) {
            integerPart = -integerPart;
        }

        return integerPart;
    }

    /**
     * @notice Converts a bytes array representing a number to int16
     * @dev Used for parsing integer parts of coordinates
     * @param b Bytes array with digits
     * @return Parsed integer value
     */
    function parseInt(bytes memory b) internal pure returns (int16) {
        int16 result = 0;
        for (uint i = 0; i < b.length; i++) {
            require(b[i] >= 0x30 && b[i] <= 0x39, "Invalid character in integer part");
            result = result * 10 + int16(uint16(uint8(b[i]) - 48));
        }
        return result;
    }

    /**
     * @notice Checks if a string is encrypted (starts with "e:")
     * @dev Returns true if the string is empty
     * @param _str String to check
     * @return True if the string is encrypted, otherwise false
     */
    function isEncrypted(string memory _str) public pure returns (bool) {
        bytes memory strBytes = bytes(_str);
        bytes memory prefix = bytes("e:");

        // do not check if string is empty
        if (strBytes.length == 0) return true;

        if (strBytes.length < prefix.length) {
            return false;
        }
        
        for (uint i = 0; i < prefix.length; i++) {
            if (strBytes[i] != prefix[i]) {
                return false;
            }
        }
        
        return true;
    }
}

