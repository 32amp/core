// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;


interface ICurrencies {

    struct Currency {
        string country;
        string currency;
        string alphabetic_code;
        uint16 numeric_code;
        uint8 minor_unit;
    }

    function getVersion() external pure returns(string memory);
    function add(Currency memory currency) external;
    function get(uint256 id) external view returns(Currency memory);
    function exist(uint256 id) external view returns(bool);
    function list() view external returns(Currency[] memory);
}