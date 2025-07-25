// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

/**
 * @title IOCPPSwarm
 * @dev Интерфейс для контракта управления пирами в OCPP сети
 */
interface IOCPPSwarm {
    struct OCPPNode {
        uint256 id;
        string peerAddress;
        string peerId;
        string publicKey;
        bool isActive;
        uint256 deposit;
        address owner;
    }

    // События
    event NodeRegistered(address indexed nodeAddress, string peerId, uint256 deposit);
    event DepositAmountChanged(uint256 newAmount);
    event PSKChanged(bytes32 newPSK);

    // Ошибки
    error IncorrectDepositAmount();
    error NodeAlreadyRegistered();
    error OnlyOwner();

    function registerNode(string calldata peerAddress_, string calldata peerId_,  string calldata publicKey) external payable;
    function getNodeInfo(address nodeAddress) external view returns (OCPPNode memory node);
    function setDepositAmount(uint256 newAmount) external;
    function setPSK(bytes32 newPSK) external;
    function getDepositAmount() external view returns (uint256);
    function getPSK() external view  returns (bytes32);
    function getActiveNodes(uint256 page) external view returns (OCPPNode[] memory);
} 