// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../Hub/IHub.sol";
import "../User/IUserAccess.sol";
import "../RevertCodes/IRevertCodes.sol";

contract UserAccess is IUserAccess, Initializable, OwnableUpgradeable {

    mapping( string => mapping( bytes32 => mapping( address => AccessLevel ) ) ) private object_access;
    mapping( string => mapping( address => bytes32[] ) ) private object_access_list;

    mapping( address => mapping(string => AccessLevel) ) private modules_access;
    mapping( address => string[] ) private modules_access_list;

    mapping( string => mapping( bytes32 => mapping( uint256 => AccessLevel ) ) ) private group_object_access;
    mapping( string => mapping( uint256 => bytes32[] ) ) private group_object_access_list;

    mapping( uint256 => mapping(string => AccessLevel) ) private group_modules_access;
    mapping( uint256 => string[] ) private group_modules_access_list;


    uint256 partner_id;
    address hubContract;


    function initialize(uint256 _partner_id, address _hubContract) external initializer {
        partner_id = _partner_id;
        hubContract = _hubContract;

        string[] memory modules = IHub(_hubContract).getPartnerModules(partner_id);

        for (uint i = 0; i < modules.length; i++) {
            address module_address = IHub(_hubContract).getModule(modules[i], partner_id);
            _setAccessLevelToModule(msg.sender,modules[i],AccessLevel.GOD);
            _setAccessLevelToModule(module_address,modules[i],AccessLevel.GOD);
            _groupSetAccessLevelToModule(1,modules[i],AccessLevel.GOD);
        }
        __Ownable_init(msg.sender);
    }

    function registerRevertCodes() external {
        _RevertCodes().registerRevertCode("UserAccess", "auth_failed", "Authorization failed");
        _RevertCodes().registerRevertCode("UserAccess", "access_denied", "Access denied");
        _RevertCodes().registerRevertCode("UserAccess", "cannot_set_level_more_than_you_have", "Cannot set level more than you have");
        _RevertCodes().registerRevertCode("UserAccess", "module_access_denied", "Module access denied");
        _RevertCodes().registerRevertCode("UserAccess", "obj_access_denied", "Object access denied");
    }


    function _RevertCodes() private view returns(IRevertCodes) {
        return IRevertCodes(IHub(hubContract).getModule("RevertCodes", partner_id));
    }

    function getVersion() external pure returns(string memory){
        return "1.0";
    }

    function _setAccessLevelToObject( address user_address, string memory module, bytes32 object_id,  AccessLevel access_level) internal {
        IHub(hubContract).checkModuleExist(module, partner_id);
        object_access_list[module][user_address].push(object_id);
        object_access[module][object_id][user_address] = access_level;
    }

    function _setAccessLevelToModule(address user_address, string memory module, AccessLevel access_level) internal {
        IHub(hubContract).checkModuleExist(module, partner_id);
        modules_access_list[user_address].push(module);
        modules_access[user_address][module] = access_level;
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

    function setAccessLevelToModule( address user_address, string memory module, AccessLevel access_level) external {

        uint accessLevel = getModuleAccessLevel(module, msg.sender);

        if(accessLevel < uint(AccessLevel.FOURTH) )
            revert("access_denied");

        if(uint(access_level) > accessLevel )
            revert("cannot_set_level_more_than_you_have");

        _setAccessLevelToModule(user_address, module, access_level);
        
    }

    function setAccessLevelToModuleObject(bytes32 object_id, address user_address, string memory module, AccessLevel access_level) external {
        
        uint accessLevel = getModuleAccessLevel(module, msg.sender);
        

        if(accessLevel < uint(AccessLevel.FOURTH) )
            revert("access_denied");

        if(uint(access_level) > accessLevel )
            revert("cannot_set_level_more_than_you_have");

        _setAccessLevelToObject(user_address, module, object_id, access_level);
    }

    function getModuleAccessLevel(string memory module, address user_address) public view returns(uint){
        IHub(hubContract).checkModuleExist(module, partner_id);
        return uint(modules_access[user_address][module]);
    }

    function getObjectAccessLevel(string memory module, bytes32 object_id, address user_address) public view returns(uint){
        IHub(hubContract).checkModuleExist(module, partner_id);
        return uint(object_access[module][object_id][user_address]);
    }

    function getGroupModuleAccessLevel(string memory module, uint256 group_id) external view returns(uint){
        return uint(group_modules_access[group_id][module]);
    }

    function getGroupObjectAccessLevel(string memory module, bytes32 object_id, uint256 group_id) external view returns(uint){
        return uint(group_object_access[module][object_id][group_id]);
    }

    function getMyModulesAccess() external view returns(string[] memory, uint[] memory){
        
        uint[] memory accessLevel = new uint[](modules_access_list[msg.sender].length);

        for (uint i = 0; i < modules_access_list[msg.sender].length; i++) {
            accessLevel[i] = getModuleAccessLevel(modules_access_list[msg.sender][i], msg.sender);
        }
        return (modules_access_list[msg.sender],accessLevel);
    }


    function checkAccess(address user_address,string memory module, bytes32 object_id, uint level) external view{
        

        uint access_level = getModuleAccessLevel(module, user_address);

        if(access_level < level){
            revert("module_access_denied");
        }

        if(access_level == uint(AccessLevel.GOD))
            return;

        uint access_level_obj = getObjectAccessLevel(module, object_id, user_address);

        if(access_level_obj < level){
            revert("obj_access_denied");
        }

    }

    function checkAccessModule(address user_address, string memory module, uint level) external view{

        uint access_level = getModuleAccessLevel(module, user_address);

        if(access_level < level){
            revert("module_access_denied");
        }

    }

}