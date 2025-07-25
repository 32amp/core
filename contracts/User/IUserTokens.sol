// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "../IBaseErrors.sol";
import "../DataTypes.sol";

/**
 * @title User Tokens Management Interface
 * @notice Defines the data structures and error handling for group management
 * @dev Inherits from IBaseErrors for standardized error handling
 */
interface IUserTokens is IBaseErrors, DataTypes {

    enum TokenType{
        NoAuthorization,
        ISO14443,
        ISO15118,
        Central,
        eMAID,
        KeyCode,
        Local,
        MacAddress
    }

    struct Add {
        string encrypted_token_id;
        string encrypted_token_id_16;
        bytes32 hash_token_id;
        bytes32 hash_token_id_16;
        TokenType token_type;
        uint256 expire_date;
        address account_for;
    }

    struct idToken {
        uint256 id;
        string encrypted_token_id;
        string encrypted_token_id_16;
        bytes32 hash_token_id;
        bytes32 hash_token_id_16;
        TokenType token_type;
        address owner;
        address account_for;
        uint256 expire_date;
        bool is_blocked;
    }

    struct Policy {
        uint256[] allowed_evse_ids;
        uint256[] allowed_location_ids;
        uint256 max_energy_kwh;
        uint256 tariff;
        DailyLimit daily_limit;
    }

    struct DailyLimit {
        uint16 energy;
        uint256 cost;
    }


    error TokenExist();
    error TokenExpireDate();

    event New(uint256 id, bytes32 indexed hash_token_id, bytes32 indexed hash_token_id_16, TokenType token_type);
    event BlockedToken(bytes32 indexed hash_token_id, bytes32 indexed hash_token_id_16);
    event UnblockedToken(bytes32 indexed hash_token_id, bytes32 indexed hash_token_id_16);
    event UpdateExpireDate(bytes32 indexed hash_token_id, bytes32 indexed hash_token_id_16, uint256 expire_date);
    event UpdateTokenType(bytes32 indexed hash_token_id, bytes32 indexed hash_token_id_16, TokenType token_type);
    event UpdateTokenPolicy(bytes32 indexed hash_token_id, bytes32 indexed hash_token_id_16);

    function getTariffFromPrimaryToken(address account, Context calldata ctx) external view returns(uint256);
}