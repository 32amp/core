// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../Hub/IHub.sol";
import "./IUserAccess.sol";
import "./IUserTokens.sol";
import "./IUser.sol";


/**
 * @title User Tokens Management Contract
 * @notice Handles creation and management of user tokens within the system
 * @dev Implements group-based access control with hierarchical permissions
 * @custom:warning Requires proper initialization and integrates with UserAccess module
 */
contract UserTokens is IUserTokens, Initializable {
    // State variables documentation
    /// @dev Auto-incrementing group ID counter
    uint256 counter;

    /// @notice Reference to the Hub contract
    address hubContract;

    /// @notice Partner ID associated with this contract
    uint256 partner_id;

    mapping(uint256 => idToken) tokens;
    mapping(uint256 => Policy) token_policy;
    mapping(bytes32 => uint256) token_id_index;
    mapping(bytes32 => uint256) token_id_16_index;
    mapping(address => mapping(TokenType => uint256[])) account_tokens;
    mapping(address => uint256) primary_central_token;

    /**
     * @notice Initializes the contract with default sudo group
     * @param _partner_id Partner ID from Hub registry
     * @param _hubContract Hub contract address
     * @dev Creates initial "sudo" group with contract owner as member
     * @custom:init Called once during proxy deployment
     */
    function initialize(
        uint256 _partner_id,
        address _hubContract
    ) external initializer {
        hubContract = _hubContract;
        partner_id = _partner_id;
    }

    /**
     * @notice Returns contract version
     * @return string Constant version identifier
     */
    function getVersion() external pure returns (string memory) {
        return "1.0";
    }

    /**
     * @dev Returns the UserAccess module interface for the current partner
     * @return IUserAccess interface instance
     */
    function _UserAccess() private view returns (IUserAccess) {
        return IUserAccess(IHub(hubContract).getModule("UserAccess", partner_id));
    }

    /**
     * @dev Returns the User module interface for the current partner
     * @return IUser interface instance
     */
    function _User() private view returns (IUser) {
        return IUser(IHub(hubContract).getModule("User", partner_id));
    }

    /// @notice Access control modifier requiring for check user exist
    modifier onlyUser() {
        _User().exist(msg.sender);
        _;
    }

        
    /**
     * @notice Modifier for token access control
     * @dev Checks tokens existence and user permissions
     * @param token_id ID of the token to access
     * @custom:reverts ObjectNotFound If token doesn't exist
     * @custom:reverts AccessDenied If user lacks access rights
     */    
    modifier token_access( uint256 token_id)   {
        
        _User().exist(msg.sender);

        if(tokens[token_id].expire_date == 0)
            revert ObjectNotFound("UserTokens", token_id);


        bool isAccess = false;

        if(tokens[token_id].owner == msg.sender)
            isAccess = true;

        uint access_level = _UserAccess().getModuleAccessLevel("UserTokens", msg.sender);

        if(access_level >= uint(IUserAccess.AccessLevel.FOURTH)){
            isAccess = true;
        }

        if(!isAccess)
            revert AccessDenied("UserTokens");
        
        _;
    }


    function add(Add memory input ) external onlyUser() {

        if(token_id_index[input.hash_token_id] != 0){
            revert TokenExist();
        }


        if(token_id_16_index[input.hash_token_id_16] != 0){
            revert TokenExist();
        }

        if(input.account_for == address(0)){
            input.account_for = msg.sender;
        }

        if(input.expire_date <= block.timestamp){
            revert TokenExpireDate();
        }
        
        counter++;

        idToken memory token = idToken({
            id: counter,
            encrypted_token_id:input.encrypted_token_id,
            encrypted_token_id_16:input.encrypted_token_id_16,
            hash_token_id: input.hash_token_id,
            hash_token_id_16:input.hash_token_id_16,
            token_type: input.token_type,
            owner: msg.sender,
            account_for: input.account_for,
            expire_date: input.expire_date,
            is_blocked: false
        });

        
        tokens[counter] = token;
        token_id_index[input.hash_token_id] = counter;
        token_id_16_index[input.hash_token_id_16] = counter;
        account_tokens[input.account_for][input.token_type].push(counter);

        if(input.token_type == TokenType.Central){
            primary_central_token[input.account_for] = counter;
        }

        emit New(counter, input.hash_token_id,input.hash_token_id_16, input.token_type);
    }



    function setPrimaryToken(uint256 token_id, address account_for) external token_access(token_id) {

        if(account_for == address(0)){
            account_for = msg.sender;
        }

        primary_central_token[account_for] = token_id;
    }

    function blockToken(uint256 token_id) external token_access(token_id) {
        tokens[token_id].is_blocked = true;
        emit BlockedToken(tokens[token_id].hash_token_id, tokens[token_id].hash_token_id_16);
    }

    function unblockToken(uint256 token_id) external token_access(token_id) {
        tokens[token_id].is_blocked = false;
        emit UnblockedToken(tokens[token_id].hash_token_id, tokens[token_id].hash_token_id_16);
    }
    

    function changeExpireDate(uint256 token_id, uint256 expire_date) external token_access(token_id) {
        if(expire_date <= block.timestamp){
            revert TokenExpireDate();
        }
        
        tokens[token_id].expire_date = expire_date;
        emit UpdateExpireDate(tokens[token_id].hash_token_id, tokens[token_id].hash_token_id_16, expire_date);
    }

    function changeTokenType(uint256 token_id, TokenType token_type) external token_access(token_id) {
        tokens[token_id].token_type = token_type;
        emit UpdateTokenType(tokens[token_id].hash_token_id, tokens[token_id].hash_token_id_16, token_type);
    }    

    function updatePolicy(uint256 token_id, Policy calldata  policy) external token_access(token_id) {
        token_policy[token_id] = policy;
        emit UpdateTokenPolicy(tokens[token_id].hash_token_id, tokens[token_id].hash_token_id_16);
    }    
    
    function getPrimaryToken(address account) external view returns(idToken memory, Policy memory) {
        return _getTariffFromPrimaryToken(account);
    }

    function getTariffFromPrimaryToken(address account, Context calldata ctx) external view returns(uint256) {
        (, Policy memory p) =  _getTariffFromPrimaryToken(account);

        if(p.allowed_evse_ids.length == 0 && p.allowed_location_ids.length == 0){
            return p.tariff;
        }

        bool have_evse_or_location = false;

        for (uint i = 0; i < p.allowed_evse_ids.length; i++) {
            if(p.allowed_evse_ids[i] == ctx.evse_id){
                have_evse_or_location = true;
            }
        }

        for (uint i = 0; i < p.allowed_location_ids.length; i++) {
            if(p.allowed_location_ids[i] == ctx.location_id){
                have_evse_or_location = true;
            }
        }

        if(have_evse_or_location){
            return p.tariff;
        }else{
            return 0;
        }
    }

    function _getTariffFromPrimaryToken(address account) internal view returns(idToken memory, Policy memory){
        // Default
        if(primary_central_token[account] == 0 ){
            idToken memory t;
            Policy memory p;
            t.hash_token_id = keccak256(abi.encode(account));
            t.hash_token_id_16 = keccak256(abi.encode(account));
            return (t,p);
        }else{
            return (tokens[primary_central_token[account]],token_policy[primary_central_token[account]]);
        }
    }

    function getTokens(address account, TokenType token_type) external view returns(idToken[] memory){

        uint256[] memory ids = account_tokens[account][token_type];

        if(ids.length == 0){
            revert ObjectNotFound("UserToken", 0);
        }

        idToken[] memory ret = new idToken[](ids.length);

        for (uint i = 0; i < ids.length; i++) {
            ret[i] = tokens[ids[i]];
        }

        return ret;
    }

    function getTokenByTokenId(bytes32 token_id) external view returns(idToken memory){
        if(token_id_index[token_id] == 0){
            revert ObjectNotFound("UserToken", 0);
        }

        return tokens[token_id_index[token_id]];
    }

    function getTokenByTokenId16(bytes32 token_id) external view returns(idToken memory){
        if(token_id_16_index[token_id] == 0){
            revert ObjectNotFound("UserToken", 0);
        }

        return tokens[token_id_16_index[token_id]];
    }

}
