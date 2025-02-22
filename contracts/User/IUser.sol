// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

interface IUser {

    enum TypeUser{DEFAULT, COMPANY}

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

    struct CarData{
        string brand;
        string model;
        uint8[] connectors;
    }

    event AddUser(address account);

    function getVersion() external pure returns(string memory);
    function addUser(address account) external returns (uint256);
    function whoami() external view returns (User memory);
    function getUser(address account) external view returns (IUser.User memory);
    function addCar(address account, CarData memory car_data) external;
    function removeCar(address account, uint _index) external;
    function getCars(address account) external view returns(CarData[] memory);
    function updateCompanyInfo(address account, Company memory company_data) external;
    function getCompanyInfo(address account) external view returns(Company memory);
}