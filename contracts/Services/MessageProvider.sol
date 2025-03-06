// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import "./IMessageProvider.sol";
import "hardhat/console.sol";

/**
 * @title Message Provider Contract
 * @notice Handles message delivery system with SMS and Email gateways using provider network
 * @dev Uses handshake mechanism for secure communication between users and providers
 */
contract MessageProvider is IMessageProvider, Initializable, OwnableUpgradeable {
    
    /// @dev Service configuration parameters
    ServiceSettings _settings;
    
    /// @dev Accumulated service fees waiting for withdrawal
    uint256 _pendingServiceWithdrawals;
    
    /// @dev Mapping of provider addresses to their data
    mapping (address => ProviderData) providers;
    
    /// @dev Mapping of handshake hashes to handshake details
    mapping (bytes32 => Handshake) handshakes;
    
    /// @dev Mapping of message hashes to SMS message details
    mapping (bytes32 => SMSMessage) sms_messages;
    
    /// @dev Mapping of message hashes to Email message details
    mapping (bytes32 => EmailMessage) email_messages;
    
    /// @dev Tracking last send time per recipient
    mapping (string => uint256) recipient_send_last_time;
    
    /// @dev Nonces for message hashing prevention
    mapping (address => uint256) nonces;

    /**
     * @notice Initializes contract with service settings
     * @param settings Initial service configuration parameters
     * @dev Checks validity of fee/deposit ratios during initialization
     */
    function initialize(ServiceSettings calldata settings) public initializer {
        if(settings.service_fee > settings.min_cost_per_message)
            revert("service_fee more than min_cost_per_message");

        if(settings.punishment_coast > settings.min_provider_deposit)
            revert("punishment_coast more than min_provider_deposit");

        _settings = settings;
        __Ownable_init(msg.sender);
    }

    /// @notice Modifier for handshake access control
    /// @dev Reverts if caller isn't part of the handshake
    modifier handshakeAccess(bytes32 handshake) {
        _handshakeAccess(handshake);
        _;
    }

    /**
     * @notice Returns current service settings
     * @return ServiceSettings struct with current configuration
     */
    function getServiceInfo() external view returns(ServiceSettings memory) {
        return _settings;
    }

    /// @notice Group of functions for service parameter management
    /// @dev All functions restricted to contract owner
    
    function changeProcessingTime(uint256 processing_time) onlyOwner() external {
        _settings.processing_time = processing_time;
        emit ServiceSettingsChanged("processing_time");
    }

    function changeServiceWallet(address service_wallet) onlyOwner() external {
        _settings.service_wallet = service_wallet;
        emit ServiceSettingsChanged("service_wallet");
    }

    function changeServiceFee(uint256 service_fee) onlyOwner() external {
        _settings.service_fee = service_fee;
        emit ServiceSettingsChanged("service_fee");
    }

    function changeMinCoastPerMessage(uint256 min_cost_per_message) onlyOwner() external {
        _settings.min_cost_per_message = min_cost_per_message;
        emit ServiceSettingsChanged("min_cost_per_message");
    }

    function changeMinProviderDeposit(uint256 min_provider_deposit) onlyOwner() external {
        _settings.min_provider_deposit = min_provider_deposit;
        emit ServiceSettingsChanged("min_provider_deposit");
    }

    /**
     * @notice Withdraw accumulated service fees
     * @dev Only owner can withdraw to configured service wallet
     */
    function withdraw() onlyOwner() external {
        uint256 amount = _pendingServiceWithdrawals;
        _pendingServiceWithdrawals = 0;
        _withdraw(_settings.service_wallet, amount);
    }

    /**
     * @notice Register a new message provider
     * @param provider Provider configuration details
     * @dev Requires minimum deposit and at least one enabled gateway
     */
    function registerProvider(Provider calldata provider) payable external {
        if(msg.value < _settings.min_provider_deposit)
            revert MinimumProviderDeposit(_settings.min_provider_deposit);

        if(providers[msg.sender].deposit != 0)
            revert AlreadyExist("MessageProvider");

        if(provider.sms_getway.enable && provider.sms_getway.cost_per_message < _settings.min_cost_per_message) {
            revert MinCoastPerMessage(_settings.min_cost_per_message);
        }
        
        if(provider.email_getway.enable && provider.email_getway.cost_per_message < _settings.min_cost_per_message) {
            revert MinCoastPerMessage(_settings.min_cost_per_message);
        }

        if(!provider.sms_getway.enable && !provider.email_getway.enable)
            revert NoGetwayEnabled();

        providers[msg.sender] = ProviderData(provider, msg.value, 0);
        emit AddProvider(msg.sender);
    }

    /**
     * @notice Get provider details
     * @param provider Address of the provider to query
     * @return ProviderData struct with provider information
     */
    function getProvider(address provider) external view returns(ProviderData memory) {
        return providers[provider];
    }

    /**
     * @notice Initiate a handshake request with provider
     * @param aes_key AES key encrypted with provider's public key
     * @param provider Target provider address
     * @dev Generates unique handshake hash using nonce
     */
    function requestUserHandshakeWithProvider(string calldata aes_key, address provider) external {
        bytes32 handshake = keccak256(abi.encodePacked(provider, aes_key, msg.sender, nonces[msg.sender]++));

        if(providers[provider].deposit == 0)
            revert ProviderDepositExhausted();

        if(handshakes[handshake].account != address(0))
            revert AlreadyExist("MessageProvider:Handshake");

        handshakes[handshake] = Handshake(
            block.timestamp + 365 days,
            msg.sender,
            provider,
            aes_key,
            false,
            false
        );

        emit RequestUserHandshakeWithProvider(handshake, aes_key, msg.sender);
    }

    /**
     * @notice Provider response to handshake request
     * @param handshake Handshake identifier
     * @param status Approval status from provider
     */
    function responseUserHandshakeWithProvider(bytes32 handshake, bool status) external {
        _checkHandshakeExist(handshake);
        if(handshakes[handshake].provider != msg.sender)
            revert AccessDenied("MessageProvider");

        if(status) {
            handshakes[handshake].provider_approved = true;
        } else {
            handshakes[handshake].revoked = true;
        }
        emit ResponseUserHandshakeWithProvider(handshake, status);
    }

    /**
     * @notice Revoke an existing handshake
     * @param handshake Handshake identifier to revoke
     */
    function revokeHandshake(bytes32 handshake) handshakeAccess(handshake) external {
        handshakes[handshake].revoked = true;
        emit HandshakeRevoke(handshake);
    }

    /**
     * @notice Get handshake details
     * @param handshake Handshake identifier
     * @return Handshake struct with current status
     */
    function getHandshake(bytes32 handshake) handshakeAccess(handshake) external view returns(Handshake memory) {
        return handshakes[handshake];
    }

    /**
     * @notice Request SMS message delivery
     * @param handshake Active handshake identifier
     * @param recipient Target phone number
     * @param text Message content
     * @dev Validates handshake and payment requirements
     */
    function requestSendSMS(bytes32 handshake, string calldata recipient, string calldata text) payable external {
        validateHandshake(handshake);

        bytes32 message_hash = keccak256(abi.encodePacked(handshake,recipient, text, nonces[msg.sender]++));
        ProviderData memory _provider = providers[handshakes[handshake].provider];

        if(_provider.deposit == 0)
            revert ProviderDepositExhausted();
        
        if(handshakes[handshake].account != msg.sender)
            revert AccessDenied("MessageProvider");

        uint256 cost_per_message = _provider.info.sms_getway.cost_per_message;

        if(msg.value < cost_per_message)
            revert InsufficientFunds(cost_per_message, msg.value);


        uint256 isSendBefore = recipient_send_last_time[recipient];

        if (isSendBefore > 0) {
            if (isSendBefore > block.timestamp) revert("try_again_later");

            if (block.timestamp - isSendBefore < _provider.info.sms_getway.time_between_retry) 
            revert Timeout(_provider.info.sms_getway.time_between_retry,block.timestamp - isSendBefore);
        }


        uint256 amount_pay = msg.value-_settings.service_fee;

        sms_messages[message_hash] = SMSMessage(
            handshake,
            recipient,
            text,
            false,
            block.timestamp,
            0,
            amount_pay,
            0
        );

        _pendingServiceWithdrawals += _settings.service_fee;

        recipient_send_last_time[recipient] = block.timestamp;

        emit RequestSendSMS(message_hash, handshakes[handshake].provider, msg.sender);
    }

    /**
     * @notice Provider response for SMS delivery
     * @param message_hash Message identifier
     * @param status Delivery status
     * @param error_code Error code if delivery failed
     * @dev Handles payment settlement and penalties
     */    
    function responseSendSMS(bytes32 message_hash, bool status, uint256 error_code) external {

        SMSMessage memory _message = sms_messages[message_hash];
        address provider = handshakes[_message.handshake].provider;
        address account = handshakes[_message.handshake].account;

        if(sms_messages[message_hash].delivered)
            revert AlreadyResponse();

        if(provider != msg.sender)
            revert AccessDenied("MessageProvider");
            
        sms_messages[message_hash].response_time = block.timestamp;
        
        if(status){
            sms_messages[message_hash].delivered = true;
        }else{
            sms_messages[message_hash].error_code = error_code;
        }

        // if processing time is more then acceptable, should to refund money to sender
        if(_settings.processing_time < (sms_messages[message_hash].response_time - sms_messages[message_hash].request_time) ){
            
            uint256 refundAmount;

            if(providers[provider].deposit-_settings.punishment_coast > 0){
                providers[provider].deposit -= _settings.punishment_coast;
                refundAmount = _message.amount_pay+_settings.punishment_coast;
            }else {
                refundAmount = _message.amount_pay+(_settings.punishment_coast-providers[provider].deposit);
                providers[provider].deposit = 0;
            }

            providers[provider].rate--;

            _withdraw(account, refundAmount);

            emit ProviderDepositUpdated(provider, providers[provider].deposit);

        }else {
            
            providers[provider].rate++;
            
            _withdraw(provider, _message.amount_pay);

        }

        emit ResponseSendSMS(message_hash,status,error_code);
    }

    /**
     * @notice Get SMS message details
     * @param message_hash Message identifier
     * @return SMSMessage struct with message data
     */    
    function getSms(bytes32 message_hash) external view returns(SMSMessage memory){
        _handshakeAccess(sms_messages[message_hash].handshake);

        return sms_messages[message_hash];
    }

    /**
     * @notice Request Email message delivery
     * @param handshake Active handshake identifier
     * @param recipient Target email address
     * @param subject Email subject
     * @param body Email content
     * @dev Validates handshake and payment requirements
     */
    function requestSendEmail(bytes32 handshake, string calldata recipient, string calldata subject, string calldata body) payable external {
        validateHandshake(handshake);

        bytes32 message_hash = keccak256(abi.encodePacked(handshake,recipient, subject, body, nonces[msg.sender]++));
        ProviderData memory _provider = providers[handshakes[handshake].provider];

        if(_provider.deposit == 0)
            revert ProviderDepositExhausted();
        
        if(handshakes[handshake].account != msg.sender)
            revert AccessDenied("MessageProvider");

        uint256 cost_per_message = _provider.info.email_getway.cost_per_message;

        if(msg.value < cost_per_message)
            revert InsufficientFunds(cost_per_message, msg.value);


        uint256 isSendBefore = recipient_send_last_time[recipient];

        if (isSendBefore > 0) {
            if (isSendBefore > block.timestamp) revert("try_again_later");

            if (block.timestamp - isSendBefore < _provider.info.email_getway.time_between_retry) 
            revert Timeout(_provider.info.email_getway.time_between_retry,block.timestamp - isSendBefore);
        }

        uint256 amount_pay = msg.value-_settings.service_fee;


        email_messages[message_hash] = EmailMessage(
            handshake,
            recipient,
            subject,
            body,
            false,
            block.timestamp,
            0,
            amount_pay,
            0
        );

        _pendingServiceWithdrawals += _settings.service_fee;

        recipient_send_last_time[recipient] = block.timestamp;

        emit RequestSendEmail(message_hash, handshakes[handshake].provider, msg.sender);
    }

    /**
     * @notice Provider response for Email delivery
     * @param message_hash Message identifier
     * @param status Delivery status
     * @param error_code Error code if delivery failed
     * @dev Handles payment settlement and penalties
     */    
    function responseSendEmail(bytes32 message_hash, bool status, uint256 error_code) external {
        EmailMessage memory _message = email_messages[message_hash];
        address provider = handshakes[_message.handshake].provider;
        address account = handshakes[_message.handshake].account;

        if(email_messages[message_hash].delivered)
            revert AlreadyResponse();

        if(provider != msg.sender)
            revert AccessDenied("MessageProvider");
            
        email_messages[message_hash].response_time = block.timestamp;
        
        if(status){
            email_messages[message_hash].delivered = true;
        }else{
            email_messages[message_hash].error_code = error_code;
        }

        // if processing time is more then acceptable, should to refund money to sender
        if(_settings.processing_time < (email_messages[message_hash].response_time - email_messages[message_hash].request_time) ){
            
            uint256 refundAmount;

            if(providers[provider].deposit-_settings.punishment_coast > 0){
                providers[provider].deposit -= _settings.punishment_coast;
                refundAmount = _message.amount_pay+_settings.punishment_coast;
            }else {
                refundAmount = email_messages[message_hash].amount_pay + Math.min(_settings.punishment_coast, providers[provider].deposit);
                providers[provider].deposit = 0;
            }

            providers[provider].rate--;

            _withdraw(account, refundAmount);

            emit ProviderDepositUpdated(provider, providers[provider].deposit);

        }else {
            
            providers[provider].rate++;

            _withdraw(provider, _message.amount_pay);
        }



        emit ResponseSendEmail(message_hash,status,error_code);
    }

    /**
     * @notice Get Email message details
     * @param message_hash Message identifier
     * @return EmailMessage struct with message data
     */    
    function getEmail(bytes32 message_hash) external view returns(EmailMessage memory){
        _handshakeAccess(email_messages[message_hash].handshake);

        return email_messages[message_hash];
    }

    /**
     * @notice Validate handshake status
     * @param handshake Handshake identifier to validate
     * @dev Checks existence, approval, revocation and expiration
     */    
    function validateHandshake(bytes32 handshake) public view {
        _checkHandshakeExist(handshake);
        _checkHandshakeAprove(handshake);
        _checkHandshakeRevoke(handshake);
        _checkHandshakeExpire(handshake);
    }

    // Internal validation functions
    function _checkHandshakeAprove(bytes32 handshake) internal view {
        if(!handshakes[handshake].provider_approved)
            revert HandshakeNotAprooved();
    }

    function _checkHandshakeRevoke(bytes32 handshake) internal view {
        if(handshakes[handshake].revoked)
            revert HandshakeRevoked();
    }

    function _checkHandshakeExpire(bytes32 handshake) internal view {
        if(block.timestamp > handshakes[handshake].date_expire)
            revert HandshakeDateExpire(handshakes[handshake].date_expire);
    }

    function _checkHandshakeExist(bytes32 handshake) internal view {
        if(handshakes[handshake].date_expire == 0)
            revert HandshakeNotFound("MessageProvider:Handshake",handshake);
    }

    function _handshakeAccess(bytes32 handshake) internal view {
        Handshake memory _handshake = handshakes[handshake];


        console.logBytes32(handshake);
        console.log(msg.sender);

        bool access = false;

        if(_handshake.provider == msg.sender)
            access = true;

        if(_handshake.account == msg.sender)
            access = true;

        if(!access)
            revert AccessDenied("MessageProvider");
    }

    // @dev Internal utility for ETH transfers
    function _withdraw(address account, uint256 amount) internal {
        (bool success, ) = account.call{value: amount}("");
        
        require(
            success,
            "Address: unable to send value, recipient may have reverted"
        );
    }


}
