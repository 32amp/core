// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./ICDR.sol";
import "../Tariff/ITariff.sol";
import "../Hub/IHub.sol";
import "./ISessions.sol";
import "hardhat/console.sol";


contract CDR is ICDR, Initializable {
    address hubContract;
    uint256 partner_id;

    mapping(uint256 => CDR) cdrs;
    mapping(uint256 => CDRElement[]) cdrElements;

    uint256 constant MAX_COST = type(uint256).max / 2; // Максимальная стоимость для предотвращения переполнения

    /**
     * @notice Initializes contract with Hub connection
     * @param _partner_id Partner ID from Hub registry
     * @param _hubContract Address of Hub contract
     */
    function initialize(uint256 _partner_id, address _hubContract ) public initializer {
        hubContract = _hubContract;
        partner_id = _partner_id;
    }

    /// @notice Returns current contract version
    function getVersion() external pure returns(string memory) {
        return "1.0";
    }


    // Module accessors
    function _Sessions() private view returns(ISessions) {
        return ISessions(IHub(hubContract).getModule("Sessions", partner_id));
    }

    function _Tariff() private view returns(ITariff) {
        return ITariff(IHub(hubContract).getModule("Tariff", partner_id));
    }


    modifier onlySessionContract() {
        if(IHub(hubContract).getModule("Sessions", partner_id) != msg.sender){
            revert AccessDenied("CDR");
        }
        _;
    }

    /**
     * @dev Function to generate Charging Data Record
     * @param session_id Session ID to process
     */
    function generateCDR(uint256 session_id) onlySessionContract  public returns(CDR memory, CDRElement[] memory )  {
        ISessions.Session memory session = _Sessions().getSession(session_id);
        
        require(session.session_log_counter > 0, "No session logs");
        
        // Получаем первый и последний лог
        ISessions.SessionMeterLog memory first_log = _Sessions().getSessionLog(session_id,0);
        ISessions.SessionMeterLog memory last_log = _Sessions().getSessionLog(session_id,session.session_log_counter-1); 
        
        if(session.session_log_counter > 2){
            require(last_log.meter_value >= first_log.meter_value, "Invalid energy consumption");
        }

        
        CDR memory cdr;
        cdr.session_id = session_id;
        cdr.evse_uid = session.evse_uid;
        cdr.connector_id = session.connector_id;
        cdr.start_datetime = first_log.timestamp;
        cdr.end_datetime = session.end_datetime;
        cdr.tariff_id = session.tariff_id;
        cdr.tariff_version = session.tariff_version;
        
        if(session.session_log_counter > 2){
            cdr.total_energy = last_log.meter_value;
        }

        ITariff.Output memory tariff = _Tariff().getByVersion(session.tariff_id, session.tariff_version);

        (Price memory cost, CDRElement[] memory elements) = _calculateCost(session_id, tariff);

        cdr.total_cost = cost;
        
        cdrs[session_id] = cdr;

        for (uint i = 0; i < elements.length; i++) {
            cdrElements[session_id].push(elements[i]);
        }

        return (cdr,elements);
    }
    

    /**
     * @dev Internal function to calculate session cost
     * @param session_id Session id
     * @param tariff Tariff structure
     * @return cost Calculated cost in milliunits (1/1000 of currency unit)
     */
    function _calculateCost(uint256 session_id, ITariff.Output memory tariff) internal view returns(Price memory, CDRElement[] memory ) {



        ISessions.Session memory session = _Sessions().getSession(session_id);
        CDRElement[] memory elements = new CDRElement[](tariff.tariff.tariff.elements.length);
        Price memory cost;

        if(session.session_log_counter < 3){

            assembly {
                mstore(elements, 1)
            }

            return (Price({excl_vat:0, incl_vat:0}), elements);
        }
        
        uint256 count = 0;

        {
            ISessions.SessionMeterLog memory first_log = _Sessions().getSessionLog(session_id,0);
            ISessions.SessionMeterLog memory last_log = _Sessions().getSessionLog(session_id,session.session_log_counter-1); 
            uint256 total_duration = last_log.timestamp - first_log.timestamp;
            
            
            // Проходим по всем элементам тарифа
            for (uint i = 0; i < tariff.tariff.tariff.elements.length; i++) {
                ITariff.TariffElement memory element = tariff.tariff.tariff.elements[i];
                
            
                // Проверяем ограничения тарифа
                if (!_checkTariffRestrictions(element.restrictions, session, last_log, total_duration)) {
                    continue;
                }
                

                // Проходим по всем компонентам цены
                for (uint j = 0; j < element.price_components.length; j++) {
                    ITariff.PriceComponent memory component = element.price_components[j];
                    
                    if (component._type == ITariff.TariffDimensionType.ENERGY) {
                        
                        elements[count] = _calculateEnergyCost(session_id, session, element.restrictions, component);
                        cost.excl_vat += elements[count].price.excl_vat;
                        cost.incl_vat += elements[count].price.incl_vat;
                    } else if (component._type == ITariff.TariffDimensionType.TIME) {
                        console.log(session_id, "_calculateTimeCost");
                        //cost += _calculateTimeCost(session_id, session, element.restrictions, component);
                    } else if (component._type == ITariff.TariffDimensionType.FLAT) {
                        console.log(session_id, "_calculateFlatCost");
                        //cost += _calculateFlatCost(component);
                    } else if (component._type == ITariff.TariffDimensionType.PARKING_TIME) {
                        console.log(session_id, "_calculateParkingCost");
                        //cost += _calculateParkingCost(session_id, session, element.restrictions, component);
                    }
                }

                count++;
            }
        }

        assembly {
            mstore(elements, count)
        }

        return (cost, elements);
    }

    function _calculateEnergyCost(
        uint256 session_id,
        ISessions.Session memory session,
        ITariff.TariffRestrictions memory restrictions,
        ITariff.PriceComponent memory component
    ) internal view returns (CDRElement memory) {

        if(component.price == 0){
            return CDRElement({price:Price({excl_vat:0, incl_vat:0}), _type:ITariff.TariffDimensionType.ENERGY});
        }

        require(component.step_size > 0, "Invalid step size");

        uint256 energy_cost = 0;
        uint256 prev_meter_value = 0;
        
        // Проходим по всем логам сессии
        for (uint k = 0; k < session.session_log_counter; k++) {
            ISessions.SessionMeterLog memory log = _Sessions().getSessionLog(session_id,k);
            if (k == 0) {
                prev_meter_value = log.meter_value;
                continue;
            }
            
            // Проверяем корректность значений счетчика
            require(log.meter_value >= prev_meter_value, "Negative energy consumption");
            
            // Рассчитываем потребление энергии между логами
            uint256 energy_consumed = log.meter_value - prev_meter_value;
            if (energy_consumed > 0 && _isTimeInTariffPeriod(log.timestamp, restrictions)) {
                uint256 rounded_kwh = energy_consumed;
                uint256 cost_increment = (rounded_kwh * component.price) / 1e18;
                
                require(energy_cost + cost_increment >= energy_cost, "Cost overflow");
                energy_cost += cost_increment;
            }
            prev_meter_value = log.meter_value;
        }
        
        uint256 energy_cost_with_vat = energy_cost;

        // Применяем НДС для энергии
        if (component.vat > 0) {
            uint256 vat_amount = (energy_cost * component.vat) / 100;
            require(energy_cost + vat_amount >= energy_cost, "VAT overflow");
            energy_cost_with_vat += vat_amount;
        }
        
        require(energy_cost <= MAX_COST, "Cost too high");

        return CDRElement({price:Price({excl_vat:energy_cost, incl_vat:energy_cost_with_vat}), _type:ITariff.TariffDimensionType.ENERGY});
    }

    function _calculateTimeCost(
        uint256 session_id,
        ISessions.Session memory session,
        ITariff.TariffRestrictions memory restrictions,
        ITariff.PriceComponent memory component
    ) internal view returns (uint256) {

        if(component.price == 0 ){
            return 0;
        }
        
        require(component.step_size > 0, "Invalid step size");
        
        ISessions.SessionMeterLog memory last_log = _Sessions().getSessionLog(session_id,session.session_log_counter-1);

        require(last_log.timestamp > session.start_datetime, "Invalid session duration");
        
        uint256 time_cost = 0;
        uint256 prev_timestamp = session.start_datetime;
        
        // Проходим по всем логам сессии
        for (uint k = 0; k <= session.session_log_counter; k++) {
            ISessions.SessionMeterLog memory log = _Sessions().getSessionLog(session_id,k);
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
        if(component.price == 0){
            return 0;
        }
        
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
        ISessions.Session memory session,
        ITariff.TariffRestrictions memory restrictions,
        ITariff.PriceComponent memory component
    ) internal view returns (uint256) {
        uint256 parking_cost = 0;
        uint256 prev_timestamp = session.start_datetime;
        //SessionMeterLog memory last_log = session_logs[session_id][session.session_log_counter];

        // Проходим по всем логам сессии
        for (uint k = 0; k <= session.session_log_counter; k++) {
            ISessions.SessionMeterLog memory log = _Sessions().getSessionLog(session_id,k);
            
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
        ISessions.Session memory session,
        ISessions.SessionMeterLog memory final_log,
        uint256 total_duration
    ) internal view returns (bool) {
        require(total_duration > 0, "Invalid session duration");
        
        // Проверяем корректность ограничений мощности
        if (restrictions.min_power > 0 && restrictions.max_power > 0) {
            require(restrictions.min_power <= restrictions.max_power, "Invalid power range");
        }
        
        // Проверяем все логи сессии на соответствие ограничениям времени и мощности
        for (uint i = 0; i <= session.session_log_counter-1; i++) {
            ISessions.SessionMeterLog memory log = _Sessions().getSessionLog(session.uid,i);
            
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
     * @notice Retrieves Charging Data Record
     * @param session_id Session ID to query
     * @return cdr Complete CDR data
     */
    function getCDR(uint256 session_id) external view returns(CDR memory, CDRElement[] memory) {
        return (cdrs[session_id], cdrElements[session_id]);
    }
}


