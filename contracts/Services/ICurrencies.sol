// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "../IBaseErrors.sol";

/**
 * @title Currencies Interface
 * @notice Defines the data structure for currency information
 * @dev Inherits error definitions from IBaseErrors for consistent error handling
 */
interface ICurrencies is IBaseErrors {
    /**
     * @title Currency Data Structure
     * @notice Represents complete information about a national currency
     * @dev Aligns with ISO 4217 currency specifications
     * 
     * @param country          Official country name (e.g., "UNITED STATES OF AMERICA")
     * @param currency         Full currency name (e.g., "US Dollar")
     * @param alphabetic_code  3-letter currency code (e.g., "USD")
     * @param symbol           Currency symbol (e.g., "$")
     * @param numeric_code     Numeric ISO code (e.g., 840)
     * @param minor_unit       Decimal places for currency subdivisions (e.g., 2 = cents)
     */
    struct Currency {
        string country;
        string currency;
        string alphabetic_code;
        string symbol;
        uint16 numeric_code;
        uint8 minor_unit;
    }

    function getVersion() external pure returns(string memory);
    function add(Currency calldata currency) external;
    function get(uint256 id) external view returns(Currency memory);
    function exist(uint256 id) external view returns(bool);
    function list() view external returns(Currency[] memory);
}