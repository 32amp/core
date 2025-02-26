// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

import "../IBaseErrors.sol";

/**
 * @title IUser Interface
 * @dev This interface defines the user-related structures and events.
 */
interface IUser is IBaseErrors {

    /**
     * @dev Enum representing the type of user.
     */
    enum TypeUser {DEFAULT, COMPANY}

    /**
     * @dev Struct representing a user.
     * @param id The unique identifier for the user.
     * @param tg_id The Telegram ID of the user.
     * @param phone The phone number of the user.
     * @param email The email address of the user.
     * @param first_name The first name of the user.
     * @param last_name The last name of the user.
     * @param language_code The language code preferred by the user (e.g., "en", "ru").
     * @param user_type The type of the user (either DEFAULT or COMPANY).
     * @param enable A boolean indicating whether the user account is enabled.
     * @param last_updated The timestamp of the last update to the user's information.
     */
    struct User {
        uint256 id;
        uint256 tg_id;
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
     * @dev Struct representing company-specific information for a user.
     * @param name The name of the company.
     * @param description A brief description of the company.
     * @param inn The Taxpayer Identification Number (INN) of the company.
     * @param kpp The Tax Registration Reason Code (KPP) of the company.
     * @param ogrn The Primary State Registration Number (OGRN) of the company.
     * @param bank_account The bank account number of the company.
     * @param bank_name The name of the bank where the company has an account.
     * @param bank_bik The Bank Identifier Code (BIK) of the company's bank.
     * @param bank_corr_account The correspondent account number of the company's bank.
     * @param bank_inn The INN of the company's bank.
     * @param bank_kpp_account The KPP associated with the company's bank account.
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
     * @dev Struct representing data related to a car owned by a user.
     * @param brand The brand of the car (e.g., "Toyota").
     * @param model The model of the car (e.g., "Camry").
     * @param connectors An array of connector types supported by the car (e.g., charging connectors).
     */
    struct CarData {
        string brand;
        string model;
        uint8[] connectors;
    }

    /**
     * @dev Event emitted when a new user is added to the system.
     * @param account The address of the newly added user account.
     */
    event AddUser(address account);

    function getVersion() external pure returns(string memory);
    function addUser(address account) external returns (uint256);
    function whoami() external view returns (User memory);
    function getUser(address account) external view returns (IUser.User memory);
    function addCar(address account, CarData calldata car_data) external;
    function removeCar(address account, uint _index) external;
    function getCars(address account) external view returns(CarData[] memory);
    function updateCompanyInfo(address account, Company calldata company_data) external;
    function getCompanyInfo(address account) external view returns(Company memory);
}