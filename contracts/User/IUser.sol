// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

interface IUser {

    enum TypeUser{DEFAULT, COMPANY}

    struct User {
        uint256 id;
        string name;
        bytes32 phone;
        bytes32 email;
        bytes32 username;
        bytes32 first_name;
        bytes32 last_name;
        uint256 tg_id;
        bytes32 language_code;
        TypeUser user_type;
        bool enable; 
        uint256 last_updated;
    }

    enum TokenType {
        None,
        AD_HOC_USER,
        APP_USER,
        OTHER,
        RFID
    }

    enum AuthType {
        PASSWORD,
        SMS,
        EMAIL,
        TG
    }

    struct AuthToken {
        uint256 user_id;
        bytes32 uid;
        TokenType _type;
        uint visual_number;
        bytes32 issuer;
        string group_id;
        uint256 date_start;
        uint256 date_expire;
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

    struct WebAppUserData{
        uint64 id;
        bytes32 first_name;
        bytes32 last_name;
        bytes32 language_code;
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


    

    event CreateAuthToken(uint256 user_id, uint token_id);

    function getVersion() external pure returns(string memory);
    function setTestUserByPhone(bytes32 phone_number, bytes32 code)  external;
    function setTestUserByEmail(bytes32 email, bytes32 code) external;
    function registerByPassword(bytes32 username, bytes memory password) external;
    function authByPassword(bytes32 username, bytes memory pass) external;
    function getAuthTokenByPassword(bytes32 username, bytes memory pass, uint token_id) external view returns(AuthToken memory, bytes32);
    function getAuthTokenBySMS(bytes32 phone_number, bytes32 code,uint token_id) external view returns (IUser.AuthToken memory, bytes32);
    function getAuthTokenByEmail(bytes32 email, bytes32 code,uint token_id) external view returns (IUser.AuthToken memory, bytes32);
    function getAuthTokenByTG(bytes memory payload, bytes32 _hash, WebAppUserData memory user_data, uint token_id) external view returns (IUser.AuthToken memory, bytes32);
    function isLogin(bytes32 _token) external view returns (uint256);
    function whoami(bytes32 _token) external view returns (User memory);
    function getUser(bytes32 _token, uint256 _user_id) external view returns (IUser.User memory);
    function sendSmsForAuth(bytes32 recipient) external;
    function authBySmsCode(bytes32 phone_number, bytes32 code) external;
    function sendEmailForAuth(bytes32 recipient) external;
    function authByEmailCode(bytes32 email, bytes32 code) external;
    function authByTg(bytes memory payload, bytes32 _hash, WebAppUserData memory user_data ) external;
    function updateBaseData(bytes32 _token, uint256 user_id, bytes32 first_name, bytes32 last_name, bytes32 language_code) external;
    function addCar(bytes32 _token, uint256 user_id, CarData memory car_data) external;
    function removeCar(bytes32 _token, uint256 user_id, uint _index) external;
    function getCars(bytes32 _token, uint256 user_id) external view returns(CarData[] memory);
    function updateCompanyInfo(bytes32 _token, uint256 user_id, Company memory company_data) external;
    function getCompanyInfo(bytes32 _token, uint256 user_id) external view returns(Company memory);
}