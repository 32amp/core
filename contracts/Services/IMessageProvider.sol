// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

/**
 * @title Message Provider Interface
 * @notice Defines core structures, events and errors for message delivery system
 * @dev Serves as foundation for MessageProvider contract implementation
 */
interface IMessageProvider {

    /// @notice SMS message metadata and status tracking
    /// @param handshake Associated handshake identifier
    /// @param recipient Target phone number in E.164 format
    /// @param text Plaintext message content
    /// @param delivered Delivery confirmation status
    /// @param request_time Timestamp of delivery request
    /// @param response_time Timestamp of provider response
    /// @param amount_pay Payment amount to provider (excluding service fee)
    /// @param error_code Delivery error code (0 for success)
    struct SMSMessage {
        bytes32 handshake;
        string recipient;
        string text;
        bool delivered;
        uint256 request_time;
        uint256 response_time;
        uint256 amount_pay;
        uint256 error_code;
    }

    /// @notice Email message metadata and status tracking
    /// @param subject Email subject line
    /// @param body Email content body
    struct EmailMessage {
        bytes32 handshake;
        string recipient;
        string subject;
        string body;
        bool delivered;
        uint256 request_time;
        uint256 response_time;
        uint256 amount_pay;
        uint256 error_code;
    }

    /// @notice Handshake agreement parameters
    /// @param date_expire Expiration timestamp of handshake
    /// @param account User address initiating handshake
    /// @param provider Service provider address
    /// @param provider_approved Provider acceptance status
    /// @param revoked Manual revocation status
    struct Handshake {
        uint256 date_expire;
        address account;
        address provider;
        bool provider_approved;
        bool revoked;
    }

    /// @notice Provider operational data
    /// @param info Provider configuration details
    /// @param deposit Security deposit amount
    /// @param rate Performance rating score
    struct ProviderData {
        Provider info;
        uint256 deposit;
        uint256 rate;
    }

    /// @notice Provider service configuration
    /// @param country_code ISO 3166 country code
    /// @param public_key Encryption public key
    /// @param terms Description about terms of service
    /// @param sms_getway SMS gateway settings
    /// @param email_getway Email gateway settings
    struct Provider {
        string country_code;
        string public_key;
        string terms;
        ProviderGetway sms_getway;
        ProviderGetway email_getway;
    }

    /// @notice Gateway-specific configuration
    /// @param enable Gateway activation status
    /// @param sender_name Display name for messages
    /// @param cost_per_message Base price per message
    /// @param time_between_retry Minimum retry interval in seconds
    struct ProviderGetway {
        bool enable;
        string sender_name;
        uint256 cost_per_message;
        uint256 time_between_retry;
    }

    /// @notice Service governance parameters
    /// @param min_provider_deposit Minimum security deposit for providers
    /// @param processing_time Maximum allowed processing duration
    /// @param service_fee Platform fee per transaction
    /// @param min_cost_per_message Minimum allowed price per message
    /// @param punishment_coast Penalty amount for SLA violations
    /// @param service_wallet Platform treasury address
    struct ServiceSettings {
        uint256 min_provider_deposit;
        uint256 processing_time;
        uint256 service_fee;
        uint256 min_cost_per_message;
        uint256 punishment_coast;
        address service_wallet;
    }
    
    // Custom errors
    
    /// @notice Insufficient provider deposit during registration
    /// @param min_provider_deposit Required minimum deposit amount
    error MinimumProviderDeposit(uint256 min_provider_deposit);
    
    /// @notice Expired handshake usage attempt
    /// @param date_expire Handshake expiration timestamp
    error HandshakeDateExpire(uint256 date_expire);
    
    /// @notice Attempt to use revoked handshake
    error HandshakeRevoked();
    
    /// @notice Attempt to use unapproved handshake
    error HandshakeNotAprooved();
    
    /// @notice Insufficient payment for message delivery
    /// @param required Expected payment amount
    /// @param given Actual payment amount
    error InsufficientFunds(uint256 required, uint256 given);
    
    /// @notice Early retry attempt detection
    /// @param time_between_retry Required waiting period
    /// @param current_time Time since last attempt
    error Timeout(uint256 time_between_retry, uint256 current_time);
    
