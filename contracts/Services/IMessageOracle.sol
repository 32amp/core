// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

interface IMessageOracle {

    struct message {
        bytes32 text;
        bool delivered;
        uint256 time;
    }

    event Send(bytes32 indexed recipient);
    event ConfirmSend(bytes32 indexed recipient);

    function getBalance(address account) external view returns(uint256);
    function getSendTimeout() external view returns(uint256);
    function getPriceForMessage() external view returns(uint256);
    function getBodyTemplate() external view returns(string memory);
    function isWhitelistEnable() external view returns(bool);
    function getMessageFor(bytes32 recipient) external view returns(message memory);
    function addOracle(address oracle) external;
    function removeOracle(address oracle) external;
    function addToWhitelist(address oracle) external;
    function removeFromWhitelist(address oracle) external;
    function activateWhitelist(bool state) external;
    function changePriceForMessage(uint256 value) external;
    function refill(address account) payable external;
    function sendMessage(bytes32 recipient, bytes32 message) external;
    function confirmSend(bytes32 recipient) external;
}