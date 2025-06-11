// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../Hub/IHub.sol";
import "./ISessions.sol";
import "./ICDR.sol";
import "../User/IUserAccess.sol";
import "../Tariff/ITariff.sol";
import "../Location/IEVSE.sol";
import "../Location/IConnector.sol";
import "../Payment/IBalance.sol";
import "hardhat/console.sol";

/**
 * @title Sessions Management Contract
 * @notice Handles charging session lifecycle according to OCPI 2.2.1
 * @dev Manages session creation, updates, and termination with tariff calculations
 */
contract Sessions is ISessions, Initializable {
    // State variables
    address hubContract;
    address ocpp;
    uint256 partner_id;
    uint256 sessionCounter;
    uint256 reservationsCounter;
    uint256 min_price_for_start_session;
    uint256 reservation_time; // in minutes
    uint256 writeoff_treshold;
    
    // Storage mappings
    mapping(uint256 => Session) sessions;
    mapping(uint256 => Reservation) reservations;
    mapping(address => uint256) authByReservation;
    mapping(uint256 => mapping(uint256 => SessionMeterLog)) session_logs;
    mapping(uint256 => mapping(uint256 => PaidLog)) paid_logs;

    mapping(uint256 => uint256) last_updated;
    mapping(address => uint256) sessionByAuth; // auth_id -> session_id
    mapping(uint256 => address) authBySession; // session_id -> auth_id

    // Константы
    uint256 constant MAX_LOGS_PER_SESSION = 1000; // Максимальное количество логов в сессии

    


    /**
     * @notice Initializes contract with Hub connection
     * @param _partner_id Partner ID from Hub registry
     * @param _hubContract Address of Hub contract
     */
    function initialize(uint256 _partner_id, address _hubContract, address _ocpp, uint256 _writeoff_treshold) public initializer {
        hubContract = _hubContract;
        partner_id = _partner_id;
        min_price_for_start_session = 10 ether;
        reservation_time = 15; 
        ocpp = _ocpp;
        writeoff_treshold = _writeoff_treshold;
    }

    /// @notice Returns current contract version
    function getVersion() external pure returns(string memory) {
        return "1.0";
    }

    // Module accessors
    function _UserAccess() private view returns(IUserAccess) {
        return IUserAccess(IHub(hubContract).getModule("UserAccess", partner_id));
    }

    function _Balance() private view returns(IBalance) {
        return IBalance(IHub(hubContract).getModule("Balance", partner_id));
    }

    function _EVSE() private view returns(IEVSE) {
        return IEVSE(IHub(hubContract).getModule("EVSE", partner_id));
    }

    function _Connector() private view returns(IConnector) {
        return IConnector(IHub(hubContract).getModule("Connector", partner_id));
    }

    function _Tariff() private view returns(ITariff) {
        return ITariff(IHub(hubContract).getModule("Tariff", partner_id));
    }

    function _CDR() private view returns(ICDR) {
        return ICDR(IHub(hubContract).getModule("CDR", partner_id));
    }


    /// @notice Access control modifier requiring THIRD level privileges
    modifier user_access(uint256 session_id) {
        _UserAccess().checkAccess(msg.sender, "Sessions", bytes32(session_id), uint(IUserAccess.AccessLevel.THIRD));
        _;
    }

    modifier ocpp_proxy_access() {
        if (ocpp != msg.sender){
            revert AccessDenied("ocpp_proxy_access");
        }
        _;
    }


    function changeOcpp(address new_ocpp) external {
         _UserAccess().checkAccessModule(msg.sender, "Sessions", uint(IUserAccess.AccessLevel.GOD));
        ocpp = new_ocpp;
    }

    function createReservationRequest( uint256 evse_uid, uint256 connector_id, address start_for) external {

        if (start_for == address(0)){
            start_for = msg.sender;
            uint access_level = _UserAccess().getModuleAccessLevel("Sessions", msg.sender);
            if(access_level < uint(IUserAccess.AccessLevel.THIRD)) {
                revert AccessDenied("Sessions");
            }
        }else {
            uint access_level = _UserAccess().getModuleAccessLevel("Sessions", msg.sender);
            if(access_level < uint(IUserAccess.AccessLevel.FOURTH)) {
                revert AccessDenied("Sessions");
            }
        }

        if(authByReservation[start_for] != 0){
            revert ReserveAlreadyRunned(start_for, authByReservation[start_for]);
        }


        if(!_EVSE().exist(evse_uid)) {
            revert ObjectNotFound("EVSE", evse_uid);
        }


        IConnector.output memory connector = _Connector().get(connector_id);

        if(connector.id == 0) {
            revert ObjectNotFound("Connector", connector_id);
        }

        
        if(connector.status != ConnectorStatus.Available ) {
            revert ConnectorNotAvailable(connector_id);
        }

        reservationsCounter++;

        uint256 expire_time;
        unchecked {
            expire_time = block.timestamp + (reservation_time * 1 minutes);
        }

        Reservation memory r = Reservation({
            time_expire: expire_time,
            account: start_for,
            confirmed: false,
            canceled: false,
            executed: false
        });

        reservations[reservationsCounter] = r;

        emit ReservationRequest(reservationsCounter, start_for, r.time_expire);
    }

    
    function createReservationResponse(uint256 reserve_id, bool status) external ocpp_proxy_access {
        if(status){
            reservations[reserve_id].confirmed = true;
            authByReservation[reservations[reserve_id].account] = reserve_id;
        }else{
            reservations[reserve_id].canceled = true;
        }

        emit CreateReservationResponse(reserve_id, reservations[reserve_id].account, reservations[reserve_id].time_expire, status);

    }

    function cancelReservationRequest(uint256 reserve_id, address cancel_for) external {
        if (cancel_for == address(0)){
            cancel_for = msg.sender;
            uint access_level = _UserAccess().getModuleAccessLevel("Sessions", msg.sender);
            if(access_level < uint(IUserAccess.AccessLevel.THIRD)) {
                revert AccessDenied("Sessions");
            }
        }else {
            uint access_level = _UserAccess().getModuleAccessLevel("Sessions", msg.sender);
            if(access_level < uint(IUserAccess.AccessLevel.FOURTH)) {
                revert AccessDenied("Sessions");
            }
        }

        if (authByReservation[cancel_for] == 0){
            revert ObjectNotFound("Reservation", reserve_id);
        }

        emit ReservationCancelRequest(reserve_id, msg.sender);
    }


    function cancelReservationResponse(uint256 reserve_id, bool status) external ocpp_proxy_access {
        if(status){
            delete authByReservation[reservations[reserve_id].account];
        }

        emit ReservationCancelResponse(reserve_id, status);
    }



    /**
     * @notice Starts a new charging session
     * @param evse_uid ID of EVSE
     * @param connector_id ID of Connector
     * @custom:reverts "AccessDenied" if access level < THIRD
     * @custom:reverts "ObjectNotFound:EVSE" if invalid EVSE reference
     * @custom:reverts "ObjectNotFound:Connector" if invalid connector
     * @custom:reverts "SessionAlreadyActive" if auth_id already in use
     * @custom:reverts "ConnectorNotAvailable" if connector is busy
     * @custom:emits SessionStart on success
     */
    function startSessionRequest( uint256 evse_uid, uint256 connector_id, uint256 reserve_id, address start_for ) external {

        if (start_for == address(0)){
            start_for = msg.sender;
            uint access_level = _UserAccess().getModuleAccessLevel("Sessions", msg.sender);
            if(access_level < uint(IUserAccess.AccessLevel.THIRD)) {
                revert AccessDenied("Sessions");
            }
        }else {
            uint access_level = _UserAccess().getModuleAccessLevel("Sessions", msg.sender);
            if(access_level < uint(IUserAccess.AccessLevel.FOURTH)) {
                revert AccessDenied("Sessions");
            }
        }

        if(reserve_id != 0) {
            if( !reservations[reserve_id].confirmed && reservations[reserve_id].account != start_for){
                revert AccessDenied("Sessions");
            }
        }

        if(!_EVSE().exist(evse_uid)) {
            revert ObjectNotFound("EVSE", evse_uid);
        }

        IConnector.output memory connector = _Connector().get(connector_id);
        if(connector.id == 0) {
            revert ObjectNotFound("Connector", connector_id);
        }

        // Проверяем доступность коннектора
        if(connector.status != ConnectorStatus.Available && connector.status != ConnectorStatus.Reserved) {
            revert ConnectorNotAvailable(connector_id);
        }

        // Проверяем корректность тарифа
        require(connector.tariff != 0, "Invalid tariff");

        // Проверяем, нет ли уже сессии у пользователя
        if(sessionByAuth[msg.sender] != 0) {
                revert SessionAlreadyActive(msg.sender);
        }

        // Получаем текущую версию тарифа на момент старта сессии
        uint256 current_tariff_version = _Tariff().getCurrentVersion(connector.tariff);
        require(current_tariff_version > 0, "Invalid tariff version");

        int256 account_balance = _Balance().balanceOf(start_for);

        if(account_balance < int256(min_price_for_start_session)){
            revert InsufficientBalance(uint256(account_balance), min_price_for_start_session);
        }

        sessionCounter++;

        Session memory s = Session({
            uid: sessionCounter,
            evse_uid: evse_uid,
            connector_id: connector_id,
            create_datetime: block.timestamp,
            start_datetime:0,
            stop_datetime: 0,
            end_datetime:0,
            session_log_counter: 0,
            paid_log_counter:0,
            total_paid: Price({incl_vat:0,excl_vat:0}),
            tariff_id: connector.tariff,
            account: start_for,
            reserve_id: reserve_id,
            tariff_version: current_tariff_version, // Сохраняем текущую версию тарифа
            status: SessionStatus.PENDING,
            meter_start: 0,
            meter_stop:0
        });

        sessions[sessionCounter] = s;

        sessionByAuth[msg.sender] = sessionCounter;
        authBySession[sessionCounter] = msg.sender;
        last_updated[sessionCounter] = block.timestamp;

        _UserAccess().setAccessLevelToModuleObject(bytes32(sessionCounter), msg.sender, "Sessions", IUserAccess.AccessLevel.THIRD);

        emit SessionStartRequest(evse_uid, connector_id,  msg.sender, sessionCounter);
    }

    
    // Централизованная очистка sessionByAuth и authBySession
    function _cleanupSessionAuth(uint256 session_id) private {
        address auth_id = authBySession[session_id];
        if (auth_id != address(0)) {
            delete sessionByAuth[auth_id];
            delete authBySession[session_id];
        }
    }

    // Централизованное изменение статуса сессии
    function _setSessionStatus(uint256 session_id, SessionStatus new_status) private {
        sessions[session_id].status = new_status;
        if (new_status != SessionStatus.ACTIVE && new_status != SessionStatus.PENDING) {
            _cleanupSessionAuth(session_id);
        }
    }

    function startSessionResponse(uint256 session_id, uint256 timestamp, uint256 meter_start, bool status, string calldata message ) external ocpp_proxy_access {
        if(status){
            _setSessionStatus(session_id, SessionStatus.ACTIVE);
            _CDR().createCDR(session_id, sessions[session_id], timestamp, meter_start);
            sessions[session_id].meter_start = meter_start;
            sessions[session_id].start_datetime = timestamp;

            SessionMeterLog memory log;

            log.meter_value = meter_start;
            log.timestamp = timestamp;

            session_logs[session_id][sessions[session_id].session_log_counter] = log;
            sessions[session_id].session_log_counter++;

            reservations[sessions[session_id].reserve_id].executed = true;
            delete authByReservation[reservations[sessions[session_id].reserve_id].account];
        }else{
            _setSessionStatus(session_id, SessionStatus.INVALID);
        }
        emit SessionStartResponse(session_id, status, message);
    }

    /**
     * only ocpp proxy
     * @notice Updates an active charging session
     * @param session_id Session ID to update
     * @param session_log SessionMeterLog struct
     * @custom:reverts "ObjectNotFound" if session doesn't exist
     * @custom:reverts "TooManyLogs" if session has too many logs
     * @custom:reverts "InvalidTimestamp" if timestamp is not monotonic
     * @custom:reverts "InvalidSessionStatus" if session not ACTIVE
     */
    function updateSession(uint256 session_id, SessionMeterLog memory session_log) external ocpp_proxy_access {
        if(sessions[session_id].uid == 0) {
            revert ObjectNotFound("Session", session_id);
        }
        
        if(sessions[session_id].status != SessionStatus.ACTIVE) {
            revert InvalidSessionStatus(session_id, sessions[session_id].status);
        }
        
        // Проверяем корректность значений в логе
        require(session_log.meter_value >= 0, "Invalid meter value");
        require(session_log.timestamp > 0, "Invalid timestamp");

        SessionMeterLog memory prev_log;
        uint256 total_duration;

        // Проверяем монотонность timestamp
        if (sessions[session_id].session_log_counter > 0) {
            require(session_log.timestamp > prev_log.timestamp, "Invalid timestamp sequence");

            prev_log = session_logs[session_id][sessions[session_id].session_log_counter - 1];
            total_duration = session_log.timestamp-prev_log.timestamp;
        }
        
   /*      // Проверяем количество логов
        if(sessions[session_id].session_log_counter >= MAX_LOGS_PER_SESSION) {
            revert TooManyLogs(session_id);
        } */

        session_logs[session_id][sessions[session_id].session_log_counter] = session_log;
        sessions[session_id].session_log_counter++;
        last_updated[session_id] = block.timestamp;


        int256 user_balance = _Balance().balanceOf(sessions[session_id].account);

        
        (ICDR.CDR memory cdr, ) = _CDR().updateCDR(session_id, session_log, total_duration, sessions[session_id].status);

        int256 debt = int256(cdr.total_cost.incl_vat) - int256(sessions[session_id].total_paid.incl_vat);

                
        if(int256(cdr.total_cost.incl_vat) > user_balance) {
            emit SessionStopRequest(session_id, address(this));
        }

        if(debt < user_balance) {
            if( (user_balance-debt) <= int256(writeoff_treshold)){
                Price memory amount  = Price({
                    incl_vat:uint256(debt),
                    excl_vat:cdr.total_cost.excl_vat-sessions[session_id].total_paid.excl_vat
                });
                _writeOff(session_id,amount);
            }
        }



        emit SessionUpdate(session_id, session_log.meter_value, session_log.percent, session_log.power, session_log.current, session_log.voltage, cdr.total_cost.incl_vat);


    }

    function stopSessionRequest(uint256 session_id) external  {
        uint access_level = _UserAccess().getModuleAccessLevel("Sessions", msg.sender);

        if( access_level == uint(IUserAccess.AccessLevel.THIRD) ){
            _UserAccess().checkAccess(msg.sender, "Sessions", bytes32(session_id), uint(IUserAccess.AccessLevel.THIRD));
            emit SessionStopRequest(session_id, msg.sender);
        }else if ( access_level >= uint(IUserAccess.AccessLevel.FOURTH) ){
            emit SessionStopRequest(session_id, msg.sender);
        }else{
            revert AccessDenied("Sessions");
        }
       
    }



    /**
     * only ocpp proxy
     * @notice Stops an active charging session
     * @param session_id Session ID to stop
     * @param meter_stop Final meter
     * @custom:reverts "ObjectNotFound" if session doesn't exist
     * @custom:reverts "InvalidSessionStatus" if session not ACTIVE
     * @custom:reverts "InvalidFinalLog" if final log is invalid
     * @custom:emits SessionEnd on success
     */
    function stopSessionResponse(uint256 session_id, uint256 meter_stop, uint256 timestamp, bool status, string calldata message ) public ocpp_proxy_access {
        if(sessions[session_id].uid == 0) {
            revert ObjectNotFound("Session", session_id);
        }
        
        if(sessions[session_id].status != SessionStatus.ACTIVE) {
            revert InvalidSessionStatus(session_id, sessions[session_id].status);
        }
        SessionMeterLog memory log;

        log.meter_value = meter_stop;
        log.timestamp = timestamp;


        // Проверяем корректность финального лога
        if (sessions[session_id].session_log_counter > 0) {
            SessionMeterLog memory last_log = session_logs[session_id][sessions[session_id].session_log_counter - 1];
            require(log.timestamp >= last_log.timestamp, "Invalid final log timestamp");
            require(log.meter_value >= last_log.meter_value, "Invalid final meter value");
        }

        uint256 stop_time = log.timestamp;
        require(stop_time > sessions[session_id].start_datetime, "Invalid end time");


        if (!status){
            emit SessionStopResponse(session_id, status, message);
            return;
        }

        

        // Сначала добавляем финальный лог
        session_logs[session_id][sessions[session_id].session_log_counter] = log;
        sessions[session_id].session_log_counter++;
        // Теперь меняем статус и завершаем сессию
        sessions[session_id].stop_datetime = stop_time;

        
        uint256 total_duration = log.timestamp-sessions[session_id].start_datetime;
        
        // Генерируем CDR пока сессия еще ACTIVE
        (ICDR.CDR memory cdr, ) = _CDR().updateCDR(session_id, log, total_duration, SessionStatus.CHARGING_COMPLETED);
        

        _setSessionStatus(session_id, SessionStatus.CHARGING_COMPLETED);

        last_updated[session_id] = stop_time;


        int256 user_balance = _Balance().balanceOf(sessions[session_id].account);

        int256 debt = int256(cdr.total_cost.incl_vat) - int256(sessions[session_id].total_paid.incl_vat);

        if(debt < user_balance) {
            if( (user_balance-debt) <= int256(writeoff_treshold)){
                Price memory amount  = Price({
                    incl_vat:uint256(debt),
                    excl_vat:cdr.total_cost.excl_vat-sessions[session_id].total_paid.excl_vat
                });
                _writeOff(session_id,amount);
            }
        }

        emit SessionStopResponse(session_id, status, message);
    }


    function endSession(uint256 session_id, uint256 timestamp) external ocpp_proxy_access {

        if(sessions[session_id].status != SessionStatus.CHARGING_COMPLETED) {
            revert InvalidSessionStatus(session_id, sessions[session_id].status);
        }

        SessionMeterLog memory last_log;
        if (sessions[session_id].session_log_counter > 0) {
            last_log = session_logs[session_id][sessions[session_id].session_log_counter - 1];
        }

        SessionMeterLog memory log;
        log.meter_value = last_log.meter_value;
        log.timestamp = timestamp;

        uint256 total_duration = log.timestamp-sessions[session_id].start_datetime;
        
        (ICDR.CDR memory cdr, ) = _CDR().updateCDR(session_id, log, total_duration, SessionStatus.FINISHING);

        _setSessionStatus(session_id, SessionStatus.FINISHING);


        last_updated[session_id] = timestamp;

        int256 user_balance = _Balance().balanceOf(sessions[session_id].account);

        int256 debt = int256(cdr.total_cost.incl_vat) - int256(sessions[session_id].total_paid.incl_vat);

        if(debt < user_balance) {
            if( (user_balance-debt) <= int256(writeoff_treshold)){
                Price memory amount  = Price({
                    incl_vat:uint256(debt),
                    excl_vat:cdr.total_cost.excl_vat-sessions[session_id].total_paid.excl_vat
                });
                _writeOff(session_id,amount);
            }
        }

    }

    function _writeOff(uint256 session_id, Price memory amount) internal {

        if(amount.incl_vat == 0){
            return;
        }
        
        _Balance().transferFrom(sessions[session_id].account, address(0), amount.incl_vat);

        paid_logs[session_id][sessions[session_id].paid_log_counter] = PaidLog({timestamp:block.timestamp,amount:amount});
        sessions[session_id].paid_log_counter++;
        sessions[session_id].total_paid.incl_vat += amount.incl_vat;
        sessions[session_id].total_paid.excl_vat += amount.excl_vat;
    }


    /**
     * @notice Retrieves session details
     * @param session_id Session ID to query
     * @return session Complete session data
     */
    function getSession(uint256 session_id) external view returns(Session memory) {
        return sessions[session_id];
    }

    /**
     * @notice Retrieves session details
     * @param session_id Session ID to query
     * @param index Number of log
     * @return SessionMeterLog Complete session data
     */
    function getSessionLog(uint256 session_id, uint256 index) external view returns(SessionMeterLog memory) {
        return session_logs[session_id][index];
    }

    function sessionLogs(uint256 session_id) external view returns(SessionMeterLog[] memory){

        SessionMeterLog[] memory logs = new SessionMeterLog[](sessions[session_id].session_log_counter);

        for (uint i = 0; i < sessions[session_id].session_log_counter; i++) {
            logs[i] = session_logs[session_id][i];
        }

        return logs;
    }


    /**
     * @notice Checks if session exists
     * @param session_id Session ID to check
     * @return bool True if session exists
     */
    function exist(uint256 session_id) external view returns(bool) {
        return sessions[session_id].uid != 0;
    }

    /**
     * @notice Gets session ID by authorization ID
     * @param auth_id Authorization reference
     * @return session_id Associated session ID
     */
    function getSessionByAuth(address auth_id) external view returns(uint256) {
        return sessionByAuth[auth_id];
    }

    // Использовать битовые операции для проверок
    function _validateLog(SessionMeterLog memory log) internal pure returns (bool) {
        return (
            (log.meter_value >= 0) &&
            (log.percent <= 100) &&
            (log.power >= 0) &&
            (log.current >= 0) &&
            (log.voltage >= 0) &&
            (log.timestamp > 0)
        );
    }
}