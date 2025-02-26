// SPDX-License-Identifier: GPLV3

pragma solidity ^0.8.20;

import "../IBaseErrors.sol";


/**
 * @title Balance Management Interface
 * @notice Defines data structures and events for balance and transfer operations
 * @dev Provides the foundation for token balance and transfer functionality
 */
interface IBalance is IBaseErrors {
    /**
     * @title Transfer Data Structure
     * @notice Contains details of a token transfer
     * @param from Address of the sender (address(0) for mint operations)
     * @param to Address of the recipient (address(0) for burn operations)
     * @param value Amount of tokens transferred
     */
    struct TransferData {
        address from;
        address to;
        uint256 value;
    }

    /**
     * @notice Emitted when tokens are transferred between accounts
     * @param from Address of the sender (address(0) for mint operations)
     * @param to Address of the recipient (address(0) for burn operations)
     * @param transfer_id Unique identifier for the transfer
     */
    event Transfer(
        address indexed from,
        address indexed to,
        uint256 indexed transfer_id
    );

    function totalSupply() external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function transfer(address to, uint256 value) external;

    function transferFrom(address from, address to, uint256 value) external;

    function getCurrency() external view returns (uint256);
}
