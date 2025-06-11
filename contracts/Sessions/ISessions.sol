// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "../DataTypes.sol";
import "../IBaseErrors.sol";
import "../Tariff/ITariff.sol";

/**
 * @title Sessions Management Interface
 * @notice Defines session structures and events according to OCPI 2.2.1
 */
interface ISessions is DataTypes, IBaseErrors {


    struct Reservation {
        uint256 time_expire;
        address account;
        bool confirmed;
        bool canceled;
        bool executed;
    }

    struct PaidLog {
        uint256 timestamp;
        Price amount;
    }

    event ReservationRequest(
        uint256 indexed id, 
        address indexed account, 
        uint256 indexed time_expire
    );

    event ReservationCancelRequest(
        uint256 indexed id, 
        address indexed iniciator_account
    );

    event ReservationCancelResponse(
        uint256 indexed id, 
        bool status
    );

    event CreateReservationResponse(
        uint256 indexed id, 
        address indexed account,
        uint256 indexed time_expire,
        bool status
    );


    /**
     * @notice Emitted when new session starts
     * @param evse_id ID of EVSE
     * @param connector_id ID of Connecotr
     * @param uid New session ID
     * @param account Creator's wallet address
     */
    event SessionStartRequest(
        uint256 indexed evse_id,
        uint256 indexed connector_id,
        address indexed account,
        uint256 uid
    );

    event SessionStartResponse(
        uint256 session_id, 
        bool status, 
        string message 
    );

    /**
     * @notice Emitted on session update
     * @param session_id Updated session ID
     * @param meter_value Current energy consumption
     */
    event SessionUpdate(
        uint256 indexed session_id,
        uint256 meter_value,
        uint256 percent,
        uint256 power,
        uint256 current,
        uint256 voltage,
        uint256 total_coast
    );

    /**
     * @notice Emitted when session ends
     * @param session_id Completed session ID
     */
    event SessionStopRequest(
        uint256 indexed session_id,
        address initiator
    );

    /**
     * @notice Emitted when session ends
     * @param session_id Completed session ID
     */
    event SessionStopResponse(
        uint256 indexed session_id,
        bool status,
        string message
    );


    event SessionLogInfo(uint256 indexed session_id, SessionLogInfoType log_type);

    // Custom errors
    error SessionAlreadyActive(address auth_id);
    error ReserveAlreadyRunned(address auth_id, uint256 reserve_id);
    error InvalidSessionStatus(uint256 session_id, SessionStatus status);
    error TooManyLogs(uint256 session_id);
    error InvalidTimestamp(uint256 session_id, uint256 timestamp);
    error ConnectorNotAvailable(uint256 connector_id);
    error InvalidFinalLog(uint256 session_id, string reason);
    


    function getVersion() external pure returns(string memory);
    function startSessionRequest( uint256 evse_uid, uint256 connector_id, uint256 reserve_id, address start_for) external;
    function updateSession(uint256 session_id, SessionMeterLog memory session_log) external;
    function stopSessionResponse(uint256 session_id, uint256 meter_stop,uint256 timestamp, bool status, string calldata message) external;
    function getSession(uint256 session_id) external view returns(Session memory);
    function exist(uint256 session_id) external view returns(bool);
    function getSessionByAuth(address auth_id) external view returns(uint256);
}