// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./IUser.sol";
import "./IUserAccess.sol";
import "../Hub/IHub.sol";
import "../Services/IMessageOracle.sol";
import "../RevertCodes/IRevertCodes.sol";

contract User is IUser, Initializable, OwnableUpgradeable {
    mapping(address => IUser.User) users;
    mapping(address => IUser.Company) user_company_data;
    mapping(address => IUser.CarData[]) user_cars;

    uint256 usersIndex;
    address hubContract;
    uint256 partner_id;

    function getVersion() external pure returns(string memory){
        return "1.0";
    }

    function _UserAccess() private view returns(IUserAccess) {
        return IUserAccess(IHub(hubContract).getModule("UserAccess", partner_id));
    }

    function _RevertCodes() private view returns(IRevertCodes) {
        return IRevertCodes(IHub(hubContract).getModule("RevertCodes", partner_id));
    }


    function initialize(uint256 _partner_id, address _hubContract) external initializer {
        hubContract = _hubContract;
        partner_id = _partner_id;        
        __Ownable_init(msg.sender);
    }

    function registerRevertCodes() external {
        _RevertCodes().registerRevertCode("User", "access_denied", "Access denied");
        _RevertCodes().registerRevertCode("User", "user_not_found", "User not found");
        _RevertCodes().registerRevertCode("User", "car_not_found", "Car not found");
    }

    
    function addUser(address account) onlyOwner external returns (uint256) {

        usersIndex++;

        users[account].id = usersIndex;
        users[account].last_updated = block.timestamp;
        users[account].enable = true;

        return usersIndex;
    }

    function whoami() external view returns (IUser.User memory) {
        return users[msg.sender];
    }

    function exist(address account) public view {
        if(users[account].id == 0)
            revert("user_not_found");
    }

    modifier _exist() {
        exist(msg.sender);
        _;
    }

    function getUser(address account) external view returns (IUser.User memory) {
        exist(account);

        uint access_level = _UserAccess().getModuleAccessLevel("User", msg.sender);

        if(access_level <= uint(IUserAccess.AccessLevel.FIRST)){
            revert("access_denied");
        }

        return users[account];
    }


    function _updateData(address account, string calldata first_name, string calldata last_name, string calldata language_code) internal {
        exist(account);

        users[account].first_name = first_name;
        users[account].last_name = last_name;
        users[account].language_code = language_code;
    }

    function setPhone(address account, string calldata phone) onlyOwner external{
        users[account].phone = phone;
    }

    function setEmail(address account, string calldata email) onlyOwner external{
        users[account].email = email;
    }

    function updateBaseData( address account, string calldata first_name, string calldata last_name, string calldata language_code) external {

        if(account == address(0)){
            _updateData(msg.sender,first_name, last_name, language_code);
            return;
        }

        uint access_level = _UserAccess().getModuleAccessLevel("User", msg.sender);

        if(access_level <= uint(IUserAccess.AccessLevel.FIRST)){
            revert("access_denied");
        }

        _updateData(account, first_name, last_name, language_code);
    }


    function addCar(address account, CarData memory car_data) external{
        
        if(account == address(0)){
            exist(msg.sender);
            user_cars[msg.sender].push(car_data);
            return;
        }

        uint access_level = _UserAccess().getModuleAccessLevel("User", msg.sender);

        if(access_level <= uint(IUserAccess.AccessLevel.FIRST)){
            revert("access_denied");
        }

        exist(account);

        user_cars[account].push(car_data);

    }

    function _removeCar(address account, uint _index) internal {
        
        exist(account);
        
        if (_index >= user_cars[account].length) {
            revert("car_not_found");
        }
   
        for (uint i = _index; i < user_cars[account].length - 1; i++) {
            user_cars[account][i] = user_cars[account][i + 1];
        }

        user_cars[account].pop();
    }


    function removeCar( address account, uint _index) external {

        if(account == address(0)){
            _removeCar(msg.sender, _index);
            return;
        }

        uint access_level = _UserAccess().getModuleAccessLevel("User", msg.sender);

        if(access_level <= uint(IUserAccess.AccessLevel.FIRST)){
            revert("access_denied");
        }

        
        _removeCar(account, _index);
    }


    function getCars(address account) external view returns(CarData[] memory) {
        

        if(account == address(0)){
            exist(msg.sender);
            return user_cars[msg.sender];
        }
            
        uint access_level = _UserAccess().getModuleAccessLevel("User", msg.sender);

        if(access_level <= uint(IUserAccess.AccessLevel.FIRST)){
            revert("access_denied");
        }

        exist(account);
    
        return user_cars[account];
        
    }

    function updateCompanyInfo(address account, Company memory company_data) external{

        if(account == address(0)){
            exist(msg.sender);
            users[msg.sender].user_type = IUser.TypeUser.COMPANY;

            user_company_data[msg.sender] = company_data;
            return;
        }

        uint access_level = _UserAccess().getModuleAccessLevel("User", msg.sender);

        if(access_level <= uint(IUserAccess.AccessLevel.FIRST)){
            revert("access_denied");
        }

        exist(account);

        users[account].user_type = IUser.TypeUser.COMPANY;

        user_company_data[account] = company_data;

    }

    function getCompanyInfo(address account) external view returns(Company memory){
        
        if(account == address(0)){
            exist(msg.sender);
            return user_company_data[msg.sender];
        }

        uint access_level = _UserAccess().getModuleAccessLevel("User", msg.sender);

        if(access_level <= uint(IUserAccess.AccessLevel.FIRST)){
            revert("access_denied");
        }    

        exist(account);
        
        return user_company_data[account];
    }
}