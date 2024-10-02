// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;


import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../Hub/IHub.sol";
import "./ILocation.sol";
import "./IEVSE.sol";
import "../User/IUser.sol";
import "../User/IUserAccess.sol";
import "./DataTypes.sol";


contract EVSE is IEVSE, Initializable {
    mapping (uint256 => DataTypesLocation.EVSE)  evses;
    address hubContract;
    string version;
    uint256 partner_id;
    uint256 evsecounter;

    function initialize(uint256 _partner_id, address _hubContract) public initializer {
        hubContract = _hubContract;
        partner_id = _partner_id;
        version = "1.0";
    }

    function getVersion() external view returns (string memory) {
        return version;
    }

    function _UserAccess() private view returns(IUserAccess) {
        return IUserAccess(IHub(hubContract).getModule("UserAccess", partner_id));
    }

    function _User() private view returns(IUser) {
        return IUser(IHub(hubContract).getModule("User", partner_id));
    }

    function _Location() private view returns(ILocation) {
        return ILocation(IHub(hubContract).getModule("Location", partner_id));
    }


    function exist(uint256 evse_id) public returns(bool){

    }

    function addStation(bytes32 _token, DataTypesLocation.EVSE calldata add) external {
        
        uint256 user_id = _User().isLogin(_token);

        uint access_level = _UserAccess().getModuleAccessLevel("EVSE", user_id);

        if(access_level < uint(IUserAccess.AccessLevel.FOURTH)){
            revert("access_denied");
        }

        evsecounter++;

        evses[evsecounter] = add;

        _UserAccess().setAccessLevelToModuleObject(_token,bytes32(evsecounter),user_id,"EVSE",IUserAccess.AccessLevel.FOURTH);

        emit AddEVSE(evsecounter, partner_id, user_id);
    }

}