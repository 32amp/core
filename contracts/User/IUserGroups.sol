// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "../IBaseErrors.sol";

/**
 * @title User Groups Interface
 * @notice Defines the data structures and error handling for group management
 * @dev Inherits from IBaseErrors for standardized error handling
 */
interface IUserGroups is IBaseErrors {
    /**
     * @title Group Data Structure
     * @notice Represents a user group within the system
     * @dev Groups are used to organize users and manage permissions collectively
     * 
     * @param id      Unique group identifier (auto-incremented)
     * @param name    Display name of the group
     * @param owner   Address of the group owner (has full administrative privileges)
     * @param deleted Soft deletion flag (true if group is archived)
     * 
     * @custom:security Group owners have full control over their groups
     */
    struct Group {
        uint256 id;
        string name;
        address owner;
        bool deleted;
    }

    function getVersion() external pure returns(string memory);
    function addGroup( string calldata name) external;
    function getMyGroups() external view returns(Group[] memory);
}