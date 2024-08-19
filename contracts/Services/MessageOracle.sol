// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./IMessageOracle.sol";
import "hardhat/console.sol";


contract MessageOracle is IMessageOracle, Initializable, OwnableUpgradeable {
    uint256 counter;
    uint256 sendTimeout;
    string version;
    uint256 priceForMessage;
    string bodyTemplate;
    bool whitelistEnable;

    mapping(bytes32 => message) messages;
    mapping(address => uint256) balances;
    mapping(address => bool) oracles;
    mapping(address => bool) senderWhitelist;

    // body template should have tag [message]

    function initialize(uint256 _sendTimeout, uint256 _priceForMessage, bool _whitelistEnable, string memory _bodyTemplate) public initializer {
        version = "1.0";
        sendTimeout = _sendTimeout; //second
        priceForMessage = _priceForMessage;
        whitelistEnable = _whitelistEnable;
        bodyTemplate = _bodyTemplate;
        __Ownable_init(msg.sender);
    }

    function getBalance(address account) external view returns(uint256){
        return balances[account];
    }

    function getSendTimeout() external view returns(uint256){
        return sendTimeout;
    }

    function getPriceForMessage() external view returns(uint256){
        return priceForMessage;
    }

    function getBodyTemplate() external view returns(string memory){
        return bodyTemplate;
    }

    function isWhitelistEnable() external view returns(bool){
        return whitelistEnable;
    }


    function getMessageFor(bytes32 recipient) external view returns(message memory) {
        if (oracles[msg.sender] == false) revert("access_denied");

        return messages[recipient];
    }

    function addOracle(address oracle) external onlyOwner {
        oracles[oracle] = true;
    }

    function removeOracle(address oracle) external onlyOwner {
        oracles[oracle] = false;
    }

    function addToWhitelist(address oracle) external onlyOwner {
        senderWhitelist[oracle] = true;
    }

    function removeFromWhitelist(address oracle) external onlyOwner {
        senderWhitelist[oracle] = false;
    }

    function activateWhitelist(bool state) external onlyOwner {
        whitelistEnable = state;
    }

    function changePriceForMessage(uint256 value) external onlyOwner {
        priceForMessage = value;
    }

    function refill(address account) payable external {
        balances[account] += msg.value;
    }

    // the client calls
    function send(bytes32 recipient, string memory message) external {
        uint256 isSendBefore = messages[recipient].time;

        if (isSendBefore > 0) {
            if (block.timestamp - isSendBefore < sendTimeout) revert("timeout");
        }

        if( balances[msg.sender] < priceForMessage )
            revert("sms_insufficient_funds");

        _checkWhitelist(msg.sender);

        messages[recipient].text = message;
        messages[recipient].time = block.timestamp;
        
        balances[msg.sender] -= priceForMessage;

        emit Send(recipient);
    }

    function confirmSend(bytes32 recipient) external {
        if (oracles[msg.sender] == false) revert("access_denied");

        if(messages[recipient].delivered)
            revert("confirmed");

        messages[recipient].delivered = true;

        emit ConfirmSend(recipient);
    }


    function _checkWhitelist(address account) internal view {
        if(whitelistEnable){
            if(senderWhitelist[account] == false)
                revert("whitelist_denied");
        }
    }

}