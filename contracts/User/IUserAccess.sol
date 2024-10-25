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
    function setAccessLevelToModule(bytes32 _token, uint256 user_id, string memory module, AccessLevel access_level) external;
    function getModuleAccessLevel(string memory module, uint256 user_id) external view returns(uint);
    function getObjectAccessLevel(string memory module, bytes32 object_id, uint256 user_id) external view returns(uint);
    function setAccessLevelToModuleObject(bytes32 _token, bytes32 object_id, uint256 user_id, string memory module, AccessLevel access_level) external;
    function getGroupModuleAccessLevel(string memory module, uint256 group_id) external view returns(uint);
    function getGroupObjectAccessLevel(string memory module, bytes32 object_id, uint256 group_id) external view returns(uint);
    function getMyModulesAccess(bytes32 _token) external view returns(string[] memory, uint[] memory);
    function checkAccess(string memory module, bytes32 object_id, bytes32 _token, uint level) external view;
}