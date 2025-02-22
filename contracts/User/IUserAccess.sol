// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

interface IUserAccess {

    // ZERO - Access denied
    // FIRST - Only view
    // SECOND - View and Run
    // THIRD - View, Run, Edit
    // FOURTH - View, Edit, Add
    // FIFTH - View, Edit, Add, Delete
    // GOD - GODMODE

    enum  AccessLevel{ZERO, FIRST, SECOND, THIRD, FOURTH, FIFTH, GOD} 
    
    function getVersion() external pure returns(string memory);
    function setAccessLevelToModule(address user_address, string memory module, AccessLevel access_level) external;
    function getModuleAccessLevel(string memory module, address user_address) external view returns(uint);
    function getObjectAccessLevel(string memory module, bytes32 object_id, address user_address) external view returns(uint);
    function setAccessLevelToModuleObject( bytes32 object_id, address user_address, string memory module, AccessLevel access_level) external;
    function getGroupModuleAccessLevel(string memory module, uint256 group_id) external view returns(uint);
    function getGroupObjectAccessLevel(string memory module, bytes32 object_id, uint256 group_id) external view returns(uint);
    function getMyModulesAccess() external view returns(string[] memory, uint[] memory);
    function checkAccess(address user_address, string memory module, bytes32 object_id, uint level) external view;
    function checkAccessModule(address user_address, string memory module, uint level) external view;
}