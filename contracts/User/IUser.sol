// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

interface IUser {

    enum TypeUser{DEFAULT, COMPANY}

    struct User {
        uint256 id;
        uint256 tg_id;
        bytes32 phone;
        bytes32 email;
        bytes32 username;
        bytes32 first_name;
        bytes32 last_name;
        bytes32 language_code;
        TypeUser user_type;
        bool enable; 
        uint256 last_updated;
    }

    struct Company {
        string name;
        string description;
        uint256 inn;
        uint256 kpp;
        uint256 ogrn;
        uint256 bank_account;
        string bank_name;
        uint256 bank_bik;
        uint256 bank_corr_account;
        uint256 bank_inn;
        uint256 bank_kpp_account;
    }

    struct CarData{
        string brand;
        string model;
        uint8[] connectors;
    }

    struct AutoPaymentData {
        uint256 sum_payment;
        uint256 month_limit_pay;
        uint256 min_balance;
    }

    event AddUser(uint256 user_id);

    function getVersion() external pure returns(string memory);
    function addUser() external returns (uint256);
    function whoami(bytes32 _token) external view returns (User memory);
    function getUser(bytes32 _token, uint256 _user_id) external view returns (IUser.User memory);
    function addCar(bytes32 _token, uint256 user_id, CarData memory car_data) external;
    function removeCar(bytes32 _token, uint256 user_id, uint _index) external;
    function getCars(bytes32 _token, uint256 user_id) external view returns(CarData[] memory);
    function updateCompanyInfo(bytes32 _token, uint256 user_id, Company memory company_data) external;
    function getCompanyInfo(bytes32 _token, uint256 user_id) external view returns(Company memory);

    function fromContractUpdateData(uint256 user_id, bytes32 first_name, bytes32 last_name, bytes32 language_code, uint256 tg_id) external;
    function fromContractUpdatePhone(uint256 user_id, bytes32 phone) external;
    function fromContractUpdateEmail(uint256 user_id, bytes32 email) external;
    function fromContractUpdateUsername(uint256 user_id, bytes32 username) external;
}