    /// @notice Below-minimum pricing configuration
    /// @param min_cost_per_message Required minimum price
    error MinCoastPerMessage(uint256 min_cost_per_message);
    
    /// @notice Provider deposit depletion
    error ProviderDepositExhausted();
    
    /// @notice Unauthorized access attempt
    /// @param module Restricted module identifier
    error AccessDenied(string module);
    
    /// @notice Invalid handshake reference
    /// @param object Context object type
    /// @param object_id Handshake identifier
    error HandshakeNotFound(string object, bytes32 object_id);
    
    /// @notice Duplicate entity creation attempt
    /// @param object Entity type identifier
    error AlreadyExist(string object);
    
    /// @notice Missing enabled gateways
    error NoGetwayEnabled();
    
    /// @notice Duplicate delivery confirmation
    error AlreadyResponse();

    // Events
    
    /// @notice New provider registration
    /// @param account Provider wallet address
    event AddProvider(address indexed account);
    
    /// @notice Provider deposit balance update
    /// @param provider Provider address
    /// @param amount New deposit amount
    event ProviderDepositUpdated(address indexed provider, uint256 amount);
    
    /// @notice Service parameter change
    /// @param field Modified parameter name
    event ServiceSettingsChanged(string field);
    
    /// @notice Handshake initiation
    /// @param handshake Unique handshake identifier
    /// @param test_message Encryption validation payload
    /// @param account User address
    event RequestUserHandshakeWithProvider(bytes32 indexed handshake, string test_message, address indexed account);
    
    /// @notice Handshake resolution
    /// @param handshake Handshake identifier
    /// @param status Provider acceptance decision
    event ResponseUserHandshakeWithProvider(bytes32 indexed handshake, bool status);
    
    /// @notice Handshake termination
    /// @param handshake Revoked handshake identifier
    event HandshakeRevoke(bytes32 handshake);
    
    /// @notice SMS delivery request
    /// @param message_hash Unique message identifier
    /// @param provider Service provider address
    /// @param from_account Sender address
    event RequestSendSMS(bytes32 indexed message_hash, address indexed provider, address indexed from_account);
    
    /// @notice SMS delivery resolution
    /// @param message_hash Message identifier
    /// @param status Delivery success status
    /// @param error_code Delivery result code
    event ResponseSendSMS(bytes32 indexed message_hash, bool indexed status, uint256 indexed error_code);
    
    /// @notice Email delivery request
    /// @param message_hash Unique message identifier
    /// @param provider Service provider address
    /// @param from_account Sender address
    event RequestSendEmail(bytes32 indexed message_hash, address indexed provider, address indexed from_account);
    
    /// @notice Email delivery resolution
    /// @param message_hash Message identifier
    /// @param status Delivery success status
    /// @param error_code Delivery result code
    event ResponseSendEmail(bytes32 indexed message_hash, bool indexed status, uint256 indexed error_code);

    function getServiceInfo() external view returns(ServiceSettings memory);
    function changeProcessingTime(uint256 processing_time) external;
    function changeServiceWallet(address service_wallet) external;
    function changeServiceFee(uint256 service_fee) external;
    function changeMinCoastPerMessage(uint256 min_cost_per_message) external;
    function changeMinProviderDeposit(uint256 min_provider_deposit) external;
    function withdraw() external;
    function registerProvider(Provider calldata provider) payable external;
    function getProvider(address provider) external view returns(ProviderData memory);
    function requestUserHandshakeWithProvider(string calldata aes_key, string calldata test_message, address provider) external;
    function responseUserHandshakeWithProvider(bytes32 handshake, bool status) external;
    function revokeHandshake(bytes32 handshake)  external;
    function getHandshake(bytes32 handshake) external view returns(Handshake memory);
    function requestSendSMS(bytes32 handshake, string calldata recipient, string calldata text) payable external;
    function responseSendSMS(bytes32 message_hash, bool status, uint256 error_code) external;
    function getSms(bytes32 message_hash) external view returns(SMSMessage memory);
    function requestSendEmail(bytes32 handshake, string calldata recipient, string calldata subject, string calldata body) payable external;
    function responseSendEmail(bytes32 message_hash, bool status, uint256 error_code) external;
    function getEmail(bytes32 message_hash) external view returns(EmailMessage memory);
    function validateHandshake(bytes32 handshake) external view;
}
