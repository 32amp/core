// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;
import "../IBaseErrors.sol";

/**
 * @title Cards Management Interface
 * @notice Defines data structures and events for card and autopay operations
 * @dev Provides the foundation for managing user payment cards and autopay settings
 */
interface ICards is IBaseErrors {

    /**
     * @notice Emitted when a user initiates a card addition request
     * @param account Address of the user requesting to add a card
     * @param request_id Unique identifier for the request
     */
    event AddCardRequest(
        address indexed account,
        uint256 indexed request_id
    );

    /**
     * @notice Emitted when an admin responds to a card addition request
     * @param account Address of the user who made the request
     * @param request_id Unique identifier for the request
     * @param status Response status (true for success, false for failure)
     * @param message Response message or error details
     * @param payment_endpoint URL for payment processing (if applicable)
     */
    event AddCardResponse(
        address indexed account,
        uint256 indexed request_id,
        bool status,
        string message,
        string payment_endpoint
    );

    /**
     * @notice Emitted when a card is successfully added to a user's account
     * @param account Address of the user
     * @param card_id Index of the newly added card
     */
    event AddCardSuccess(
        address indexed account,
        uint256 indexed request_id,
        bytes32 card_id
    );

    /**
     * @notice Emitted when a user initiates a write-off request
     * @param account Address of the user
     * @param request_id Unique identifier for the request
     * @param card_id Id of the card used for the write-off
     * @param amount Amount to be written off
     */
    event WriteOffRequest(
        address indexed account,
        uint256 request_id,
        bytes32 card_id,
        string amount
    );

    /**
     * @notice Emitted when an admin responds to a write-off request
     * @param account Address of the user
     * @param request_id Unique identifier for the request
     * @param card_id Index of the card used for the write-off
     * @param error_code Response code from bank
     * @param status Response status (true for success, false for failure)
     * @param message Response message or error details
     * @param amount Amount written off
     */
    event WriteOffResponse(
        address indexed account,
        uint256 request_id,
        bytes32 card_id,
        uint256 indexed error_code,
        bool status,
        string message,
        string amount
    );

    /**
     * @title Card Data Structure
     * @notice Contains details of a user's payment card
     * @param session_id Session identifier for the card
     * @param rebill_id Rebill identifier for recurring payments
     * @param provider Payment provider name
     * @param card_id Unique identifier for the card
     * @param card_number Masked or partial card number
     * @param is_primary Flag indicating if the card is the primary payment method
     */
    struct CardInfo {
        string rebill_id;
        string provider;
        string card_type;
        string expire_year;
        string expire_month;
        string first6;
        string last4;
    }

    struct Card {
        bytes32 id;
        bool is_primary;
        CardInfo card;
    }

    /**
     * @title Autopay Settings Structure
     * @notice Contains configuration for automatic payments
     * @param amount Amount to be charged during autopay
     * @param monthly_limit Maximum monthly spending limit
     * @param threshold Balance threshold to trigger autopay
     * @param is_active Flag indicating if autopay is enabled
     */
    struct AutopaySettings {
        uint256 amount;
        uint256 monthly_limit;
        uint256 threshold;
        bool is_active;
    }

    function getVersion() external pure returns(string memory);
    function addCardRequest() external;
    function addCardResponse(address account, uint256 request_id, bool status, string calldata message, string calldata paymentEndpoint) external;
    function addCard(address account, uint256 request_id, CardInfo calldata card) external;
    function setAutoPaySettings(uint256 amount, uint256 monthly_limit, uint256 threshold) external;
    function disableAutoPay() external;
    function removeCard(bytes32 card_id) external;
    function getCards(address account) external view returns(Card[] memory);
    function getPrimaryCard(address account) external view returns(Card memory);
    function getAutoPaymentSettings(address account) external view returns(AutopaySettings memory);
    function writeOffRequest(string calldata amount) external;
    function writeOffResponse(address account, uint256 request_id, bytes32 card_id, uint256 error_code, bool status, string calldata message, string calldata amount )  external;
}