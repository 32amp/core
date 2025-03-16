// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;


library Utils {

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

    function parseInt(bytes memory b) internal pure returns (int16) {
        int16 result = 0;
        for (uint i = 0; i < b.length; i++) {
            require(b[i] >= 0x30 && b[i] <= 0x39, "Invalid character in integer part");
            result = result * 10 + int16(uint16(uint8(b[i]) - 48));
        }
        return result;
    }
}

