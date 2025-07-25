// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./IOCPPSwarm.sol";

/**
 * @title OCPPSwarm
 * @dev Контракт для управления пирами в OCPP сети
 */
contract OCPPSwarm is Initializable, OwnableUpgradeable, IOCPPSwarm {
    // PSK ключ for libp2p сети
    bytes32 private _psk;
    
    // Размер депозита for регистрации ноды
    uint256 private _depositAmount;
    uint256 nodeIndex;
    
    // Маппинг for хранения зарегистрированных нод
    mapping(uint256 => OCPPNode) private _nodes;
    mapping (string => bool) private exist_node;
    mapping (address => uint256) private address_to_index;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Инициализация контракта
     * @param psk_ PSK ключ for libp2p сети
     * @param depositAmount_ Размер депозита for регистрации ноды
     */
    function initialize(bytes32 psk_, uint256 depositAmount_) public initializer {
        __Ownable_init(msg.sender);
        _psk = psk_;
        _depositAmount = depositAmount_;
    }

    /**
     * @dev Регистрация новой OCPP ноды
     * @param peerAddress_ Мультиадрес пира в сети
     * @param peerId_ ID пира в сети
     */
    function registerNode(string memory peerAddress_, string calldata peerId_, string calldata publicKey) external payable {
        if (msg.value != _depositAmount) revert IncorrectDepositAmount();
        if (exist_node[peerId_]) revert NodeAlreadyRegistered();
        
        nodeIndex++;

        _nodes[nodeIndex] = OCPPNode({
            id: nodeIndex,
            peerAddress: peerAddress_,
            peerId: peerId_,
            isActive: true,
            deposit: msg.value,
            publicKey: publicKey,
            owner: msg.sender
        });
        
        exist_node[peerId_] = true;
        address_to_index[msg.sender] = nodeIndex;
        
        emit NodeRegistered(msg.sender, peerId_, msg.value);
    }

    /**
     * @dev Получение информации о ноде
     * @param nodeAddress Адрес ноды
     * @return node Структура с информацией о ноде
     */
    function getNodeInfo(address nodeAddress) external view returns (OCPPNode memory node) {
        return _nodes[address_to_index[nodeAddress]];
    }

    /**
     * @dev Изменение размера депозита (только для владельца)
     * @param newAmount Новый размер депозита
     */
    function setDepositAmount(uint256 newAmount) external onlyOwner {
        _depositAmount = newAmount;
        emit DepositAmountChanged(newAmount);
    }

    /**
     * @dev Изменение PSK ключа (только для владельца)
     * @param newPSK Новый PSK ключ
     */
    function setPSK(bytes32 newPSK) external onlyOwner {
        _psk = newPSK;
        emit PSKChanged(newPSK);
    }

    /**
     * @dev Получение текущего размера депозита
     */
    function getDepositAmount() external view returns (uint256) {
        return _depositAmount;
    }

    /**
     * @dev Получение PSK ключа
     */
    function getPSK() external view returns (bytes32) {
        return _psk;
    }

    /**
     * @dev Получение списка нод постранично
     * @param page Номер страницы (начинается с 1)
     * @return Массив структур OCPPNode для запрошенной страницы
     */
    function getActiveNodes(uint256 page) external view returns (OCPPNode[] memory) {
        uint256 nodesPerPage = 10;
        if (page < 1) revert("Invalid page number");
        
        
        uint256 activeCount = 0;
        for (uint256 i = 1; i <= nodeIndex; i++) {
            if (_nodes[i].isActive) activeCount++;
        }
        
        
        uint256 startPos = (page - 1) * nodesPerPage;
        uint256 endPos = startPos + nodesPerPage;
        if (endPos > activeCount) endPos = activeCount;
        
        if (startPos >= activeCount) return new OCPPNode[](0);
        
        
        OCPPNode[] memory result = new OCPPNode[](endPos - startPos);
        uint256 currentPos = 0;
        uint256 resultIndex = 0;
        
        for (uint256 i = 1; i <= nodeIndex; i++) {
            if (_nodes[i].isActive) {
                if (currentPos >= startPos && currentPos < endPos) {
                    result[resultIndex++] = _nodes[i];
                }
                currentPos++;
                if (currentPos >= endPos) break;
            }
        }
        
        return result;
    }

}
