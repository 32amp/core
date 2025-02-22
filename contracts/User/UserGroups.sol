// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../Hub/IHub.sol";
import "./IUserAccess.sol";
import "../RevertCodes/IRevertCodes.sol";


contract UserGroups is Initializable, OwnableUpgradeable {

    struct Group {
        uint256 id;
        string name;
        address owner;
        bool deleted;
    }

    mapping (uint256 => Group) groups;
    mapping (uint256 => address[]) users_group;
    mapping (address => uint256[]) user_group_list;

    uint256 groupIndex;
    address hubContract;
    uint256 partner_id;


    function initialize(uint256 _partner_id, address _hubContract) external initializer {

        hubContract = _hubContract;
        partner_id = _partner_id;
        _addGroup("sudo", msg.sender);
        __Ownable_init(msg.sender);
    }

    function registerRevertCodes() external {
        _RevertCodes().registerRevertCode("UserGroups", "access_denied", "Access denied to Group");
    }

    function getVersion() external pure returns(string memory){
        return "1.0";
    }

    function _UserAccess() private view returns(IUserAccess) {
        return IUserAccess(IHub(hubContract).getModule("UserAccess", partner_id));
    }

    function _RevertCodes() private view returns(IRevertCodes) {
        return IRevertCodes(IHub(hubContract).getModule("RevertCodes", partner_id));
    }

    function addGroup( string memory name) external {

        uint access_level = _UserAccess().getModuleAccessLevel("UserGroups", msg.sender);

        if(access_level < uint(IUserAccess.AccessLevel.FOURTH)){
            revert("access_denied");
        }

        _addGroup(name, msg.sender);

    }

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


    // isHave user
    function getMyGroups() external view returns(Group[] memory) {
        

        uint access_level = _UserAccess().getModuleAccessLevel("UserGroups", msg.sender);

        if(access_level < uint(IUserAccess.AccessLevel.SECOND)){
            revert("access_denied");
        }

        Group[] memory ret = new Group[](user_group_list[msg.sender].length);

        for (uint i = 0; i < user_group_list[msg.sender].length; i++) {
            ret[i] = groups[user_group_list[msg.sender][i]];
        }

        return ret;
    }

}