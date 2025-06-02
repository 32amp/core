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
    /**
     * @title Session Status Enum
     * @notice Lifecycle states of charging sessions
     */
    enum SessionStatus {
        ACTIVE,     // Ongoing charging
        COMPLETED,  // Successfully ended
        INVALID,    // Rejected/errored
        PENDING     // Awaiting start
    }

    enum SessionLogInfoType {
        ERROR,
        WARNING,
        INFO
    }


    /**
     * @title Charging Session Data
     * @notice Complete session information
     * @param uid Unique session identifier
     * @param evse_uid Connected EVSE ID
     * @param connector_id Physical connector ID
     * @param start_datetime Session start timestamp
     * @param end_datetime Session end timestamp
     * @param status Current session state
     */
    struct Session {
        uint256 uid;
        uint256 evse_uid;
        uint256 connector_id;
        uint256 start_datetime;
        uint256 end_datetime;
        uint256 session_log_counter;
        uint256 tariff_id;
        uint256 tariff_version;
        uint256 reserve_id;
        address account;
        SessionStatus status;
    }

    struct SessionMeterLog {
        uint256 meter_value;
        uint256 percent;
        uint256 power;
        uint256 current;
        uint256 voltage;
        uint256 timestamp; 
    }

    /**
     * @title Charging Data Record (CDR)
     * @notice Final billing record for session
     * @param session_id Reference session ID
     * @param evse_uid Connected EVSE ID
     * @param connector_id Physical connector ID
     * @param start_datetime Session start timestamp
     * @param end_datetime Session end timestamp
     * @param total_energy Total energy delivered (Wh)
     * @param total_cost Calculated cost (milliunits)
     * @param tariff_id Applied tariff ID
     */
    struct CDR {
        uint256 session_id;
        uint256 evse_uid;
        uint256 connector_id;
        uint256 start_datetime;
        uint256 end_datetime;
        uint256 total_energy;
        Price total_cost;
        uint256 tariff_id;
        uint256 tariff_version;
    }

    struct CDRElement {
        ITariff.TariffDimensionType _type;
        Price price;
    }


    struct Reservation {
        uint256 time_expire;
        address account;
        bool confirmed;
        bool canceled;
        bool executed;
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
    function stopSessionResponse(uint256 session_id, SessionMeterLog memory session_log, bool status, string calldata message) external;
    function getSession(uint256 session_id) external view returns(Session memory);
    function getCDR(uint256 session_id) external view returns(CDR memory, CDRElement[] memory);
    function exist(uint256 session_id) external view returns(bool);
    function getSessionByAuth(address auth_id) external view returns(uint256);
}