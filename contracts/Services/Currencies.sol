// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./ICurrencies.sol";

contract Currencies is ICurrencies, Initializable, OwnableUpgradeable {


    uint256 counter;


    mapping (uint256 => Currency) currencies;
    mapping (string => uint256) isexist;

    function initialize() public initializer {
        
        Currency memory first =  Currency({
            country: "UNITED STATES OF AMERICA",
            currency: "US Dollar",
            alphabetic_code: "USD",
            numeric_code: 840,
            minor_unit:2
        });
        _add(first);
        __Ownable_init(msg.sender);
    }

    function getVersion() external pure returns(string memory){
        return "1.0";
    }

    function _add(Currency memory currency) private {
        if(isexist[currency.alphabetic_code] != 0)
            revert("already_exist");

        counter++;
        currencies[counter] = currency;
        isexist[currency.alphabetic_code] = counter;
    }

    function add(Currency memory currency) external onlyOwner {
        _add(currency);
    }

    function get(uint256 id) external view returns(Currency memory){
        return currencies[id];
    }

    function exist(uint256 id) external view returns(bool){
        
        if(currencies[id].numeric_code > 0)
            return true;

        return false;
    }

    function list() view external returns(Currency[] memory){

        Currency[] memory ret = new Currency[](counter);

        for (uint i = 0; i < counter; i++) {
            ret[i] = currencies[i];
        }

        return ret;
    }


}