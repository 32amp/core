// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "../IBaseErrors.sol";

/**
 * @title IUser Interface
 * @dev This interface defines the user-related structures and events.
 */
interface IUser is IBaseErrors {

    /**
     * @notice User type enumeration
     * @dev Distinguishes between default and company users
     */
    enum TypeUser {DEFAULT, COMPANY}

    /**
     * @title User Data Structure
     * @notice Represents a user profile in the system
     * @dev Contains encrypted personal and contact information
     * @param id Unique user identifier
     * @param tg_id Encrypted Telegram ID
     * @param phone Encrypted phone number
     * @param email Encrypted email address
     * @param first_name Encrypted first name
     * @param last_name Encrypted last name
     * @param language_code Encrypted preferred language code (e.g., "en", "ru")
     * @param user_type User type (DEFAULT or COMPANY)
     * @param enable Whether the user account is enabled
     * @param last_updated Timestamp of the last update
     */
    struct User {
        uint256 id;
        string tg_id;
        string phone;
        string email;
        string first_name;
        string last_name;
        string language_code;
        TypeUser user_type;
        bool enable; 
        uint256 last_updated;
    }

    /**
     * @title Company Data Structure
     * @notice Represents company-specific information for a user
     * @dev All fields are encrypted
     * @param name Company name
     * @param description Company description
     * @param inn Taxpayer Identification Number (INN)
     * @param kpp Tax Registration Reason Code (KPP)
     * @param ogrn Primary State Registration Number (OGRN)
     * @param bank_account Bank account number
     * @param bank_name Name of the bank
     * @param bank_bik Bank Identifier Code (BIK)
     * @param bank_corr_account Correspondent account number
     * @param bank_inn Bank's INN
     * @param bank_kpp_account KPP associated with the bank account
     */
    struct Company {
        string name;
        string description;
        string inn;
        string kpp;
        string ogrn;
        string bank_account;
        string bank_name;
        string bank_bik;
        string bank_corr_account;
        string bank_inn;
        string bank_kpp_account;
    }

    /**
     * @title Car Data Structure
     * @notice Represents data related to a user's car
     * @dev All fields are encrypted except connectors
     * @param brand Car brand (e.g., "Toyota")
     * @param model Car model (e.g., "Camry")
     * @param connectors Array of supported connector types
     */
    struct CarData {
        string brand;
        string model;
        uint8[] connectors;
    }

    /**
     * @notice Emitted when a new user is added to the system
     * @param account Address of the newly added user account
     */
    event AddUser(address account);

    function getVersion() external pure returns(string memory);
    function addUser(address account) external returns (uint256);
    function whoami() external view returns (User memory);
    function exist(address account) external view;
    function getUser(address account) external view returns (IUser.User memory);
    function addCar(address account, CarData calldata car_data) external;
    function removeCar(address account, uint _index) external;
    function getCars(address account) external view returns(CarData[] memory);
    function updateBaseData( address account, string calldata first_name, string calldata last_name, string calldata language_code) external;
    function setPhone(address account, string calldata phone) external;
    function setEmail(address account, string calldata email) external;
    function setTgId(address account, string calldata tg_id) external;
    function updateCompanyInfo(address account, Company calldata company_data) external;
    function getCompanyInfo(address account) external view returns(Company memory);
}