// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./ICurrencies.sol";

/**
 * @title Currencies Management Contract
 * @notice Handles the storage and retrieval of currency information
 * @dev Manages a registry of currencies with unique identifiers and codes
 * @custom:warning Requires proper initialization and ownership for modifications
 */
contract Currencies is ICurrencies, Initializable, OwnableUpgradeable {
    // State variables documentation
    /// @dev Auto-incrementing currency ID counter
    uint256 counter;

    // Storage mappings documentation
    /// @dev Currency storage by ID
    mapping(uint256 => Currency) currencies;
    
    /// @dev Mapping of alphabetic codes to currency IDs
    mapping(string => uint256) isexist;

    /**
     * @notice Initializes the contract with default currency data
     * @dev Adds the US Dollar as the first currency and sets the contract owner
     * @custom:init Called once during proxy deployment
     */
    function initialize() public initializer {
        Currency memory first = Currency({
            country: "UNITED STATES OF AMERICA",
            currency: "US Dollar",
            alphabetic_code: "USD",
            symbol: "$",
            numeric_code: 840,
            minor_unit: 2
        });
        _add(first);
        __Ownable_init(msg.sender);
    }

    /**
     * @notice Returns the current contract version
     * @return string Contract version identifier
     */
    function getVersion() external pure returns(string memory) {
        return "1.0";
    }

    /**
     * @dev Internal function to add a new currency
     * @param currency Currency data structure to add
     * @custom:reverts AlreadyExist If the currency's alphabetic code already exists
     */
    function _add(Currency memory currency) private {
        if (isexist[currency.alphabetic_code] != 0) {
            revert AlreadyExist("Currency");
        }

        counter++;
        currencies[counter] = currency;
        isexist[currency.alphabetic_code] = counter;
    }

    /**
     * @notice Adds a new currency to the registry
     * @param currency Currency data structure to add
     * @custom:reverts OnlyOwner If caller is not the contract owner
     * @custom:reverts AlreadyExist If the currency's alphabetic code already exists
     */
    function add(Currency calldata currency) external onlyOwner {
        _add(currency);
    }

    /**
     * @notice Retrieves currency details by ID
     * @param id Currency ID to query
     * @return Currency Currency data structure
     */
    function get(uint256 id) external view returns(Currency memory) {
        return currencies[id];
    }

    /**
     * @notice Checks if a currency exists by ID
     * @param id Currency ID to check
     * @return bool True if the currency exists, false otherwise
     */
    function exist(uint256 id) external view returns(bool) {
        return currencies[id].numeric_code > 0;
    }

    /**
     * @notice Retrieves a list of all registered currencies
     * @return Currency[] Array of currency data structures
     */
    function list() external view returns(Currency[] memory) {
        Currency[] memory ret = new Currency[](counter);

        for (uint i = 0; i < counter; i++) {
            ret[i] = currencies[i + 1]; // Adjusted to match 1-based indexing
        }

        return ret;
    }
}