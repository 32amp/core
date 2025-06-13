// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./ICDR.sol";
import "../Tariff/ITariff.sol";
import "../Hub/IHub.sol";

import "hardhat/console.sol";


contract CDR is ICDR, Initializable {
    address hubContract;
    uint256 partner_id;

    mapping(uint256 => CDR) cdrs;
    mapping(uint256 => ITariff.Output) cdrTariff;
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
            last_log:log
        });
        

        cdrTariff[session_id] = _Tariff().getByVersion(session.tariff_id, session.tariff_version);
        cdrElements[session_id] = new CDRElement[](cdrTariff[session_id].tariff.tariff.elements.length);
        cdrs[session_id] = cdr;
    }


    function updateCDR(uint256 session_id, SessionMeterLog calldata log, uint256 total_duration, SessionStatus status) onlySessionContract external returns(CDR memory, CDRElement[] memory) {
        
        
        ITariff.Output storage tariff = cdrTariff[session_id];
        CDRElement[] storage elements = cdrElements[session_id];

        
        for (uint i = 0; i < tariff.tariff.tariff.elements.length; i++) {
            ITariff.TariffElement memory element = tariff.tariff.tariff.elements[i];
            
            
            
            if(elements[i].components.length == 0){
                elements[i].components = new CDRComponent[](element.price_components.length);
            }

            if (!_checkTariffRestrictions(element.restrictions,  log, total_duration)) {
                continue;
            }

            for (uint j = 0; j < element.price_components.length; j++) {
                ITariff.PriceComponent memory component = element.price_components[j];
                CDRComponent memory component_before_calc = elements[i].components[j];
                
                
                if(component.price == 0){
                    elements[i].components[j] =  CDRComponent({price:Price({excl_vat:0, incl_vat:0}), _type:component._type, total_duration:0});
                    continue;
                }

                if ( component._type == ITariff.TariffDimensionType.PARKING_TIME && elements[i].components[j].price.excl_vat == 0 && status == SessionStatus.FINISHING ) {
                    elements[i].components[j] = _calculateTimeCost(elements[i].components[j], session_id,  log, component);
                }else if (component._type == ITariff.TariffDimensionType.ENERGY) {
                    elements[i].components[j] = _calculateEnergyCost(elements[i].components[j], session_id, log, component);
                } else if (component._type == ITariff.TariffDimensionType.TIME) {
                    elements[i].components[j] = _calculateTimeCost(elements[i].components[j], session_id,  log, component);
                } else if (component._type == ITariff.TariffDimensionType.FLAT) {
                    if(elements[i].components[j].price.excl_vat == component.price){
                        continue;
                    }
                    elements[i].components[j] = _calculateFlatCost(component);
                    
                }
                
                if(elements[i].components[j].price.excl_vat > component_before_calc.price.excl_vat){
                    cdrs[session_id].total_cost.excl_vat += elements[i].components[j].price.excl_vat-component_before_calc.price.excl_vat;
                    cdrs[session_id].total_cost.incl_vat += elements[i].components[j].price.incl_vat-component_before_calc.price.incl_vat;
                }
            }
        }

        if(status == SessionStatus.FINISHING){
            cdrs[session_id].total_energy = log.meter_value;
            cdrs[session_id].end_datetime = log.timestamp;
        }

        cdrs[session_id].last_log = log;

        return (cdrs[session_id], cdrElements[session_id]);
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
    function getCDR(uint256 session_id) external view returns(CDR memory, CDRElement[] memory) {
        return (cdrs[session_id], cdrElements[session_id]);
    }
}


