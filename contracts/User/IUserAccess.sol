// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

interface IUserAccess {

    // ZERO - Access denied
    // FIRST - Only view
    // SECOND - view and edit
    // THIRD - view, edit, add
    // FOURTH - view, edit, add, delete

    enum AccessLevel{ZERO, FIRST, SECOND, THIRD, FOURTH}

    function addModule(string memory _module) external;

    function getModules() external view returns(string[] memory);

    function checkModuleExist(string memory module) external view;

    function getModuleAccessLevel(string memory module, uint256 user_id) external view returns(uint);

    function getObjectAccessLevel(string memory module, bytes32 object_id, uint256 user_id) external view returns(AccessLevel);
}