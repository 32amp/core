// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;


interface ICards {
    event AddCardRequest(uint256 indexed user_id, uint256 indexed request_id, bytes32 _token);
    event AddCardResponse(uint256 indexed user_id, uint256 indexed request_id, bool status, string message, string paymentEndpoint);
    event AddCardSuccess(uint256 indexed user_id, uint256 card_id);
    event WriteOffRequest(uint256 indexed user_id, uint256 request_id, uint256 indexed card_id, uint256 amount);
    event WriteOffResponse(uint256 indexed user_id, uint256 request_id, uint256 indexed card_id, bool status, string message, uint256 amount);


    struct Card {
        string session_id;
        string rebill_id;
        string provider;
        string card_id;
        string card_number;
        bool is_primary;
    }

    struct AutopaySettings {
        uint256 amount;
        uint256 monthly_limit;
        uint256 threshold;
        bool is_active;
    }

    function getVersion() external pure returns(string memory);
    function addCardRequest(bytes32 _token) external;
    function addCardResponse(bytes32 _token, uint256 user_id, bool status, string memory message, string memory paymentEndpoint) external;
    function addCard(bytes32 _token, uint256 user_id, Card memory card) external;
    function setAutoPaySettings(bytes32 _token, uint256 amount, uint256 monthly_limit, uint256 threshold) external;
    function disableAutoPay(bytes32 _token) external;
    function removeCard(bytes32 _token, uint _index) external;
    function getCards(uint256 user_id) external view returns(Card[] memory);
    function getAutoPaymentSettings(uint256 user_id) external view returns(AutopaySettings memory);
}