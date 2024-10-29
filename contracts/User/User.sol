// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./IUser.sol";
import "./IUserAccess.sol";
import "./IAuth.sol";
import "../Hub/IHub.sol";
import "../Services/IMessageOracle.sol";

contract User is IUser, Initializable, OwnableUpgradeable {
    mapping(uint256 => IUser.User) users;
    mapping(uint256 => IUser.Company) user_company_data;
    mapping(uint256 => IUser.CarData[]) user_cars;

    uint256 usersIndex;
    address hubAddress;
    uint256 partner_id;

    modifier onlyAuthContract(){
        if(IHub(hubAddress).getModule("Auth", partner_id) != msg.sender)
            revert("access_denied");
        _;
    } 

    function getVersion() external pure returns(string memory){
        return "1.0";
    }

    function _UserAccess() private view returns(IUserAccess) {
        return IUserAccess(IHub(hubAddress).getModule("UserAccess", partner_id));
    }

    function _Auth() private view returns(IAuth) {
        return IAuth(IHub(hubAddress).getModule("Auth", partner_id));
    }

    function initialize(uint256 _partner_id, address _hubAddress) external initializer {
        hubAddress = _hubAddress;
        partner_id = _partner_id;
        
        __Ownable_init(msg.sender);
    }

    function addUser() external returns (uint256) {

        if(IHub(hubAddress).getModule("Auth", partner_id) != msg.sender)
            revert("access_denied");

        usersIndex++;
        users[usersIndex].id = usersIndex;
        users[usersIndex].last_updated = block.timestamp;
        users[usersIndex].enable = true;
        return usersIndex;
    }

    function whoami(bytes32 _token) external view returns (IUser.User memory) {
        uint256 user_id = _Auth().isLogin(_token);

        if (user_id == 0) revert("access_denied");

        return users[user_id];
    }

    function getUser(bytes32 _token, uint256 _user_id) external view returns (IUser.User memory) {
        uint256 user_id = _Auth().isLogin(_token);

        if (user_id == 0) revert("access_denied");


        uint access_level = _UserAccess().getModuleAccessLevel("User", user_id);

        if(access_level <= uint(IUserAccess.AccessLevel.FIRST)){
            revert("access_denied");
        }

        return users[_user_id];
    }

    function _updateData(uint256 user_id, bytes32 first_name, bytes32 last_name, bytes32 language_code) internal {
        users[user_id].first_name = first_name;
        users[user_id].last_name = last_name;
        users[user_id].language_code = language_code;
    }

    function updateBaseData(bytes32 _token, uint256 user_id, bytes32 first_name, bytes32 last_name, bytes32 language_code) external {
        uint256 my_user_id = _Auth().isLogin(_token);

        if (my_user_id == 0) revert("access_denied");

        if(user_id == 0){
            _updateData(my_user_id,first_name, last_name, language_code);
            return;
        }

        uint access_level = _UserAccess().getModuleAccessLevel("User", my_user_id);

        if(access_level <= uint(IUserAccess.AccessLevel.FIRST)){
            revert("access_denied");
        }

        _updateData(user_id,first_name, last_name, language_code);
    }


    function addCar(bytes32 _token, uint256 user_id, CarData memory car_data) external{
        uint256 my_user_id = _Auth().isLogin(_token);

        if (my_user_id == 0) revert("access_denied_1");

        if(user_id == 0){
            user_cars[my_user_id].push(car_data);
            return;
        }


        uint access_level = _UserAccess().getModuleAccessLevel("User", my_user_id);

        if(access_level <= uint(IUserAccess.AccessLevel.FIRST)){
            revert("access_denied_2");
        }

        if(users[user_id].id == 0)
            revert("user_not_found");

        user_cars[user_id].push(car_data);

    }

    function _removeCar(uint256 user_id, uint _index) internal {

        if (_index >= user_cars[user_id].length) {
            revert("car_not_found");
        }
   
        for (uint i = _index; i < user_cars[user_id].length - 1; i++) {
            user_cars[user_id][i] = user_cars[user_id][i + 1];
        }

        user_cars[user_id].pop();
    }


    function removeCar(bytes32 _token, uint256 user_id, uint _index) external {
        uint256 my_user_id = _Auth().isLogin(_token);

        if (my_user_id == 0) revert("access_denied");

        if(user_id == 0){
            _removeCar(my_user_id, _index);
            return;
        }

        uint access_level = _UserAccess().getModuleAccessLevel("User", my_user_id);

        if(access_level <= uint(IUserAccess.AccessLevel.FIRST)){
            revert("access_denied");
        }


        if(users[user_id].id == 0)
            revert("user_not_found");

        _removeCar(user_id, _index);
    }


    function getCars(bytes32 _token, uint256 user_id) external view returns(CarData[] memory) {
        uint256 my_user_id = _Auth().isLogin(_token);

        if (my_user_id == 0) revert("access_denied");

        if(user_id == 0)
            return user_cars[my_user_id];


        uint access_level = _UserAccess().getModuleAccessLevel("User", my_user_id);

        if(access_level <= uint(IUserAccess.AccessLevel.FIRST)){
            revert("access_denied");
        }
    
        return user_cars[user_id];
        
    }

    function updateCompanyInfo(bytes32 _token, uint256 user_id, Company memory company_data) external{
        uint256 my_user_id = _Auth().isLogin(_token);

        if (my_user_id == 0) revert("access_denied");

        if(user_id == 0){
            users[my_user_id].user_type = IUser.TypeUser.COMPANY;

            user_company_data[my_user_id] = company_data;
            return;
        }

        uint access_level = _UserAccess().getModuleAccessLevel("User", my_user_id);

        if(access_level <= uint(IUserAccess.AccessLevel.FIRST)){
            revert("access_denied");
        }

        users[user_id].user_type = IUser.TypeUser.COMPANY;

        user_company_data[user_id] = company_data;

    }

    function getCompanyInfo(bytes32 _token, uint256 user_id) external view returns(Company memory){
        uint256 my_user_id = _Auth().isLogin(_token);

        if (my_user_id == 0) revert("access_denied");
        
        if(user_id == 0)
            return user_company_data[my_user_id];

        uint access_level = _UserAccess().getModuleAccessLevel("User", my_user_id);

        if(access_level <= uint(IUserAccess.AccessLevel.FIRST)){
            revert("access_denied");
        }    
        
        return user_company_data[user_id];
    }

    function fromContractUpdateData(uint256 user_id, bytes32 first_name, bytes32 last_name, bytes32 language_code, uint256 tg_id) onlyAuthContract external {
        users[user_id].first_name = first_name;
        users[user_id].last_name = last_name;
        users[user_id].language_code = language_code;
        users[user_id].tg_id = tg_id;
    }

    function fromContractUpdatePhone(uint256 user_id, bytes32 phone) onlyAuthContract external {
        users[user_id].phone = phone;
    }

    function fromContractUpdateEmail(uint256 user_id, bytes32 email) onlyAuthContract external {
        users[user_id].email = email;
    }

    function fromContractUpdateUsername(uint256 user_id, bytes32 username) external {

        if(IHub(hubAddress).getModule("Auth", partner_id) != msg.sender)
            revert("access_denied");

        users[user_id].username = username;
    }
}