// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../Hub/IHub.sol";
import "../User/IUserAccess.sol";

/**
 * @title User Access Management Contract
 * @notice Handles granular access control for modules and objects
 * @dev Implements multi-level permissions system with individual and group access
 * @custom:warning Requires proper initialization and ownership for configuration
 */
contract UserAccess is IUserAccess, Initializable, OwnableUpgradeable {
    // Individual object access mappings
    /// @dev Access levels for specific objects: module => object ID => account => level
    mapping(string => mapping(bytes32 => mapping(address => AccessLevel))) private object_access;
    
    /// @dev List of accessible objects per module/account: module => account => object IDs[]
    mapping(string => mapping(address => bytes32[])) private object_access_list;

    // Module access mappings
    /// @dev Access levels for modules: account => module => level
    mapping(address => mapping(string => AccessLevel)) private modules_access;
    
    /// @dev List of accessible modules per account: account => module names[]
    mapping(address => string[]) private modules_access_list;

    // Group object access mappings
    /// @dev Group-based object access: module => object ID => group ID => level
    mapping(string => mapping(bytes32 => mapping(uint256 => AccessLevel))) private group_object_access;
    
    /// @dev List of accessible objects per group: module => group ID => object IDs[]
    mapping(string => mapping(uint256 => bytes32[])) private group_object_access_list;

    // Group module access mappings
    /// @dev Group-based module access: group ID => module => level
    mapping(uint256 => mapping(string => AccessLevel)) private group_modules_access;
    
    /// @dev List of accessible modules per group: group ID => module names[]
    mapping(uint256 => string[]) private group_modules_access_list;

    // System configuration
    /// @notice Associated partner ID from Hub
    uint256 partner_id;
    
    /// @notice Hub contract address
    address hubContract;

    /**
     * @notice Initializes access control system
     * @param _partner_id Partner ID from Hub registry
     * @param _hubContract Hub contract address
     * @dev Automatically grants GOD access to contract owner and modules
     * @custom:init Called once during proxy deployment
     */
    function initialize(uint256 _partner_id, address _hubContract) external initializer {
        partner_id = _partner_id;
        hubContract = _hubContract;

        string[] memory modules = IHub(_hubContract).getPartnerModules(partner_id);

        for (uint i = 0; i < modules.length; i++) {
            address module_address = IHub(_hubContract).getModule(modules[i], partner_id);
            _setAccessLevelToModule(msg.sender,modules[i],AccessLevel.GOD);
            
            _groupSetAccessLevelToModule(1,modules[i],AccessLevel.GOD);

            for (uint b = 0; b < modules.length; b++) {
                _setAccessLevelToModule(module_address,modules[b],AccessLevel.GOD);
            }   
        }
        __Ownable_init(msg.sender);
    }

    /**
     * @notice Returns contract version
     * @return string Constant version identifier
     */
    function getVersion() external pure returns(string memory){
        return "1.0";
    }

    /**
     * @dev Internal function to set object-level access
     * @param user_address Target address
     * @param module Module name
     * @param object_id Object identifier
     * @param access_level Permission level to set
     * @custom:reverts If module doesn't exist
     */    
    function _setAccessLevelToObject( address user_address, string memory module, bytes32 object_id,  AccessLevel access_level) internal {
        IHub(hubContract).checkModuleExist(module, partner_id);
        object_access_list[module][user_address].push(object_id);
        object_access[module][object_id][user_address] = access_level;
    }

    /**
     * @dev Internal function to set module-level access
     * @param user_address Target address
     * @param module Module name
     * @param access_level Permission level to set
     * @custom:reverts If module doesn't exist
     */    
    function _setAccessLevelToModule(address user_address, string memory module, AccessLevel access_level) internal {
        IHub(hubContract).checkModuleExist(module, partner_id);
        modules_access_list[user_address].push(module);
        modules_access[user_address][module] = access_level;
    }

    /**
     * @dev Internal function to set group-based object access
     * @param group_id Group identifier
     * @param module Module name
     * @param object_id Object identifier
     * @param access_level Permission level to set
     * @custom:reverts If module doesn't exist
     */    
    function _groupSetAccessLevelToObject( uint256 group_id, string calldata module, bytes32 object_id,  AccessLevel access_level) internal {
        IHub(hubContract).checkModuleExist(module, partner_id);
        group_object_access_list[module][group_id].push(object_id);
        group_object_access[module][object_id][group_id] = access_level;
    }

    /**
     * @dev Internal function to set group-based module access
     * @param group_id Group identifier
     * @param module Module name
     * @param access_level Permission level to set
     * @custom:reverts If module doesn't exist
     */    
    function _groupSetAccessLevelToModule(uint256 group_id, string memory module, AccessLevel access_level) internal {
        IHub(hubContract).checkModuleExist(module, partner_id);
        group_modules_access_list[group_id].push(module);
        group_modules_access[group_id][module] = access_level;
    }

    /**
     * @notice Sets module access level for a user
     * @param user_address Target address
     * @param module Module name
     * @param access_level New permission level
     * @custom:reverts AccessDenied If caller has insufficient privileges
     * @custom:reverts AccessDeniedLevel If trying to set higher level than caller's
     */    
    function setAccessLevelToModule( address user_address, string calldata module, AccessLevel access_level) external {

        uint accessLevel = getModuleAccessLevel(module, msg.sender);

        if(accessLevel < uint(AccessLevel.FOURTH) )
            revert AccessDenied(module);

        if(uint(access_level) > accessLevel )
            revert AccessDeniedLevel(module, uint8(access_level));

        _setAccessLevelToModule(user_address, module, access_level);
        
    }

    /**
     * @notice Sets object-level access within a module
     * @param object_id Object identifier
     * @param user_address Target address
     * @param module Module name
     * @param access_level New permission level
     * @custom:reverts AccessDenied If caller has insufficient privileges
     * @custom:reverts AccessDeniedLevel If trying to set higher level than caller's
     */    
    function setAccessLevelToModuleObject(bytes32 object_id, address user_address, string calldata module, AccessLevel access_level) external {
        
        uint accessLevel = getModuleAccessLevel(module, msg.sender);
        

        if(accessLevel < uint(AccessLevel.FOURTH) )
            revert AccessDenied(module);

        if(uint(access_level) > accessLevel )
            revert AccessDeniedLevel(module, uint8(access_level));

        _setAccessLevelToObject(user_address, module, object_id, access_level);
    }

    /**
     * @notice Retrieves module access level for a user
     * @param module Module name to check
     * @param user_address Address to check
     * @return uint Numeric representation of access level
     * @custom:reverts If module doesn't exist
     */    
    function getModuleAccessLevel(string memory module, address user_address) public view returns(uint){
        IHub(hubContract).checkModuleExist(module, partner_id);
        return uint(modules_access[user_address][module]);
    }


    /**
     * @notice Retrieves object access level for a user
     * @param module Module name
     * @param object_id Object identifier
     * @param user_address Address to check
     * @return uint Numeric representation of access level
     * @custom:reverts If module doesn't exist
     */    
    function getObjectAccessLevel(string calldata module, bytes32 object_id, address user_address) public view returns(uint){
        IHub(hubContract).checkModuleExist(module, partner_id);
        return uint(object_access[module][object_id][user_address]);
    }

    /**
     * @notice Retrieves module access level for a group
     * @param module Module name
     * @param group_id Group identifier
     * @return uint Numeric representation of access level
     */    
    function getGroupModuleAccessLevel(string calldata module, uint256 group_id) external view returns(uint){
        return uint(group_modules_access[group_id][module]);
    }

    /**
     * @notice Retrieves object access level for a group
     * @param module Module name
     * @param object_id Object identifier
     * @param group_id Group identifier
     * @return uint Numeric representation of access level
     */    
    function getGroupObjectAccessLevel(string calldata module, bytes32 object_id, uint256 group_id) external view returns(uint){
        return uint(group_object_access[module][object_id][group_id]);
    }

    /**
     * @notice Retrieves caller's module access list
     * @return (string[] memory, uint[] memory) Module names and corresponding access levels
     */    
    function getMyModulesAccess() external view returns(string[] memory, uint[] memory){
        
        uint[] memory accessLevel = new uint[](modules_access_list[msg.sender].length);

        for (uint i = 0; i < modules_access_list[msg.sender].length; i++) {
            accessLevel[i] = getModuleAccessLevel(modules_access_list[msg.sender][i], msg.sender);
        }
        return (modules_access_list[msg.sender],accessLevel);
    }

    /**
     * @notice Validates access rights for module+object combination
     * @param user_address Address to check
     * @param module Module name
     * @param object_id Object identifier
     * @param level Required access level
     * @custom:reverts AccessDeniedLevel If account lacks module access
     * @custom:reverts AccessDeniedObjectLevel If account lacks object access
     */
    function checkAccess(address user_address,string calldata module, bytes32 object_id, uint level) external view{
        

        uint access_level = getModuleAccessLevel(module, user_address);

        if(access_level < level){
            revert AccessDeniedLevel(module, uint8(access_level));
        }

        if(access_level == uint(AccessLevel.GOD))
            return;

        uint access_level_obj = getObjectAccessLevel(module, object_id, user_address);

        if(access_level_obj < level){
            revert AccessDeniedObjectLevel(module,object_id, access_level_obj);
        }

    }

    /**
     * @notice Validates module access rights
     * @param user_address Address to check
     * @param module Module name
     * @param level Required access level
     * @custom:reverts AccessDeniedLevel If account lacks module access
     */    
    function checkAccessModule(address user_address, string calldata module, uint level) external view{

        uint access_level = getModuleAccessLevel(module, user_address);

        if(access_level < level){
            revert AccessDeniedLevel(module, uint8(access_level));
        }

    }

}