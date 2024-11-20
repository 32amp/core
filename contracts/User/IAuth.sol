// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

interface IAuth {

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


    struct WebAppUserData{
        uint64 id;
        bytes32 first_name;
        bytes32 last_name;
        bytes32 language_code;
    }

    

    event CreateAuthToken(uint256 user_id, uint token_id);

    function getVersion() external pure returns(string memory);
    function setTestUserByPhone(bytes32 phone_number, bytes32 code)  external;
    function setTestUserByEmail(bytes32 email, bytes32 code) external;
    function registerByPassword(bytes32 username, bytes memory password) external;
    function authByPassword(bytes32 username, bytes memory pass) external;
    function getAuthTokenByPassword(bytes32 username, bytes memory pass, uint token_id) external view returns(AuthToken memory, bytes32);
    function getAuthTokenBySMS(bytes32 phone_number, bytes32 code,uint token_id) external view returns (AuthToken memory, bytes32);
    function getAuthTokenByEmail(bytes32 email, bytes32 code,uint token_id) external view returns (AuthToken memory, bytes32);
    function getAuthTokenByTG(bytes memory payload, bytes32 _hash, WebAppUserData memory user_data, uint token_id) external view returns (AuthToken memory, bytes32);
    function getAuthTokenByTGV2(bytes memory payload, bytes32 _hash, WebAppUserData memory user_data, uint token_id) external view returns (AuthToken memory, bytes32);
    function isLogin(bytes32 _token) external view returns (uint256);
    function sendSmsForAuth(bytes32 recipient) external;
    function authBySmsCode(bytes32 phone_number, bytes32 code) external;
    function sendEmailForAuth(bytes32 recipient) external;
    function authByEmailCode(bytes32 email, bytes32 code) external;
    function authByTg(bytes memory payload, bytes32 _hash, WebAppUserData memory user_data ) external;
    function authByTgV2(bytes memory payload, bytes32 _hash, WebAppUserData memory user_data ) external;
}