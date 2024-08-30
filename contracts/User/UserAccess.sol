// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../Hub/IHub.sol";
import "../User/IUser.sol";
import "../User/IUserAccess.sol";
import "hardhat/console.sol";

contract UserAccess is IUserAccess, Initializable, OwnableUpgradeable {

    mapping( string => mapping( bytes32 => mapping( uint256 => AccessLevel ) ) ) private object_access;
    mapping( string => mapping( uint256 => bytes32[] ) ) private object_access_list;

    mapping( uint256 => mapping(string => AccessLevel) ) private modules_access;
    mapping( uint256 => string[] ) private modules_access_list;

    mapping( string => mapping( bytes32 => mapping( uint256 => AccessLevel ) ) ) private group_object_access;
    mapping( string => mapping( uint256 => bytes32[] ) ) private group_object_access_list;

    mapping( uint256 => mapping(string => AccessLevel) ) private group_modules_access;
    mapping( uint256 => string[] ) private group_modules_access_list;



    string version;
    uint256 partner_id;
    address hubContract;


    function initialize(uint256 _partner_id, address _hubContract) external initializer {
        version = "1.0";
        partner_id = _partner_id;
        hubContract = _hubContract;

        string[] memory modules = IHub(_hubContract).getPartnerModules(partner_id);

        for (uint i = 0; i < modules.length; i++) {
            _setAccessLevelToModule(1,modules[i],AccessLevel.GOD);
            _groupSetAccessLevelToModule(1,modules[i],AccessLevel.GOD);
        }

        __Ownable_init(msg.sender);
    }

    function _isLogin(bytes32 _token) internal view returns(uint256) {
        uint256 isLogin = IUser(IHub(hubContract).getModule("User",partner_id)).isLogin(_token);

        if(isLogin == 0)
            revert("auth_failed");

        return isLogin;
    }

    function _setAccessLevelToObject( uint256 user_id, string memory module, bytes32 object_id,  AccessLevel access_level) internal {
        IHub(hubContract).checkModuleExist(module, partner_id);
        object_access_list[module][user_id].push(object_id);
        object_access[module][object_id][user_id] = access_level;
    }

    function _setAccessLevelToModule(uint256 user_id, string memory module, AccessLevel access_level) internal {
        IHub(hubContract).checkModuleExist(module, partner_id);
        modules_access_list[user_id].push(module);
        modules_access[user_id][module] = access_level;
    }

    function _groupSetAccessLevelToObject( uint256 group_id, string memory module, bytes32 object_id,  AccessLevel access_level) internal {
        IHub(hubContract).checkModuleExist(module, partner_id);
        group_object_access_list[module][group_id].push(object_id);
        group_object_access[module][object_id][group_id] = access_level;
    }

    function _groupSetAccessLevelToModule(uint256 group_id, string memory module, AccessLevel access_level) internal {
        IHub(hubContract).checkModuleExist(module, partner_id);
        group_modules_access_list[group_id].push(module);
        group_modules_access[group_id][module] = access_level;
    }

    function setAccessLevelToModule(bytes32 _token, uint256 user_id, string memory module, AccessLevel access_level) external {
        uint256 isLogin = _isLogin(_token);

        uint accessLevel = getModuleAccessLevel(module, isLogin);

        if(accessLevel < uint(AccessLevel.FOURTH) )
            revert("access_denied");

       if(uint(access_level) < accessLevel )
            revert("cannot_set_level_more_than_you_have");

        _setAccessLevelToModule(user_id, module, access_level);
        
    }

    function setAccessLevelToModuleObject(bytes32 _token, bytes32 object_id, uint256 user_id, string memory module, AccessLevel access_level) external {
        uint256 isLogin = _isLogin(_token);
        uint accessLevel = getObjectAccessLevel(module, object_id, isLogin);

        if(accessLevel < uint(AccessLevel.FOURTH) )
            revert("access_denied");

       if(uint(access_level) < accessLevel )
            revert("cannot_set_level_more_than_you_have");

        _setAccessLevelToObject(user_id, module, object_id, access_level);
    }

    function getModuleAccessLevel(string memory module, uint256 user_id) public view returns(uint){
        IHub(hubContract).checkModuleExist(module, partner_id);
        return uint(modules_access[user_id][module]);
    }

    function getObjectAccessLevel(string memory module, bytes32 object_id, uint256 user_id) public view returns(uint){
        IHub(hubContract).checkModuleExist(module, partner_id);
        return uint(object_access[module][object_id][user_id]);
    }

    function getGroupModuleAccessLevel(string memory module, uint256 group_id) external view returns(uint){
        return uint(group_modules_access[group_id][module]);
    }

    function getGroupObjectAccessLevel(string memory module, bytes32 object_id, uint256 group_id) external view returns(uint){
        return uint(group_object_access[module][object_id][group_id]);
    }

    function getMyModulesAccess(bytes32 _token) external view returns(string[] memory, uint[] memory){
        uint256 isLogin = _isLogin(_token);
        uint[] memory accessLevel = new uint[](modules_access_list[isLogin].length);

        for (uint i = 0; i < modules_access_list[isLogin].length; i++) {
            accessLevel[i] = getModuleAccessLevel(modules_access_list[isLogin][i], isLogin);
        }
        return (modules_access_list[isLogin],accessLevel);
    }


}