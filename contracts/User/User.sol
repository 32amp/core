// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./IUser.sol";
import "./IUserAccess.sol";
import "../Hub/IHub.sol";
import "../Services/IMessageOracle.sol";
import "hardhat/console.sol";

contract User is IUser, Initializable, OwnableUpgradeable {
    mapping(uint256 => IUser.User) users;
    mapping(uint256 => IUser.Company) user_company_data;
    mapping(uint256 => IUser.CarData[]) user_cars;
    mapping(uint256 => bytes32) passwords;
    mapping(bytes32 => IUser.AuthToken) auth_tokens;
    mapping(bytes32 => IUser.AuthToken) public_tokens;
    mapping(uint256 => bytes32[]) user_tokens;

    mapping(bytes32 => uint256) logins_index;
    mapping(bytes32 => uint256) phone_logins_index;
    mapping(bytes32 => bytes32) sms_codes;
    mapping(bytes32 => bytes32) test_sms_codes;
    mapping(bytes32 => uint256) email_logins_index;
    mapping(uint256 => uint256) tg_users_index;
    mapping(bytes32 => bytes32) email_codes;
    mapping(bytes32 => bytes32) test_email_codes;
    

    uint256 usersIndex;
    string version;
    address hubAddress;
    address smsServiceAddress;
    address emailServiceAddress;
    uint256 partner_id;
    bytes tg_bot_token;

    function _UserAccess() private view returns(IUserAccess) {
        return IUserAccess(IHub(hubAddress).getModule("UserAccess", partner_id));
    }

    function initialize(uint256 _partner_id, address _hubAddress, bytes32 sudoUsername, bytes memory sudopassword, bytes memory  _tg_bot_token ) external initializer {
        hubAddress = _hubAddress;
        smsServiceAddress = IHub(_hubAddress).getService("SMSService");
        emailServiceAddress = IHub(_hubAddress).getService("EmailService");
        partner_id = _partner_id;
        version = "1.0";
        tg_bot_token = _tg_bot_token;
        registerByPassword(sudoUsername, sudopassword);
        
        __Ownable_init(msg.sender);
    }

    function _setTestUserByPhone(bytes32 phone_number, bytes32 code) internal {
        test_sms_codes[phone_number] = code;
    }

    function setTestUserByPhone(bytes32 phone_number, bytes32 code) onlyOwner external {
        _setTestUserByPhone(phone_number, code);
    }

    function _setTestUserByEmail(bytes32 email, bytes32 code) internal {
        test_email_codes[email] = code;
    }

    function setTestUserByEmail(bytes32 email, bytes32 code) onlyOwner external {
        _setTestUserByEmail(email, code);
    }

    function registerByPassword( bytes32 username, bytes memory password ) public {
        uint256 exist_id = logins_index[username];

        if (exist_id > 0) revert("user_exist");

        uint256 user_id = _addUser();
        users[user_id].username = username;
        passwords[user_id] = keccak256(password);

        logins_index[username] = usersIndex;
        _createAuthToken(user_id, bytes32(password));
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
        _createAuthToken(user_id, bytes32(pass));
    }

    function getAuthTokenByPassword(bytes32 username,bytes memory pass,uint token_id) external view returns (IUser.AuthToken memory, bytes32) {
        uint256 user_id = _authByPassword(username, pass);
        bytes32 token = user_tokens[user_id][token_id];
        return (auth_tokens[token], token);
    }

    function getAuthTokenBySMS(bytes32 phone_number, bytes32 code,uint token_id) external view returns (IUser.AuthToken memory, bytes32) {
        if(sms_codes[phone_number] != code)
            revert("code_not_match");

        uint256 user_id = phone_logins_index[phone_number];

        if(user_id == 0)
            revert("user_not_found");

        bytes32 token = user_tokens[user_id][token_id];
        return (auth_tokens[token], token);
    }

    function getAuthTokenByEmail(bytes32 email, bytes32 code,uint token_id) external view returns (IUser.AuthToken memory, bytes32) {
        if(email_codes[email] != code)
            revert("code_not_match");

        uint256 user_id = email_logins_index[email];

        if(user_id == 0)
            revert("user_not_found");

        bytes32 token = user_tokens[user_id][token_id];
        return (auth_tokens[token], token);
    }

    function getAuthTokenByTG(bytes memory payload, bytes32 _hash, WebAppUserData memory user_data, uint token_id) external view returns (IUser.AuthToken memory, bytes32) {
        if(!_authByTg(payload, _hash))
            revert("hash_invalid");

        uint256 user_id = tg_users_index[user_data.id];

        if(user_id == 0)
            revert("user_not_found");

        bytes32 token = user_tokens[user_id][token_id];
        return (auth_tokens[token], token);
    }

    function _createAuthToken(uint256 user_id, bytes32 salt) internal {
        IUser.AuthToken memory token;
        token.date_start = block.timestamp;
        token.date_expire = block.timestamp + 130 days;
        token.user_id = user_id;
        token._type = IUser.TokenType.APP_USER;
        token.visual_number = block.timestamp+usersIndex;

        token.uid = keccak256(
            abi.encodePacked(block.prevrandao, block.timestamp, user_id, salt, token.date_start, token.date_expire, token.visual_number )
        );

        token.issuer = IHub(hubAddress).getPartnerName(partner_id);

        bytes32 _token = keccak256(
            abi.encodePacked(block.prevrandao, block.timestamp, user_id, salt)
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

    function getUser(bytes32 _token, uint256 _user_id) external view returns (IUser.User memory) {
        uint256 user_id = this.isLogin(_token);

        if (user_id == 0) revert("access_denied");


        uint access_level = _UserAccess().getModuleAccessLevel("User", user_id);

        if(access_level <= uint(IUserAccess.AccessLevel.FIRST)){
            revert("access_denied");
        }

        return users[_user_id];
    }

    function sendSmsForAuth(bytes32 recipient) external {
        bytes32 code;

        if(test_sms_codes[recipient].length > 0)
            code = test_sms_codes[recipient];
        else 
            code = _random(1000,9999);

        IMessageOracle(smsServiceAddress).sendMessage(recipient, code);
        sms_codes[recipient] = code;
    }

    function authBySmsCode(bytes32 phone_number, bytes32 code) external {

        if(sms_codes[phone_number] != code)
            revert("code_not_match");

        uint256 exist_id = phone_logins_index[phone_number];

        if (exist_id > 0){
            _createAuthToken(exist_id, code);
        }else{
            uint256 user_id = _addUser();
            phone_logins_index[phone_number] = user_id;
            _createAuthToken(user_id, code);
        }
    }

    function sendEmailForAuth(bytes32 recipient) external {
        bytes32 code;

        if(test_email_codes[recipient].length > 0)
            code = test_email_codes[recipient];
        else 
            code = _random(1000,9999);

        IMessageOracle(emailServiceAddress).sendMessage(recipient, code);
        email_codes[recipient] = code;
    }

    function authByEmailCode(bytes32 email, bytes32 code) external {

        if(email_codes[email] != code)
            revert("code_not_match");

        uint256 exist_id = email_logins_index[email];

        if (exist_id > 0){
            _createAuthToken(exist_id, code);
        }else{
            uint256 user_id = _addUser();
            email_logins_index[email] = user_id;
            _createAuthToken(user_id, code);
        }
    }

    function _random(uint max_number,uint min_number) private view returns (bytes32) {
        uint amount = uint(keccak256(abi.encodePacked(block.timestamp, msg.sender, block.number))) % (max_number-min_number);
        amount = amount + min_number;
        return bytes32(abi.encode(amount));
   }


    function authByTg(bytes memory payload, bytes32 _hash, WebAppUserData memory user_data ) external {
        
        if(_authByTg(payload, _hash)){
            if(tg_users_index[user_data.id] == 0){
                uint256 user_id = _addUser();
                tg_users_index[user_data.id] = user_id;
                users[user_id].tg_id = user_data.id;
                _updateData(user_id,user_data.first_name, user_data.last_name, user_data.language_code);
                _createAuthToken(user_id, _hash);
            }else{
                _createAuthToken(tg_users_index[user_data.id], _hash);
            }
        }else{
            revert("access_denied");
        }
    }

    function _authByTg(bytes memory payload, bytes32 _hash ) internal view returns(bool) {
        bytes32 web_app_data = 0x5765624170704461746100000000000000000000000000000000000000000000;

        bytes32 secret_key = hmacsha256(tg_bot_token, abi.encodePacked(web_app_data));

        bytes32 calculated_hash = hmacsha256(payload, abi.encodePacked(secret_key));
        if(calculated_hash == _hash)
            return true;
        else
            return false;
    }

    function _updateData(uint256 user_id, bytes32 first_name, bytes32 last_name, bytes32 language_code) internal {
        users[user_id].first_name = first_name;
        users[user_id].last_name = last_name;
        users[user_id].language_code = language_code;
    }

    function updateBaseData(bytes32 _token, uint256 user_id, bytes32 first_name, bytes32 last_name, bytes32 language_code) external {
        uint256 my_user_id = this.isLogin(_token);

        if (my_user_id == 0) revert("access_denied");

        if(user_id == 0){
            _updateData(my_user_id,first_name, last_name, language_code);
            return;
        }

        uint access_level = _UserAccess().getModuleAccessLevel("User", my_user_id);

        if(access_level <= uint(IUserAccess.AccessLevel.FIRST)){
            revert("access_denied");
        }

        _updateData(user_id,first_name, last_name, language_code);
    }


    function addCar(bytes32 _token, uint256 user_id, CarData memory car_data) external{
        uint256 my_user_id = this.isLogin(_token);

        if (my_user_id == 0) revert("access_denied_1");

        if(user_id == 0){
            user_cars[my_user_id].push(car_data);
            return;
        }


        uint access_level = _UserAccess().getModuleAccessLevel("User", my_user_id);

        if(access_level <= uint(IUserAccess.AccessLevel.FIRST)){
            revert("access_denied_2");
        }

        if(users[user_id].id == 0)
            revert("user_not_found");

        user_cars[user_id].push(car_data);

    }

    function _removeCar(uint256 user_id, uint _index) internal {

        if (_index >= user_cars[user_id].length) {
            revert("car_not_found");
        }
   
        for (uint i = _index; i < user_cars[user_id].length - 1; i++) {
            user_cars[user_id][i] = user_cars[user_id][i + 1];
        }

        user_cars[user_id].pop();
    }


    function removeCar(bytes32 _token, uint256 user_id, uint _index) external {
        uint256 my_user_id = this.isLogin(_token);

        if (my_user_id == 0) revert("access_denied");

        if(user_id == 0){
            _removeCar(my_user_id, _index);
            return;
        }

        uint access_level = _UserAccess().getModuleAccessLevel("User", my_user_id);

        if(access_level <= uint(IUserAccess.AccessLevel.FIRST)){
            revert("access_denied");
        }


        if(users[user_id].id == 0)
            revert("user_not_found");

        _removeCar(user_id, _index);
    }


    function getCars(bytes32 _token, uint256 user_id) external view returns(CarData[] memory) {
        uint256 my_user_id = this.isLogin(_token);

        if (my_user_id == 0) revert("access_denied");

        if(user_id == 0)
            return user_cars[my_user_id];


        uint access_level = _UserAccess().getModuleAccessLevel("User", my_user_id);

        if(access_level <= uint(IUserAccess.AccessLevel.FIRST)){
            revert("access_denied");
        }
    
        return user_cars[user_id];
        
    }

    function updateCompanyInfo(bytes32 _token, uint256 user_id, Company memory company_data) external{
        uint256 my_user_id = this.isLogin(_token);

        if (my_user_id == 0) revert("access_denied");

        if(user_id == 0){
            users[my_user_id].user_type = IUser.TypeUser.COMPANY;

            user_company_data[my_user_id] = company_data;
            return;
        }

        uint access_level = _UserAccess().getModuleAccessLevel("User", my_user_id);

        if(access_level <= uint(IUserAccess.AccessLevel.FIRST)){
            revert("access_denied");
        }

        users[user_id].user_type = IUser.TypeUser.COMPANY;

        user_company_data[user_id] = company_data;

    }

    function getCompanyInfo(bytes32 _token, uint256 user_id) external view returns(Company memory){
        uint256 my_user_id = this.isLogin(_token);

        if (my_user_id == 0) revert("access_denied");
        
        if(user_id == 0)
            return user_company_data[my_user_id];

        uint access_level = _UserAccess().getModuleAccessLevel("User", my_user_id);

        if(access_level <= uint(IUserAccess.AccessLevel.FIRST)){
            revert("access_denied");
        }    
        
        return user_company_data[user_id];
    }


    function _xor(bytes memory a, bytes memory b) internal pure returns (bytes memory) {

        require(a.length == b.length, "Inputs must be of equal length");
        bytes memory result = new bytes(a.length);
        for (uint i = 0; i < a.length; i++) {
            result[i] = b[i] ^ a[i];
        }
        return result;
    }

    function hmacsha256( bytes memory message, bytes memory key) internal pure returns (bytes32) {


        // Block size for SHA-256 is 64 bytes
        uint blockSize = 64;

        // If key is longer than block size, hash it
        if (key.length > blockSize) {
            key = abi.encodePacked(sha256(key));
        }

        // Pad key to block size with zeros
        bytes memory paddedKey = new bytes(blockSize);
        for (uint i = 0; i < key.length; i++) {
            paddedKey[i] = key[i];
        }

        // Create inner and outer padding
        bytes memory o_key_pad = new bytes(blockSize);
        bytes memory i_key_pad = new bytes(blockSize);

        for (uint i = 0; i < blockSize; i++) {
            o_key_pad[i] = 0x5c;
            i_key_pad[i] = 0x36;
        }

        // XOR paddedKey with o_key_pad and i_key_pad
        o_key_pad = _xor(paddedKey, o_key_pad);
        i_key_pad = _xor(paddedKey, i_key_pad);

        // Perform inner hash
        bytes32 innerHash = sha256(abi.encodePacked(i_key_pad, message));

        // Perform outer hash
        return sha256(abi.encodePacked(o_key_pad, innerHash));
    }
}