// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../Hub/IHub.sol";
import "./ISessions.sol";
import "../User/IUserAccess.sol";
import "../Tariff/ITariff.sol";
import "../Location/IEVSE.sol";
import "../Location/IConnector.sol";
import "../Payment/IBalance.sol";

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
    uint8 reservation_time; // in minutes
    
    // Storage mappings
    mapping(uint256 => Session) sessions;
    mapping(uint256 => Reservation) reservations;
    mapping(uint256 => mapping(uint256 => SessionMeterLog)) session_logs;
    mapping(uint256 => CDR) sessionCDRs;
    mapping(uint256 => uint256) last_updated;
    mapping(address => uint256) sessionByAuth; // auth_id -> session_id
    mapping(uint256 => address) authBySession; // session_id -> auth_id

    // Константы
    uint256 constant MAX_LOGS_PER_SESSION = 1000; // Максимальное количество логов в сессии
    uint256 constant MAX_COST = type(uint256).max / 2; // Максимальная стоимость для предотвращения переполнения
    


    /**
     * @notice Initializes contract with Hub connection
     * @param _partner_id Partner ID from Hub registry
     * @param _hubContract Address of Hub contract
     */
    function initialize(uint256 _partner_id, address _hubContract, address _ocpp) public initializer {
        hubContract = _hubContract;
        partner_id = _partner_id;
        min_price_for_start_session = 10 ether;
        reservation_time = 15; 
        ocpp = _ocpp;
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

        Reservation memory r = Reservation({
            time_expire: block.timestamp + (reservation_time * 1 minutes),
            account: start_for,
            confirmed: false,
            canceled: false
        });

        reservations[reservationsCounter] = r;

        emit ReservationRequest(reservationsCounter, start_for, r.time_expire);
    }

    
    function reservationResponse(uint256 reserve_id, bool status) external ocpp_proxy_access {
        if(status){
            reservations[reserve_id].confirmed = true;
            emit ReservationResponseConfirm(reserve_id, reservations[reserve_id].account, reservations[reserve_id].time_expire);
        }else{
            reservations[reserve_id].canceled = true;
            emit ReservationResponseCanceled(reserve_id, reservations[reserve_id].account, reservations[reserve_id].time_expire);
        }

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
    function startSessionRequest( uint256 evse_uid, uint256 connector_id, address start_for, uint256 reserve_id ) external {

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
            if( !reservations[reserve_id].confirmed || reservations[reserve_id].account != start_for){
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
        if(connector.status != ConnectorStatus.Available || connector.status != ConnectorStatus.Reserved) {
            revert ConnectorNotAvailable(connector_id);
        }

        // Проверяем корректность тарифа
        require(connector.tariff != 0, "Invalid tariff");

        if(sessionByAuth[msg.sender] != 0) {
            revert SessionAlreadyActive(msg.sender);
        }

        // Получаем текущую версию тарифа на момент старта сессии
        uint256 current_tariff_version = _Tariff().getCurrentVersion(connector.tariff);
        require(current_tariff_version > 0, "Invalid tariff version");

        uint256 account_balance = _Balance().balanceOf(start_for);

        if(account_balance < min_price_for_start_session){
            revert InsufficientBalance();
        }

        sessionCounter++;

        Session memory s = Session({
            uid: sessionCounter,
            evse_uid: evse_uid,
            connector_id: connector_id,
            start_datetime: block.timestamp,
            end_datetime: 0,
            session_log_counter: 0,
            tariff_id: connector.tariff,
            account: start_for,
            reserve_id: reserve_id,
            tariff_version: current_tariff_version, // Сохраняем текущую версию тарифа
            status: SessionStatus.PENDING
        });

        sessions[sessionCounter] = s;

        sessionByAuth[msg.sender] = sessionCounter;
        authBySession[sessionCounter] = msg.sender;
        last_updated[sessionCounter] = block.timestamp;

        _UserAccess().setAccessLevelToModuleObject(bytes32(sessionCounter), msg.sender, "Sessions", IUserAccess.AccessLevel.THIRD);

        emit SessionStartRequest(evse_uid, connector_id,  msg.sender, sessionCounter);
    }

    
    function startSessionResponse(uint256 session_id, bool status, string calldata message ) external ocpp_proxy_access {
        if(status){
            sessions[session_id].status = SessionStatus.ACTIVE;
        }else{
            sessions[session_id].status = SessionStatus.INVALID;
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
        require(session_log.percent <= 100, "Invalid percent value");
        require(session_log.power >= 0, "Invalid power value");
        require(session_log.current >= 0, "Invalid current value");
        require(session_log.voltage >= 0, "Invalid voltage value");
        require(session_log.timestamp > 0, "Invalid timestamp");

        // Проверяем монотонность timestamp
        if (sessions[session_id].session_log_counter > 0) {
            SessionMeterLog memory prev_log = session_logs[session_id][sessions[session_id].session_log_counter - 1];
            require(session_log.timestamp > prev_log.timestamp, "Invalid timestamp sequence");
        }

        // Проверяем количество логов
        if(sessions[session_id].session_log_counter >= MAX_LOGS_PER_SESSION) {
            revert TooManyLogs(session_id);
        }

        session_logs[session_id][sessions[session_id].session_log_counter] = session_log;
        sessions[session_id].session_log_counter++;
        last_updated[session_id] = block.timestamp;


        uint256 user_balance = _Balance().balanceOf(sessions[session_id].account);
        CDR memory cdr = generateCDR(session_id);


        emit SessionUpdate(session_id, session_log.meter_value, session_log.percent, session_log.power, session_log.current, session_log.voltage, cdr.total_cost);


        if(cdr.total_cost > user_balance) {
            emit SessionStopRequest(session_id, address(this));
        }

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
     * @param session_log Final meter reading
     * @custom:reverts "ObjectNotFound" if session doesn't exist
     * @custom:reverts "InvalidSessionStatus" if session not ACTIVE
     * @custom:reverts "InvalidFinalLog" if final log is invalid
     * @custom:emits SessionEnd on success
     */
    function stopSessionResponse(uint256 session_id, SessionMeterLog memory session_log) public ocpp_proxy_access {
        if(sessions[session_id].uid == 0) {
            revert ObjectNotFound("Session", session_id);
        }
        
        if(sessions[session_id].status != SessionStatus.ACTIVE) {
            revert InvalidSessionStatus(session_id, sessions[session_id].status);
        }

        // Проверяем корректность финального лога
        if (sessions[session_id].session_log_counter > 0) {
            SessionMeterLog memory last_log = session_logs[session_id][sessions[session_id].session_log_counter - 1];
            require(session_log.timestamp > last_log.timestamp, "Invalid final log timestamp");
            require(session_log.meter_value >= last_log.meter_value, "Invalid final meter value");
        }

        uint256 end_time = block.timestamp;
        require(end_time > sessions[session_id].start_datetime, "Invalid end time");

        session_logs[session_id][sessions[session_id].session_log_counter] = session_log;
        sessions[session_id].end_datetime = end_time;
        sessions[session_id].status = SessionStatus.COMPLETED;
        last_updated[session_id] = end_time;

        // Generate CDR
        CDR memory cdr = generateCDR(session_id);
                
        sessionCDRs[session_id] = cdr;

        _Balance().transferFrom(sessions[session_id].account, address(0), cdr.total_cost );

        address auth_id = authBySession[session_id];
        delete sessionByAuth[auth_id];
        delete authBySession[session_id];

        emit SessionStopResponse(session_id, true, "");
    }

    /**
     * @dev Function to generate Charging Data Record
     * @param session_id Session ID to process
     */
    function generateCDR(uint256 session_id)  public view returns(CDR memory) {
        Session memory session = sessions[session_id];
        
        require(session.session_log_counter > 0, "No session logs");
        
        // Получаем первый и последний лог
        SessionMeterLog memory first_log = session_logs[session_id][0];
        SessionMeterLog memory last_log = session_logs[session_id][session.session_log_counter];
        
        require(last_log.meter_value >= first_log.meter_value, "Invalid energy consumption");
        
        CDR memory cdr;
        cdr.session_id = session_id;
        cdr.evse_uid = session.evse_uid;
        cdr.connector_id = session.connector_id;
        cdr.start_datetime = session.start_datetime;
        cdr.end_datetime = session.end_datetime;
        cdr.tariff_id = session.tariff_id;
        cdr.tariff_version = session.tariff_version;
        cdr.total_energy = last_log.meter_value - first_log.meter_value;
        

        ITariff.Output memory tariff = _Tariff().getByVersion(session.tariff_id, session.tariff_version);

        cdr.total_cost = _calculateCost(session_id, tariff);

        
        return cdr;
    }
    

    /**
     * @dev Internal function to calculate session cost
     * @param session_id Session id
     * @param tariff Tariff structure
     * @return cost Calculated cost in milliunits (1/1000 of currency unit)
     */
    function _calculateCost(uint256 session_id, ITariff.Output memory tariff) internal view returns(uint256 cost) {
        Session memory session = sessions[session_id];
        SessionMeterLog memory last_log = session_logs[session_id][session.session_log_counter];
        uint256 total_duration = last_log.timestamp - session.start_datetime;
        
        // Проходим по всем элементам тарифа
        for (uint i = 0; i < tariff.tariff.tariff.elements.length; i++) {
            ITariff.TariffElement memory element = tariff.tariff.tariff.elements[i];
            
            // Проверяем ограничения тарифа
            if (!_checkTariffRestrictions(element.restrictions, session, session_logs[session_id][session.session_log_counter], total_duration)) {
                continue;
            }
            
            // Проходим по всем компонентам цены
            for (uint j = 0; j < element.price_components.length; j++) {
                ITariff.PriceComponent memory component = element.price_components[j];
                
                if (component._type == ITariff.TariffDimensionType.ENERGY) {
                    cost += _calculateEnergyCost(session_id, session, element.restrictions, component);
                } else if (component._type == ITariff.TariffDimensionType.TIME) {
                    cost += _calculateTimeCost(session_id, session, element.restrictions, component);
                } else if (component._type == ITariff.TariffDimensionType.FLAT) {
                    cost += _calculateFlatCost(component);
                } else if (component._type == ITariff.TariffDimensionType.PARKING_TIME) {
                    cost += _calculateParkingCost(session_id, session, element.restrictions, component);
                }
            }
        }
    }

    function _calculateEnergyCost(
        uint256 session_id,
        Session memory session,
        ITariff.TariffRestrictions memory restrictions,
        ITariff.PriceComponent memory component
    ) internal view returns (uint256) {
        require(component.step_size > 0, "Invalid step size");
        require(component.price > 0, "Invalid price");

        uint256 energy_cost = 0;
        uint256 prev_meter_value = 0;
        
        // Проходим по всем логам сессии
        for (uint k = 0; k <= session.session_log_counter; k++) {
            SessionMeterLog memory log = session_logs[session_id][k];
            if (k == 0) {
                prev_meter_value = log.meter_value;
                continue;
            }
            
            // Проверяем корректность значений счетчика
            require(log.meter_value >= prev_meter_value, "Negative energy consumption");
            
            // Рассчитываем потребление энергии между логами
            uint256 energy_consumed = log.meter_value - prev_meter_value;
            if (energy_consumed > 0 && _isTimeInTariffPeriod(log.timestamp, restrictions)) {
                uint256 cost_increment = (energy_consumed * component.price) / component.step_size;
                require(energy_cost + cost_increment >= energy_cost, "Cost overflow");
                energy_cost += cost_increment;
            }
            prev_meter_value = log.meter_value;
        }
        
        // Применяем НДС для энергии
        if (component.vat > 0) {
            uint256 vat_amount = (energy_cost * component.vat) / 100;
            require(energy_cost + vat_amount >= energy_cost, "VAT overflow");
            energy_cost += vat_amount;
        }
        
        require(energy_cost <= MAX_COST, "Cost too high");
        return energy_cost;
    }

    function _calculateTimeCost(
        uint256 session_id,
        Session memory session,
        ITariff.TariffRestrictions memory restrictions,
        ITariff.PriceComponent memory component
    ) internal view returns (uint256) {
        require(component.step_size > 0, "Invalid step size");
        require(component.price > 0, "Invalid price");
        SessionMeterLog memory last_log = session_logs[session_id][session.session_log_counter];

        require(last_log.timestamp > session.start_datetime, "Invalid session duration");
        
        uint256 time_cost = 0;
        uint256 prev_timestamp = session.start_datetime;
        
        // Проходим по всем логам сессии
        for (uint k = 0; k <= session.session_log_counter; k++) {
            SessionMeterLog memory log = session_logs[session_id][k];
            require(log.timestamp > prev_timestamp, "Invalid time interval");
            
            if (_isTimeInTariffPeriod(log.timestamp, restrictions)) {
                uint256 interval_duration = log.timestamp - prev_timestamp;
                uint256 cost_increment = (interval_duration * component.price) / (component.step_size * 3600);
                require(time_cost + cost_increment >= time_cost, "Cost overflow");
                time_cost += cost_increment;
            }
            prev_timestamp = log.timestamp;
        }
        
        // Добавляем последний интервал до end_datetime
        if (_isTimeInTariffPeriod(last_log.timestamp, restrictions)) {
            uint256 final_interval = last_log.timestamp - prev_timestamp;
            require(final_interval > 0, "Invalid final interval");
            uint256 cost_increment = (final_interval * component.price) / (component.step_size * 3600);
            require(time_cost + cost_increment >= time_cost, "Cost overflow");
            time_cost += cost_increment;
        }
        
        // Применяем НДС для времени
        if (component.vat > 0) {
            uint256 vat_amount = (time_cost * component.vat) / 100;
            require(time_cost + vat_amount >= time_cost, "VAT overflow");
            time_cost += vat_amount;
        }
        
        require(time_cost <= MAX_COST, "Cost too high");
        return time_cost;
    }

    function _calculateFlatCost(
        ITariff.PriceComponent memory component
    ) internal pure returns (uint256) {
        require(component.price > 0, "Invalid price");
        
        uint256 flat_cost = component.price;
        
        // Применяем НДС для фиксированной платы
        if (component.vat > 0) {
            uint256 vat_amount = (flat_cost * component.vat) / 100;
            require(flat_cost + vat_amount >= flat_cost, "VAT overflow");
            flat_cost += vat_amount;
        }
        
        require(flat_cost <= MAX_COST, "Cost too high");
        return flat_cost;
    }

    function _calculateParkingCost(
        uint256 session_id,
        Session memory session,
        ITariff.TariffRestrictions memory restrictions,
        ITariff.PriceComponent memory component
    ) internal view returns (uint256) {
        uint256 parking_cost = 0;
        uint256 prev_timestamp = session.start_datetime;
        //SessionMeterLog memory last_log = session_logs[session_id][session.session_log_counter];

        // Проходим по всем логам сессии
        for (uint k = 0; k <= session.session_log_counter; k++) {
            SessionMeterLog memory log = session_logs[session_id][k];
            
            if (_isTimeInTariffPeriod(log.timestamp, restrictions)) {
                uint256 interval_duration = log.timestamp - prev_timestamp;
                uint256 cost_increment = (interval_duration * component.price) / (component.step_size * 3600);
                require(parking_cost + cost_increment >= parking_cost, "Cost overflow");
                parking_cost += cost_increment;
            }
            prev_timestamp = log.timestamp;
        }
        
        if (session.end_datetime != 0){
            // Добавляем последний интервал до end_datetime
            if (_isTimeInTariffPeriod(session.end_datetime, restrictions)) {
                uint256 final_interval = session.end_datetime - prev_timestamp;
                uint256 cost_increment = (final_interval * component.price) / (component.step_size * 3600);
                require(parking_cost + cost_increment >= parking_cost, "Cost overflow");
                parking_cost += cost_increment;
            }
        
        }

        // Применяем НДС для времени парковки
        if (component.vat > 0) {
            uint256 vat_amount = (parking_cost * component.vat) / 100;
            require(parking_cost + vat_amount >= parking_cost, "VAT overflow");
            parking_cost += vat_amount;
        }
        
        require(parking_cost <= MAX_COST, "Cost too high");
        return parking_cost;
    }

    /**
     * @dev Вспомогательная функция для проверки времени в периоде тарифа
     */
    function _isTimeInTariffPeriod(
        uint256 timestamp,
        ITariff.TariffRestrictions memory restrictions
    ) internal pure returns (bool) {
        require(timestamp > 0, "Invalid timestamp");
        
        // Проверка времени суток
        uint256 hour = (timestamp % 86400) / 3600;
        uint256 minute = (timestamp % 3600) / 60;
        
        uint256 start_hour = uint256(int256(restrictions.start_time_hour));
        uint256 start_minute = uint256(int256(restrictions.start_time_minute));
        uint256 end_hour = uint256(int256(restrictions.end_time_hour));
        uint256 end_minute = uint256(int256(restrictions.end_time_minute));
        
        if (start_hour != 0 || start_minute != 0 || end_hour != 0 || end_minute != 0) {
            require(end_hour > start_hour || (end_hour == start_hour && end_minute > start_minute), "Invalid time range");
            
            if (hour < start_hour || 
                (hour == start_hour && minute < start_minute) ||
                hour > end_hour ||
                (hour == end_hour && minute > end_minute)) {
                return false;
            }
        }
        
        // Проверка дней недели
        if (restrictions.day_of_week.length > 0) {
            uint256 day_of_week = (timestamp / 86400 + 4) % 7 + 1; // 1 = Monday, 7 = Sunday
            bool day_found = false;
            for (uint i = 0; i < restrictions.day_of_week.length; i++) {
                uint256 day = uint256(restrictions.day_of_week[i]);
                require(day >= 1 && day <= 7, "Invalid day of week");
                if (day == day_of_week) {
                    day_found = true;
                    break;
                }
            }
            if (!day_found) {
                return false;
            }
        }
        
        // Проверка дат
        if (restrictions.start_date > 0 && timestamp < uint256(int256(restrictions.start_date))) {
            return false;
        }
        if (restrictions.end_date > 0 && timestamp > uint256(int256(restrictions.end_date))) {
            return false;
        }
        
        return true;
    }

    /**
     * @dev Вспомогательная функция для проверки ограничений тарифа
     */
    function _checkTariffRestrictions(
        ITariff.TariffRestrictions memory restrictions,
        Session memory session,
        SessionMeterLog memory final_log,
        uint256 total_duration
    ) internal view returns (bool) {
        require(total_duration > 0, "Invalid session duration");
        
        // Проверяем корректность ограничений мощности
        if (restrictions.min_power > 0 && restrictions.max_power > 0) {
            require(restrictions.min_power <= restrictions.max_power, "Invalid power range");
        }
        
        // Проверяем все логи сессии на соответствие ограничениям времени и мощности
        for (uint i = 0; i <= session.session_log_counter; i++) {
            SessionMeterLog memory log = session_logs[session.uid][i];
            
            // Проверка времени
            if (!_isTimeInTariffPeriod(log.timestamp, restrictions)) {
                return false;
            }
            
            // Проверка мощности
            if (restrictions.min_power > 0 && log.power < restrictions.min_power) {
                return false;
            }
            if (restrictions.max_power > 0 && log.power > restrictions.max_power) {
                return false;
            }
        }

        // Проверка энергии
        if (restrictions.min_kwh > 0 && final_log.meter_value < restrictions.min_kwh) {
            return false;
        }
        if (restrictions.max_kwh > 0 && final_log.meter_value > restrictions.max_kwh) {
            return false;
        }
        
        // Проверка длительности
        if (restrictions.min_duration > 0 && total_duration < restrictions.min_duration) {
            return false;
        }
        if (restrictions.max_duration > 0 && total_duration > restrictions.max_duration) {
            return false;
        }
        
        return true;
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
     * @notice Retrieves Charging Data Record
     * @param session_id Session ID to query
     * @return cdr Complete CDR data
     */
    function getCDR(uint256 session_id) external view returns(CDR memory) {
        return sessionCDRs[session_id];
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