// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "../IBaseErrors.sol";

/**
 * @title User Access Interface
 * @notice Defines the access control levels and permission hierarchy
 * @dev Inherits from IBaseErrors for standardized error handling
 */
interface IUserAccess is IBaseErrors {
    /**
     * @title Access Level Enumeration
     * @notice Tiered permission system for granular access control
     * @dev 
     * The access levels are ordered hierarchically with increasing privileges:
     * 
     * - **ZERO**: No access (default state)
     * - **FIRST**: Read-only access (view operations only)
     * - **SECOND**: Read + Execute (view and trigger basic operations)
     * - **THIRD**: Read + Execute + Edit (modify existing resources)
     * - **FOURTH**: Read + Edit + Add (create new resources)
     * - **FIFTH**: Full CRUD access (Create, Read, Update, Delete)
     * - **GOD**: Unlimited system access (bypass all permission checks)
     * 
     * @custom:security Important: GOD level should be restricted to system admins
     */
    enum AccessLevel {
        ZERO,    // 0 - Access denied
        FIRST,   // 1 - Only view
        SECOND,  // 2 - View and Run
        THIRD,   // 3 - View, Run, Edit
        FOURTH,  // 4 - View, Edit, Add
        FIFTH,   // 5 - View, Edit, Add, Delete
        GOD      // 6 - GODMODE (full privileges)
    }
    
    function getVersion() external pure returns(string memory);
    function setAccessLevelToModule(address account, string calldata module, AccessLevel access_level) external;
    function getModuleAccessLevel(string calldata module, address account) external view returns(uint);
    function getObjectAccessLevel(string calldata module, bytes32 object_id, address account) external view returns(uint);
    function setAccessLevelToModuleObject( bytes32 object_id, address account, string calldata module, AccessLevel access_level) external;
    function getGroupModuleAccessLevel(string calldata module, uint256 group_id) external view returns(uint);
    function getGroupObjectAccessLevel(string calldata module, bytes32 object_id, uint256 group_id) external view returns(uint);
    function getMyModulesAccess() external view returns(string[] memory, uint[] memory);
    function checkAccess(address account, string calldata module, bytes32 object_id, uint level) external view;
    function checkAccessModule(address account, string calldata module, uint level) external view;
}