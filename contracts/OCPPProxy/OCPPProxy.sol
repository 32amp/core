// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./IOCPPProxy.sol";
import "../Hub/IHub.sol";
import "../Location/IEVSE.sol";
import "../Location/IConnector.sol";
import "../User/IUserAccess.sol";
import "../Sessions/ISessions.sol";

contract OCPPProxy is IOCPPProxy, Initializable {
    address private hubContract;
    uint256 private partnerId;

    function initialize(uint256 _partnerId, address _hubContract) public initializer {
        hubContract = _hubContract;
        partnerId = _partnerId;
    }

    function _EVSE() private view returns(IEVSE) {
        return IEVSE(IHub(hubContract).getModule("EVSE", partnerId));
    }

    function _Connector() private view returns(IConnector) {
        return IConnector(IHub(hubContract).getModule("Connector", partnerId));
    }

    function _Sessions() private view returns(ISessions) {
        return ISessions(IHub(hubContract).getModule("Sessions", partnerId));
    }



    modifier accessControl() {
        _checkAccess(msg.sender);
        _;
    }

    modifier selfOnly() {
        require(msg.sender == address(this), "OCPPProxy: Internal only");
        _;
    }


    
    function _executeOperation(BatchOperation calldata op) external selfOnly {
        if (op.op_type == OperationType.CONNECTED) {
            _handleConnected(op.op_data);
        } else if (op.op_type == OperationType.DISCONNECTED) {
            _handleDisconnected(op.op_data);
        } else if (op.op_type == OperationType.SET_CONNECTOR_STATUS) {
            _handleConnectorStatus(op.op_data);
        } else if (op.op_type == OperationType.BOOT_NOTIFICATION) {
            _handleBootNotification(op.op_data);
        } else if (op.op_type == OperationType.RESERVATION_RESPONSE) {
            _handleReservationResponse(op.op_data);            
        } else {
            revert("OCPPProxy: Unknown operation type");
        }
    }

    function executeBatch(BatchOperation[] calldata operations) external accessControl {
        uint256 successCount;
        
        for (uint256 i = 0; i < operations.length; i++) {
            BatchOperation calldata op = operations[i];
            bytes memory result;
            bool success;
            
            try this._executeOperation(op) {
                success = true;
                successCount++;
                result = abi.encode(true);
            } catch Error(string memory reason) {
                result = abi.encode(reason);
            } catch (bytes memory lowLevelData) {
                result = lowLevelData;
            }
            
            emit OperationExecuted(i, op.op_type, success, result);
        }
        
        emit BatchProcessed(msg.sender, operations.length, successCount);
    }

    // Остальные функции остаются без изменений
    function _handleConnected(bytes memory data) private {
        (uint256 evseId, uint256 timestamp) = abi.decode(data, (uint256, uint256));
        _EVSE().setStatus(evseId, EVSEStatus.Available);
        emit Connected(evseId, timestamp);
    }

    function _handleDisconnected(bytes memory data) private {
        (uint256 evseId, uint256 timestamp) = abi.decode(data, (uint256, uint256));
        _EVSE().setStatus(evseId, EVSEStatus.Unavailable);
        emit Disconnected(evseId, timestamp);
    }

    function _handleConnectorStatus(bytes memory data) private {
        ConnectorStatusEl memory status = abi.decode(data, (ConnectorStatusEl));
        _Connector().setStatus(status.connector_id, status.status);
        emit UpdateConnectorStatus(status.evse_id, status.timestamp, status.connector_id, status.status);
    }

    function _handleBootNotification(bytes memory data) private {
        BootNotificationEl memory notification = abi.decode(data, (BootNotificationEl));
        emit BootNotification(notification.evse_id, notification.timestamp, notification.req);
    }

    function _handleReservationResponse(bytes memory data) private {
        ReservationResponseEl memory response = abi.decode(data, (ReservationResponseEl));
        _Sessions().createReservationResponse(response.reserve_id, response.status);
        emit ReservationResponse(response.evse_id, response.timestamp, response.reserve_id, response.status);
    }

    function _checkAccess(address caller) private view {
        IUserAccess userAccess = IUserAccess(
            IHub(hubContract).getModule("UserAccess", partnerId)
        );
        userAccess.checkAccessModule(caller, "OCPPProxy", uint256(IUserAccess.AccessLevel.FOURTH));
    }
}