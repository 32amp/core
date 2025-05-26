// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./IOCPP.sol";
import "../../Hub/IHub.sol";
import "../../Location/IEVSE.sol";

/**
 * @title OCPPSwarm
 * @dev Контракт для управления зарядными станциями по протоколу OCPP 1.6
 * здесь хранится только состояние котоорое влияет на всю логику системы, т.е. это состояние коннектора, состояние зарядной транзакции и т.д.,
 * так же здесь содержится регистр разрешенных зарядных станций
 */
contract OCPP is Initializable, OwnableUpgradeable, IOCPP {

    address hubContract;
    mapping(bytes32 => EVSE) evses;


    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Инициализация контракта
     */
    function initialize(address _hubContract) public initializer {
        hubContract = _hubContract;
        __Ownable_init(msg.sender);
    }

    /// @dev Returns EVSE module interface
    function _EVSE(uint256 partner_id) private view returns (IEVSE) {
        return IEVSE(IHub(hubContract).getModule("EVSE", partner_id));
    }

    function addEVSE( 
        uint256 evse_id,
        uint256 partner_id,
        address signer
    ) external {
        if (IHub(hubContract).getModule("EVSE", partner_id) != msg.sender) {
            revert AccessDenied("OCPP");
        }

        bytes32 id = keccak256(abi.encode(evse_id,partner_id));

        if (evses[id].signer != address(0)) {
            revert AlreadyExist("registered");
        }

        evses[id] = EVSE({
            partner_id: partner_id,
            evse_id: evse_id,
            signer: signer,
            id: id,
            online: false
        });

        emit AddEvse(id, evse_id, partner_id);
    }

    function getEvse(bytes32 id) external view returns(EVSE memory){
        return evses[id];
    }

    function changeSigner(bytes32 id, address new_signer) external {
        if (IHub(hubContract).getModule("EVSE", evses[id].partner_id) != msg.sender) {
            revert AccessDenied("OCPP");
        }

        evses[id].signer = new_signer;
    }

    function setOnline(SetEVSEOnline[] calldata statuses, bytes[] calldata signatures) external {

        
        if(signatures.length < 2)
            revert SignaturesNotEnouth();



        for (uint i = 0; i < statuses.length; i++) {
            evses[statuses[i].evse].online = statuses[i].status;
        }
    }

    function verify() internal {
        
    }
}
