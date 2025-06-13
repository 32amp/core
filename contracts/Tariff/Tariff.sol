// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../Hub/IHub.sol";
import "./ITariff.sol";
import "../User/IUserAccess.sol";
import "../Services/ICurrencies.sol";

/**
 * @title Tariff Management Contract
 * @notice Handles the storage and management of tariff information
 * @dev Manages tariff data including pricing, energy mix, and validity periods
 * @custom:warning Requires proper initialization and access control for modifications
 */
contract Tariff is ITariff, Initializable {
    // State variables documentation
    /// @notice Hub contract reference
    address hubContract;
    
    /// @notice Associated partner ID
    uint256 partner_id;
    
    /// @dev Auto-incrementing tariff ID counter
    uint256 counter;

    // Storage mappings documentation
    /// @dev Timestamp of last update for each tariff
    mapping(uint256 => uint256) last_updated;
    
    /// @dev Tariff data storage id => version => TariffData
    mapping(uint256 => mapping( uint16 => TariffData )) tariffs;

    mapping(uint256 => uint16) current_tariff_version;

    mapping(uint256 => CDR) cdrs;

    uint256 constant MAX_COST = type(uint256).max / 2; // Максимальная стоимость для предотвращения переполнения



    /**
     * @notice Initializes the contract with Hub connection
     * @param _partner_id Partner ID from Hub registry
     * @param _hubContract Address of Hub contract
     * @custom:init Called once during proxy deployment
     */
    function initialize(uint256 _partner_id, address _hubContract) public initializer {
        hubContract = _hubContract;
        partner_id = _partner_id;
    }

    /**
     * @notice Returns the current contract version
     * @return string Contract version identifier
     */
    function getVersion() external pure returns(string memory) {
        return "1.2";
    }

    /**
     * @notice Checks if a tariff exists by ID
     * @param id Tariff ID to check
     * @return bool True if the tariff exists, false otherwise
     */
    function exist(uint256 id) public view returns(bool) {
        return last_updated[id] != 0;
    }

    /**
     * @notice Access control modifier requiring FOURTH level privileges
     * @param id Tariff ID to check access for
     */
    modifier access(uint256 id) {
        _UserAccess().checkAccess(msg.sender, "Tariff", bytes32(id), uint(IUserAccess.AccessLevel.FOURTH));
        _;
    }

    modifier onlySessionContract() {
        if(IHub(hubContract).getModule("Sessions", partner_id) != msg.sender){
            revert AccessDenied("CDR");
        }
        _;
    }

    /**
     * @dev Internal function to update the last modified timestamp
     * @param id Tariff ID to update
     */
    function _updated(uint256 id) internal {
        last_updated[id] = block.timestamp;
    }

    /**
     * @dev Returns UserAccess module interface
     * @return IUserAccess UserAccess module instance
     */
    function _UserAccess() private view returns(IUserAccess) {
        return IUserAccess(IHub(hubContract).getModule("UserAccess", partner_id));
    }

    /**
     * @dev Returns Currencies service interface
     * @return ICurrencies Currencies service instance
     */
    function _Currencies() private view returns(ICurrencies) {
        return ICurrencies(IHub(hubContract).getService("Currencies"));
    }

    /**
     * @notice Adds a new tariff to the registry
     * @param tariff Tariff data structure to add
     * @custom:reverts AccessDenied If caller lacks FOURTH level access
     * @custom:reverts ObjectNotFound If referenced currency does not exist
     * @custom:emits AddTariff On successful tariff addition
     */
    function add(TariffData calldata tariff) external {

        uint access_level = _UserAccess().getModuleAccessLevel("Tariff", msg.sender);

        if(access_level < uint(IUserAccess.AccessLevel.FOURTH)){
            revert AccessDenied("Tariff");
        }

        if(!_Currencies().exist(tariff.tariff.currency))
            revert ObjectNotFound("Currency",tariff.tariff.currency);

        counter++;

        current_tariff_version[counter] = 1;
        tariffs[counter][1] = tariff;

        _updated(counter);

        emit AddTariff(counter, msg.sender);

        _UserAccess().setAccessLevelToModuleObject(bytes32(counter),msg.sender,"Tariff",IUserAccess.AccessLevel.FOURTH);

    }

    function update(uint256 id, TariffData calldata tariff) access(id) external {
        if( !exist(id) ) {
            revert ObjectNotFound("tariff", id);
        }

        current_tariff_version[id]++;

        _updated(id);

        tariffs[id][current_tariff_version[id]] = tariff;
    }



    /**
     * @notice Retrieves complete tariff details by ID
     * @param id Tariff ID to query
     * @return Output Tariff data structure with all associated details
     */    
    function get(uint256 id) external view returns(Output memory) {

        if( !exist(id) ) {
            revert ObjectNotFound("tariff", id);
        }

        Output memory ret;

        ret.id = id;
        ret.last_updated = last_updated[id];
        ret.current_version = current_tariff_version[id];
        ret.tariff = tariffs[id][current_tariff_version[id]];

        return ret;
    }


    /**
     * @notice Retrieves complete tariff details by ID
     * @param id Tariff ID to query
     * @param version Verion of tariff
     * @return Output Tariff data structure with all associated details
     */    
    function getByVersion(uint256 id, uint16 version ) external view returns(Output memory) {

        if( !exist(id) ) {
            revert ObjectNotFound("tariff", id);
        }

        Output memory ret;

        ret.id = id;
        ret.last_updated = last_updated[id];
        ret.current_version = version;
        ret.tariff = tariffs[id][current_tariff_version[version]];

        return ret;
    }



    function getCurrentVersion(uint256 id) external view returns(uint16){
        if( !exist(id) ) {
            revert ObjectNotFound("tariff", id);
        }

        return current_tariff_version[id];
    }


    /**
     * @dev Function to generate Charging Data Record
     * @param session_id Session ID to process
     */
    function createCDR(uint256 session_id, Session calldata session, uint256 timestamp, uint256 meter_start) onlySessionContract  external {
        SessionMeterLog memory log;
        log.meter_value = meter_start;
        log.timestamp = timestamp;

        CDR memory cdr = CDR({
            session_id:session_id,
            evse_uid: session.evse_uid,
            connector_id: session.connector_id,
            start_datetime: timestamp,
            tariff_id: session.tariff_id,
            tariff_version: session.tariff_version,
            end_datetime:0,
            total_energy:0,
            total_cost:Price({
                incl_vat:0,
                excl_vat:0
            }),
            last_log:log,
            elements:new CDRElement[](tariffs[session.tariff_id][session.tariff_version].tariff.elements.length)
        });
        
        cdrs[session_id] = cdr;
    }


    function updateCDR(uint256 session_id, SessionMeterLog calldata log, uint256 total_duration, SessionStatus status) onlySessionContract external returns(Price memory) {
        
        CDR storage cdr = cdrs[session_id];
        TariffData storage tariff = tariffs[cdrs[session_id].tariff_id][cdrs[session_id].tariff_version];


        
        for (uint i = 0; i < tariff.tariff.elements.length; i++) {
            ITariff.TariffElement memory element = tariff.tariff.elements[i];
            
            
            
            if(cdr.elements[i].components.length == 0){
                cdr.elements[i].components = new CDRComponent[](element.price_components.length);
            }

            if (!_checkTariffRestrictions(element.restrictions,  log, total_duration)) {
                continue;
            }

            for (uint j = 0; j < element.price_components.length; j++) {
                ITariff.PriceComponent memory component = element.price_components[j];
                CDRComponent memory component_before_calc = cdr.elements[i].components[j];
                
                
                if(component.price == 0){
                    cdr.elements[i].components[j] =  CDRComponent({price:Price({excl_vat:0, incl_vat:0}), _type:component._type, total_duration:0});
                    continue;
                }

                if ( component._type == ITariff.TariffDimensionType.PARKING_TIME && cdr.elements[i].components[j].price.excl_vat == 0 && status == SessionStatus.FINISHING ) {
                    cdr.elements[i].components[j] = _calculateTimeCost(cdr.elements[i].components[j], session_id,  log, component);
                }else if (component._type == ITariff.TariffDimensionType.ENERGY) {
                    cdr.elements[i].components[j] = _calculateEnergyCost(cdr.elements[i].components[j], session_id, log, component);
                } else if (component._type == ITariff.TariffDimensionType.TIME) {
                    cdr.elements[i].components[j] = _calculateTimeCost(cdr.elements[i].components[j], session_id,  log, component);
                } else if (component._type == ITariff.TariffDimensionType.FLAT) {
                    if(cdr.elements[i].components[j].price.excl_vat == component.price){
                        continue;
                    }
                    cdr.elements[i].components[j] = _calculateFlatCost(component);
                    
                }
                
                if(cdr.elements[i].components[j].price.excl_vat > component_before_calc.price.excl_vat){
                    cdr.total_cost.excl_vat += cdr.elements[i].components[j].price.excl_vat-component_before_calc.price.excl_vat;
                    cdr.total_cost.incl_vat += cdr.elements[i].components[j].price.incl_vat-component_before_calc.price.incl_vat;
                }
            }
        }

        if(status == SessionStatus.FINISHING){
            cdr.total_energy = log.meter_value;
            cdrs[session_id].end_datetime = log.timestamp;
        }

        cdr.last_log = log;

        return cdr.total_cost;
    }

    function _calculateFlatCost(
        ITariff.PriceComponent memory component
    ) internal pure returns (CDRComponent memory) {

        uint256 cost = component.price;
        uint256 cost_vat = _addVat(cost,component.vat);
        
        return CDRComponent({price:Price({excl_vat:cost, incl_vat:cost_vat}), _type:ITariff.TariffDimensionType.FLAT, total_duration:0});

    }

    function _calculateEnergyCost(
        CDRComponent memory element,
        uint256 session_id,
        SessionMeterLog calldata log,
        ITariff.PriceComponent memory component
    ) internal view returns (CDRComponent memory) {
        SessionMeterLog memory last_log = cdrs[session_id].last_log;
        uint256 total_duration = element.total_duration;
        uint256 prev_timestamp = last_log.timestamp;
        uint256 interval_duration = log.timestamp - prev_timestamp;

        

        uint256 energy_cost = element.price.excl_vat;
        uint256 prev_meter_value = last_log.meter_value;
        

        // Проверяем корректность значений счетчика
        require(log.meter_value >= prev_meter_value, "Negative energy consumption");
        
        // Рассчитываем потребление энергии между логами
        uint256 energy_consumed = log.meter_value - prev_meter_value;

        

        if (energy_consumed > 0 ) {
            uint256 rounded_kwh = energy_consumed;
            uint256 cost_increment = (rounded_kwh * component.price) / 1e18;
            
            require(energy_cost + cost_increment >= energy_cost, "Cost overflow");
            energy_cost += cost_increment;
        }
        

        require(energy_cost <= MAX_COST, "Cost too high");

        uint256 energy_cost_with_vat = _addVat(energy_cost,component.vat);
        total_duration += interval_duration;

        return CDRComponent({price:Price({excl_vat:energy_cost, incl_vat:energy_cost_with_vat}), _type:ITariff.TariffDimensionType.ENERGY, total_duration:total_duration});
    }



    function _calculateTimeCost(
        CDRComponent memory element,
        uint256 session_id,
        SessionMeterLog calldata log,
        ITariff.PriceComponent memory component
    ) internal view returns (CDRComponent memory) {
        uint256 time_cost = element.price.excl_vat;
        uint256 total_duration = element.total_duration;
        uint256 prev_timestamp = cdrs[session_id].last_log.timestamp;
        uint256 interval_duration = log.timestamp - prev_timestamp;
        uint256 cost_increment = (interval_duration * (component.price/60));

        require(time_cost + cost_increment >= time_cost, "Cost overflow");
        
        total_duration += interval_duration;
        time_cost += cost_increment;


        require(time_cost <= MAX_COST, "Cost too high");

        uint256 time_cost_vat = _addVat(time_cost, component.vat);
        
        return CDRComponent({price:Price({excl_vat:time_cost, incl_vat:time_cost_vat}), _type:component._type, total_duration:total_duration});
    }


    function _addVat(uint256 cost, uint256 vat) internal pure returns(uint256){
        if (vat > 0) {
            uint256 vat_amount = (cost * vat) / 100;
            require(cost + vat_amount >= cost, "VAT overflow");
            cost += vat_amount;
        }

        return cost;
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
        (uint256 hour, uint256 minute) = _getHoursMinutes(timestamp);


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

    function _getHoursMinutes(uint timestamp) public pure returns (uint256, uint256) {
        // 1. Получить количество секунд с начала текущего дня
        uint256 secondsInDay = timestamp % 86400; // 86400 секунд = 1 день
        
        // 2. Вычислить часы (делением на 3600 секунд)
        uint256 _hours = secondsInDay / 3600;
        
        // 3. Вычислить минуты из оставшихся секунд
        uint256 remainingSeconds = secondsInDay % 3600;
        uint256 _minutes = remainingSeconds / 60;
        
        return (_hours,_minutes);
    }

    /**
     * @dev Вспомогательная функция для проверки ограничений тарифа
     */
    function _checkTariffRestrictions(
        ITariff.TariffRestrictions memory restrictions,
        SessionMeterLog memory current_log,
        uint256 total_duration
    ) internal pure returns (bool) {

        if(total_duration == 0){
            revert InvalidSessionDuration();
        }

        // Проверка времени
        if (!_isTimeInTariffPeriod(current_log.timestamp, restrictions)) {
            return false;
        }
        
        // Проверка мощности
        if (restrictions.min_power > 0 && current_log.power < restrictions.min_power) {
            return false;
        }
        if (restrictions.max_power > 0 && current_log.power > restrictions.max_power) {
            return false;
        }
        

        // Проверка энергии
        if (restrictions.min_kwh > 0 && current_log.meter_value < restrictions.min_kwh) {
            return false;
        }
        if (restrictions.max_kwh > 0 && current_log.meter_value > restrictions.max_kwh) {
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
     * @notice Retrieves Charging Data Record
     * @param session_id Session ID to query
     * @return cdr Complete CDR data
     */
    function getCDR(uint256 session_id) external view returns(CDR memory) {
        return (cdrs[session_id]);
    }
}
