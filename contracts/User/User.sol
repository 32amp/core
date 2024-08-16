// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./IUser.sol";
import "../Hub/IHub.sol";

contract User is IUser, Initializable, OwnableUpgradeable {
    mapping(uint256 => IUser.User) users;
    mapping(uint256 => bytes32) passwords;
    mapping(bytes32 => IUser.AuthToken) auth_tokens;
    mapping(bytes32 => IUser.AuthToken) public_tokens;
    mapping(uint256 => bytes32[]) user_tokens;

    mapping(bytes32 => uint256) logins_index;
    uint256 usersIndex;
    string version;
    address hubAddress;
    uint256 partner_id;


    function initialize(uint256 _partner_id, address _hubAddress, bytes32 sudoUsername, bytes memory sudopassword) external initializer {
        hubAddress = _hubAddress;
        partner_id = _partner_id;
        version = "1.0";
        registerByPassword(sudoUsername, sudopassword);
        
    }

    function registerByPassword( bytes32 username, bytes memory password ) public {
        uint256 exist_id = logins_index[username];

        if (exist_id > 0) revert("user_exist");

        uint256 user_id = _addUser();
        users[user_id].username = username;
        passwords[user_id] = keccak256(password);

        logins_index[username] = usersIndex;
    }

    function _addUser() internal returns (uint256) {
        usersIndex++;
        users[usersIndex].id = usersIndex;
        users[usersIndex].last_updated = block.timestamp;
        users[usersIndex].enable = true;
        return usersIndex;
    }

    function _authByPassword(bytes32 username, bytes memory pass) private view returns (uint256) {
        uint256 user_id = logins_index[username];

        if (user_id == 0) revert("login_notfound");

        bytes32 password = keccak256(pass);

        if (password != passwords[user_id]) revert("password_incorrect");

        return user_id;
    }

    function authByPassword(bytes32 username, bytes memory pass) external {
        uint256 user_id = _authByPassword(username, pass);
        _createAuthToken(user_id, pass);
    }

    function getAuthToken(bytes32 username,bytes memory pass,uint token_id) external view returns (IUser.AuthToken memory, bytes32) {
        uint256 user_id = _authByPassword(username, pass);
        bytes32 token = user_tokens[user_id][token_id];
        return (auth_tokens[token], token);
    }

    function _createAuthToken(uint256 user_id, bytes memory salt) internal {
        IUser.AuthToken memory token;
        token.date_start = block.timestamp;
        token.date_expire = block.timestamp + 130 days;
        token.user_id = user_id;
        token._type = IUser.TokenType.APP_USER;
        token.visual_number = block.timestamp+usersIndex;

        token.uid = keccak256(
            abi.encodePacked(block.difficulty, block.timestamp, user_id, salt, token.date_start, token.date_expire, token.visual_number )
        );

        token.issuer = IHub(hubAddress).getPartnerName(partner_id);

        bytes32 _token = keccak256(
            abi.encodePacked(block.difficulty, block.timestamp, user_id, salt)
        );
        user_tokens[user_id].push(_token);
        auth_tokens[_token] = token;
        public_tokens[token.uid] = token;

        emit CreateAuthToken(user_id, user_tokens[user_id].length - 1);
    }

    function isLogin(bytes32 _token) external view returns (uint256) {
        IUser.AuthToken memory token = auth_tokens[_token];

        if (token.date_start == 0) return 0;

        if (token.date_expire < block.timestamp) return 0;

        return token.user_id;
    }

    function whoami(bytes32 _token) external view returns (IUser.User memory) {
        uint256 user_id = this.isLogin(_token);

        if (user_id == 0) revert("access_denied");

        return users[user_id];
    }
}