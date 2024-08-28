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

    function registerByPassword(bytes32 username, bytes memory password) external;

    function authByPassword(bytes32 username, bytes memory pass) external;

    function getAuthToken(bytes32 username, bytes memory pass, uint token_id) external view returns(AuthToken memory, bytes32);

    function isLogin(bytes32 _token) external view returns (uint256);

    function whoami(bytes32 _token) external view returns (User memory);
}