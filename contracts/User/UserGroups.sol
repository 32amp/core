// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../Hub/IHub.sol";
import "./IUserAccess.sol";
import "./IUserGroups.sol";
import "./IUser.sol";

/**
 * @title User Groups Management Contract
 * @notice Handles creation and management of user groups within the system
 * @dev Implements group-based access control with hierarchical permissions
 * @custom:warning Requires proper initialization and integrates with UserAccess module
 */
contract UserGroups is IUserGroups, Initializable, OwnableUpgradeable {
    // Storage mappings documentation
    /// @dev Group data storage by group ID
    mapping(uint256 => Group) groups;
    
    /// @dev Group membership storage: group ID => member addresses
    mapping(uint256 => address[]) users_group;
    
    /// @dev User-group associations: address => group IDs[]
    mapping(address => uint256[]) user_group_list;

    // State variables documentation
    /// @dev Auto-incrementing group ID counter
    uint256 groupIndex;
    
    /// @notice Hub contract reference
    address hubContract;
    
    /// @notice Associated partner ID
    uint256 partner_id;

    /**
     * @notice Initializes the contract with default sudo group
     * @param _partner_id Partner ID from Hub registry
     * @param _hubContract Hub contract address
     * @dev Creates initial "sudo" group with contract owner as member
     * @custom:init Called once during proxy deployment
     */
    function initialize(uint256 _partner_id, address _hubContract) external initializer {

        hubContract = _hubContract;
        partner_id = _partner_id;
        _addGroup("sudo", msg.sender);
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
     * @dev Internal access to UserAccess module
     * @return IUserAccess UserAccess module interface
     */
    function _UserAccess() private view returns(IUserAccess) {
        return IUserAccess(IHub(hubContract).getModule("UserAccess", partner_id));
    }

    /// @dev Returns User module interface
    function _User() private view returns(IUser) {
        return IUser(IHub(hubContract).getModule("User", partner_id));
    }    

    /// @notice Access control modifier requiring for check user exist
    modifier onlyUser() {
        _User().exist(msg.sender);
        _;
    }

    /**
     * @notice Creates a new user group
     * @param name Display name for the new group
     * @custom:reverts AccessDeniedLevel If caller lacks FOURTH access level
     * @custom:security Group owners get full permissions for their groups
     */    
    function addGroup( string calldata name) onlyUser() external {

        uint access_level = _UserAccess().getModuleAccessLevel("UserGroups", msg.sender);

        if(access_level < uint(IUserAccess.AccessLevel.FOURTH)){
            revert AccessDeniedLevel("UserGroup",uint(IUserAccess.AccessLevel.FOURTH));
        }

        _addGroup(name, msg.sender);

    }

    /**
     * @dev Internal group creation mechanism
     * @param name Group display name
     * @param owner Initial group owner address
     * @custom:warning Automatically adds owner to group members
     */    
    function _addGroup(string memory name, address owner) internal {
        groupIndex++;

        groups[groupIndex] = Group({
            name:name,
            id: groupIndex,
            owner: owner,
            deleted: false
        });

        users_group[groupIndex].push(owner);
        user_group_list[owner].push(groupIndex);
        
    }


    
    /**
     * @notice Retrieves caller's associated groups
     * @return Group[] Array of group structures
     * @custom:reverts AccessDeniedLevel If caller lacks SECOND access level
     * @dev Returns both owned and member groups for the caller
     */    
    function getMyGroups() onlyUser() external view returns(Group[] memory) {
        

        uint access_level = _UserAccess().getModuleAccessLevel("UserGroups", msg.sender);

        if(access_level < uint(IUserAccess.AccessLevel.SECOND)){
            revert AccessDeniedLevel("UserGroup",uint(IUserAccess.AccessLevel.SECOND));
        }

        Group[] memory ret = new Group[](user_group_list[msg.sender].length);

        for (uint i = 0; i < user_group_list[msg.sender].length; i++) {
            ret[i] = groups[user_group_list[msg.sender][i]];
        }

        return ret;
    }

}