// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "../IBaseErrors.sol";
import "../DataTypes.sol";

interface IOCPPProxy is DataTypes, IBaseErrors {

    enum OperationType { CONNECTED, DISCONNECTED, SET_CONNECTOR_STATUS, BOOT_NOTIFICATION, RESERVATION_RESPONSE }

    struct BootNotificationReq {
        bytes32 chargePointVendor;
        bytes32 chargePointModel;
        bytes32 chargePointSerialNumber;
        bytes32 iccid;
        bytes32 imsi;
        bytes32 meterType;
        bytes32 meterSerialNumber;
        string firmwareVersion;
    }

    struct ConnectorStatusEl {
        uint256 evse_id;
        uint256 timestamp;
        uint256 connector_id;
        ConnectorStatus status;
    }

    struct BootNotificationEl{
        uint256 evse_id;
        uint256 timestamp;
        BootNotificationReq req;
    }  

    struct ReservationResponseEl{
        uint256 evse_id;
        uint256 timestamp;
        uint256 reserve_id;
        bool status;
    }  

    struct StartTransactionResponseEl{
        uint256 evse_id;
        uint256 connector_id;
        uint256 transaction_id;
        uint256 meter_start;
        uint256 timestamp;
    }


    struct BatchOperation {
        OperationType op_type;
        bytes op_data;
    }

    event Connected(uint256 indexed evse_id, uint256 indexed timestamp);
    event Disconnected(uint256 indexed evse_id,  uint256 indexed timestamp);
    event UpdateConnectorStatus(uint256 indexed evse_id,  uint256 indexed timestamp, uint256 indexed connector_id, ConnectorStatus status);
    event BootNotification(uint256 indexed evse_id, uint256 indexed timestamp, BootNotificationReq req);
    event ReservationResponse(uint256 indexed evse_id, uint256 indexed timestamp, uint256 reserve_id, bool status);
    event BatchOperationResult(uint256 indexed operationIndex, bool success, bytes result );
    event OperationExecuted(uint256 indexed operationIndex, OperationType opType, bool success, bytes result );
    event BatchProcessed(address indexed executor, uint256 totalOperations, uint256 successfulOperations);
    event BatchCompleted(uint256 totalOperations, uint256 successfulOperations);

    function executeBatch(BatchOperation[] calldata operations) external;


}