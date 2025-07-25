// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;
import "../../IBaseErrors.sol";
/**
 * @title IOCPP16
 * @dev Интерфейс ??
 */
interface IOCPP is IBaseErrors{

    struct EVSE {
        bytes32 id;
        uint256 evse_id;
        uint256 partner_id;
        address signer;
        bool online;
    }

    struct SetEVSEOnline {
        bytes32 evse;
        bool status;
    }

    event AddEvse(bytes32 indexed id, uint256 indexed evse_id, uint256 partner_id);
    event UpdateStatusEvse(bytes32 indexed id, uint256 indexed evse_id, uint256 indexed partner_id, bool status);
    error SignaturesNotEnouth();
}