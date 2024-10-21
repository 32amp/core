// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../Hub/IHub.sol";
import "./IUser.sol";
import "./IUserAccess.sol";


contract UserGroups is Initializable, OwnableUpgradeable {

    struct Group {
        uint256 id;
        string name;
        uint256 owner_user_id;
        bool deleted;
    }

    mapping (uint256 => Group) groups;
    mapping (uint256 => uint256[]) users_group;
    mapping (uint256 => uint256[]) user_group_list;

    uint256 groupIndex;
    string version;
    address hubContract;
    uint256 partner_id;


    function initialize(uint256 _partner_id, address _hubContract) external initializer {
        version = "1.0";
        hubContract = _hubContract;
        partner_id = _partner_id;
        _addGroup("sudo", 1);
        __Ownable_init(msg.sender);

    }

    function _UserAccess() private view returns(IUserAccess) {
        return IUserAccess(IHub(hubContract).getModule("UserAccess", partner_id));
    }

    function _User() private view returns(IUser) {
        return IUser(IHub(hubContract).getModule("User", partner_id));
    }

    function addGroup(bytes32 _token, string memory name) external {

        uint256 user_id = _User().isLogin(_token);

        uint access_level = _UserAccess().getModuleAccessLevel("UserGroups", user_id);

        if(access_level < uint(IUserAccess.AccessLevel.FOURTH)){
            revert("access_denied");
        }

        _addGroup(name, user_id);

    }

    function _addGroup(string memory name, uint256 owner_user_id) internal {
        groupIndex++;

        groups[groupIndex] = Group({
            name:name,
            id: groupIndex,
            owner_user_id: owner_user_id,
            deleted: false
        });

        users_group[groupIndex].push(owner_user_id);
        user_group_list[owner_user_id].push(groupIndex);
        
    }


    
    function getMyGroups(bytes32 _token) external view returns(Group[] memory) {
        uint256 user_id = _User().isLogin(_token);

        uint access_level = _UserAccess().getModuleAccessLevel("UserGroups", user_id);

        if(access_level < uint(IUserAccess.AccessLevel.SECOND)){
            revert("access_denied");
        }

        Group[] memory ret = new Group[](user_group_list[user_id].length);

        for (uint i = 0; i < user_group_list[user_id].length; i++) {
            ret[i] = groups[user_group_list[user_id][i]];
        }

        return ret;
    }

}