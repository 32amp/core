// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./IUser.sol";
import "./IUserAccess.sol";
import "../Hub/IHub.sol";

/**
 * @title User Management Contract
 * @notice Handles user profiles, car data, and company information
 * @dev Manages user data storage and access control for user-related operations
 * @custom:warning Requires proper initialization and ownership for modifications
 */
contract User is IUser, Initializable, OwnableUpgradeable {
    // Storage mappings documentation
    /// @dev User profile storage
    mapping(address => IUser.User) users;
    
    /// @dev Company information storage
    mapping(address => IUser.Company) user_company_data;
    
    /// @dev User car data storage
    mapping(address => IUser.CarData[]) user_cars;

    // State variables documentation
    /// @dev Auto-incrementing user ID counter
    uint256 usersIndex;
    
    /// @notice Hub contract reference
    address hubContract;
    
    /// @notice Associated partner ID
    uint256 partner_id;

    /**
     * @notice Returns the current contract version
     * @return string Contract version identifier
     */
    function getVersion() external pure returns(string memory) {
        return "1.1";
    }

    /**
     * @dev Returns UserAccess module interface
     * @return IUserAccess UserAccess module instance
     */
    function _UserAccess() private view returns(IUserAccess) {
        return IUserAccess(IHub(hubContract).getModule("UserAccess", partner_id));
    }


    modifier onlyAdmin() {
        _UserAccess().checkAccessModule( msg.sender, "User", uint(IUserAccess.AccessLevel.FOURTH));
        _;
    }

    /**
     * @notice Initializes the contract with Hub connection
     * @param _partner_id Partner ID from Hub registry
     * @param _hubContract Address of Hub contract
     * @custom:init Called once during proxy deployment
     */
    function initialize(uint256 _partner_id, address _hubContract) external initializer {
        hubContract = _hubContract;
        partner_id = _partner_id;        
        __Ownable_init(msg.sender);
    }

    /**
     * @notice Adds a new user to the system
     * @param account Address of the user to add
     * @return uint256 New user ID
     * @custom:reverts onlyAdmin If caller is not the contract owner
     */
    function addUser(address account) onlyAdmin external returns (uint256) {

        if ( users[account].last_updated != 0) 
            revert AlreadyExist("User");

        usersIndex++;

        users[account].id = usersIndex;
        users[account].last_updated = block.timestamp;
        users[account].enable = true;

        return usersIndex;
    }

    /**
     * @notice Retrieves the caller's user profile
     * @return IUser.User User profile data
     */    
    function whoami() external view returns (IUser.User memory) {
        return users[msg.sender];
    }

    /**
     * @notice Checks if a user exists by address
     * @param account Address of the user to check
     * @custom:reverts ObjectNotFound If user does not exist
     */    
    function exist(address account) public view {
        if(users[account].id == 0)
            revert ObjectNotFound("User", 0);
    }

    /**
     * @notice Access control modifier requiring user existence
     */    
    modifier _exist() {
        exist(msg.sender);
        _;
    }

    /**
     * @notice Retrieves user profile by address
     * @param account Address of the user to query
     * @return IUser.User User profile data
     * @custom:reverts AccessDeniedLevel If caller lacks sufficient access
     * @custom:reverts ObjectNotFound If user does not exist
     */    
    function getUser(address account) external view returns (IUser.User memory) {
        exist(account);

        return users[account];
    }

    /**
     * @dev Internal function to update user profile data
     * @param account Address of the user to update
     * @param first_name User's first name
     * @param last_name User's last name
     * @param language_code Preferred language code
     */
    function _updateData(address account, string calldata first_name, string calldata last_name, string calldata language_code) internal {
        exist(account);

        users[account].first_name = first_name;
        users[account].last_name = last_name;
        users[account].language_code = language_code;
    }

    /**
     * @notice Sets user phone number
     * @param account Address of the user to update
     * @param phone Encrypted phone number to set
     * @custom:reverts onlyAdmin If caller is not the contract owner
     */    
    function setPhone(address account, string calldata phone) onlyAdmin external{
        users[account].phone = phone;
    }

    /**
     * @notice Sets user email address
     * @param account Address of the user to update
     * @param email Encrypted email address to set
     * @custom:reverts onlyAdmin If caller is not the contract owner
     */    
    function setEmail(address account, string calldata email) onlyAdmin external{
        users[account].email = email;
    }

        /**
     * @notice Sets user tg_id
     * @param account Address of the user to update
     * @param tg_id Encrypted telegram id to set
     * @custom:reverts onlyAdmin If caller is not the contract owner
     */    
    function setTgId(address account, string calldata tg_id) onlyAdmin external{
        users[account].tg_id = tg_id;
    }

    /**
     * @notice Updates user profile data
     * @param account Address of the user to update
     * @param first_name Encrypted user's first name
     * @param last_name Encrypted user's last name
     * @param language_code Encrypted preferred language code
     * @custom:reverts AccessDeniedLevel If caller lacks sufficient access
     */    
    function updateBaseData( address account, string calldata first_name, string calldata last_name, string calldata language_code) external {

        if(account == address(0)){
            _updateData(msg.sender,first_name, last_name, language_code);
            return;
        }

        uint access_level = _UserAccess().getModuleAccessLevel("User", msg.sender);

        if(access_level <= uint(IUserAccess.AccessLevel.FIRST)){
            revert AccessDeniedLevel("User", uint8(IUserAccess.AccessLevel.FIRST));
        }

        _updateData(account, first_name, last_name, language_code);
    }

    /**
     * @notice Adds a car to a user's profile
     * @param account Address of the user to update
     * @param car_data Car data structure to add
     * @custom:reverts AccessDeniedLevel If caller lacks sufficient access
     */
    function addCar(address account, CarData calldata car_data) external{
        
        if(account == address(0)){
            exist(msg.sender);
            user_cars[msg.sender].push(car_data);
            return;
        }

        uint access_level = _UserAccess().getModuleAccessLevel("User", msg.sender);

        if(access_level <= uint(IUserAccess.AccessLevel.FIRST)){
            revert AccessDeniedLevel("User", uint8(IUserAccess.AccessLevel.FIRST));
        }

        exist(account);

        user_cars[account].push(car_data);

    }

    /**
     * @dev Internal function to remove a car from a user's profile
     * @param account Address of the user to update
     * @param _index Index of the car to remove
     * @custom:reverts ObjectNotFound If car index is invalid
     */    
    function _removeCar(address account, uint _index) internal {
        
        exist(account);
        
        if (_index >= user_cars[account].length) {
            revert ObjectNotFound("User:Car", _index);
        }
   
        for (uint i = _index; i < user_cars[account].length - 1; i++) {
            user_cars[account][i] = user_cars[account][i + 1];
        }

        user_cars[account].pop();
    }

    /**
     * @notice Removes a car from a user's profile
     * @param account Address of the user to update
     * @param _index Index of the car to remove
     * @custom:reverts AccessDeniedLevel If caller lacks sufficient access
     */
    function removeCar( address account, uint _index) external {

        if(account == address(0)){
            _removeCar(msg.sender, _index);
            return;
        }

        uint access_level = _UserAccess().getModuleAccessLevel("User", msg.sender);

        if(access_level <= uint(IUserAccess.AccessLevel.FIRST)){
            revert AccessDeniedLevel("User", uint8(IUserAccess.AccessLevel.FIRST));
        }

        
        _removeCar(account, _index);
    }

    /**
     * @notice Retrieves a user's car data
     * @param account Address of the user to query
     * @return CarData[] Array of car data structures
     * @custom:reverts AccessDeniedLevel If caller lacks sufficient access
     */
    function getCars(address account) external view returns(CarData[] memory) {
        

        if(account == address(0)){
            exist(msg.sender);
            return user_cars[msg.sender];
        }
            
        exist(account);
    
        return user_cars[account];
        
    }

    /**
     * @notice Updates company information for a user
     * @param account Address of the user to update
     * @param company_data Company data structure to set
     * @custom:reverts AccessDeniedLevel If caller lacks sufficient access
     */    
    function updateCompanyInfo(address account, Company calldata company_data) external{

        if(account == address(0)){
            exist(msg.sender);
            users[msg.sender].user_type = IUser.TypeUser.COMPANY;

            user_company_data[msg.sender] = company_data;
            return;
        }

        uint access_level = _UserAccess().getModuleAccessLevel("User", msg.sender);

        if(access_level <= uint(IUserAccess.AccessLevel.FIRST)){
            revert AccessDeniedLevel("User", uint8(IUserAccess.AccessLevel.FIRST));
        }

        exist(account);

        users[account].user_type = IUser.TypeUser.COMPANY;

        user_company_data[account] = company_data;

    }

    /**
     * @notice Retrieves company information for a user
     * @param account Address of the user to query
     * @return Company Company data structure
     * @custom:reverts AccessDeniedLevel If caller lacks sufficient access
     */    
    function getCompanyInfo(address account) external view returns(Company memory){
        
        if(account == address(0)){
            exist(msg.sender);
            return user_company_data[msg.sender];
        }

        exist(account);
        
        return user_company_data[account];
    }
}