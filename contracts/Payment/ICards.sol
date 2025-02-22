// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;


interface ICards {
    event AddCardRequest(address indexed user_address, uint256 indexed request_id);
    event AddCardResponse(address indexed user_address, uint256 indexed request_id, bool status, string message, string paymentEndpoint);
    event AddCardSuccess(address indexed user_address, uint256 card_id);
    event WriteOffRequest(address indexed user_address, uint256 request_id, uint256 indexed card_id, string amount);
    event WriteOffResponse(address indexed user_address, uint256 request_id, uint256 indexed card_id, bool status, string message, string amount);


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
    function addCardRequest() external;
    function addCardResponse(address user_address, uint256 request_id, bool status, string memory message, string memory paymentEndpoint) external;
    function addCard(address user_address, Card memory card) external;
    function setAutoPaySettings(uint256 amount, uint256 monthly_limit, uint256 threshold) external;
    function disableAutoPay() external;
    function removeCard(uint _index) external;
    function getCards(address user_address) external view returns(Card[] memory);
    function getAutoPaymentSettings(address user_address) external view returns(AutopaySettings memory);
    function writeOffRequest(string memory amount) external;
    function writeOffResponse(address user_address, uint256 request_id, uint256 card_id, bool status, string memory message, string memory amount )  external;
}