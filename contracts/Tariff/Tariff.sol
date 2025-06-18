// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../Hub/IHub.sol";
import "./ITariff.sol";
import "../User/IUserAccess.sol";

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
    mapping(uint256 => mapping( uint16 => Tariff )) tariffs;

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
     * @notice Adds a new tariff to the registry
     * @param tariff Tariff data structure to add
     * @custom:reverts AccessDenied If caller lacks FOURTH level access
     * @custom:reverts ObjectNotFound If referenced currency does not exist
     * @custom:emits AddTariff On successful tariff addition
     */
    function add(Tariff calldata tariff) external {

        uint access_level = _UserAccess().getModuleAccessLevel("Tariff", msg.sender);

        if(access_level < uint(IUserAccess.AccessLevel.FOURTH)){
            revert AccessDenied("Tariff");
        }

        counter++;

        current_tariff_version[counter] = 1;
        tariffs[counter][1] = tariff;

        _updated(counter);

        emit AddTariff(counter, msg.sender);

        _UserAccess().setAccessLevelToModuleObject(bytes32(counter),msg.sender,"Tariff",IUserAccess.AccessLevel.FOURTH);

    }

    function update(uint256 id, Tariff calldata tariff) access(id) external {
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
            elements:new CDRElement[](tariffs[session.tariff_id][session.tariff_version].elements.length)
        });
        
        cdrs[session_id] = cdr;
    }


    function updateCDR(uint256 session_id, SessionMeterLog calldata log, uint256 total_duration, SessionStatus status) onlySessionContract external returns(Price memory) {
        
        CDR storage cdr = cdrs[session_id];
        Tariff storage tariff = tariffs[cdrs[session_id].tariff_id][cdrs[session_id].tariff_version];


        
        for (uint i = 0; i < tariff.elements.length; i++) {
            ITariff.TariffElement memory element = tariff.elements[i];
            
            if(cdr.elements[i].components.length == 0){
                cdr.elements[i].components = new CDRComponent[](element.price_components.length);
            }

            bool check_restrictions = _checkTariffRestrictions(element.restrictions,  log, total_duration);

            if (!check_restrictions) {
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
            cdr.end_datetime = log.timestamp;
            if(cdr.total_cost.incl_vat < tariff.min_price.incl_vat){
                cdr.total_cost = tariff.min_price;
            }
    
            if(tariff.max_price.excl_vat > 0){
                if(cdr.total_cost.excl_vat > tariff.max_price.excl_vat){
                    cdr.total_cost = tariff.max_price;
                }
            }
        }


        cdr.last_log = log;

        if(cdr.total_cost.incl_vat < tariff.min_price.incl_vat){
            return tariff.min_price;
        }

        if(tariff.max_price.excl_vat > 0){
            if(cdr.total_cost.excl_vat > tariff.max_price.excl_vat){
                return tariff.max_price;
            }
        }


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
        uint256 interval_duration = log.timestamp - last_log.timestamp;
        uint256 energy_cost = element.price.excl_vat;
        uint256 prev_meter_value = last_log.meter_value;
        
        require(log.meter_value >= prev_meter_value, "Negative energy consumption");
        
        uint256 energy_consumed = log.meter_value - prev_meter_value;

        if (energy_consumed > 0 ) {
            uint256 cost_increment = energy_consumed  * (component.price/1e18);    
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
     * @dev Helper function for checking time in tariff period
     */
    function _isTimeInTariffPeriod(
        uint256 timestamp,
        ITariff.TariffRestrictions memory restrictions
    ) internal pure returns (bool) {

        require(timestamp > 0, "Invalid timestamp");
        
        (uint256 hour, uint256 minute) = _getHoursMinutes(timestamp);

        uint256 start_hour = restrictions.start_time_hour;
        uint256 start_minute = restrictions.start_time_minute;
        uint256 end_hour = restrictions.end_time_hour;
        uint256 end_minute = restrictions.end_time_minute;
        
        
        uint256 currentMinutes = hour * 60 + minute;
        uint256 startMinutes = start_hour * 60 + start_minute;
        uint256 endMinutes = end_hour * 60 + end_minute;
    

        if (startMinutes != 0 || endMinutes != 0) {
            if (endMinutes < startMinutes) {
                if (currentMinutes < startMinutes && currentMinutes > endMinutes) {
                    return false;
                }
            } else {
                if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
                    return false;
                }
            }
        }
        
        
        if (restrictions.day_of_week.length > 0) {
            // 1 = Monday, 7 = Sunday
            uint256 day_of_week = (timestamp / 86400 + 4) % 7;

            bool day_found = false;
            for (uint i = 0; i < restrictions.day_of_week.length; i++) {
                uint256 day = uint256(uint8(restrictions.day_of_week[i]));
                if (day == day_of_week) {
                    day_found = true;        
                    break;
                }
            }
            if (!day_found) {
                return false;
            }
        }
        
        
        if (restrictions.start_date > 0 && timestamp < restrictions.start_date) {
            return false;
        }
        if (restrictions.end_date > 0 && timestamp > restrictions.end_date) {
            return false;
        }
        
        return true;
    }

    function _getHoursMinutes(uint timestamp) internal pure returns (uint256 hour, uint256 minute) {
        uint256 totalMinutes = timestamp % 86400 / 60;
        hour = totalMinutes / 60;
        minute = totalMinutes % 60;
    }

    /**
     * @dev Helper function for checking tariff restrictions
     */
    function _checkTariffRestrictions(
        ITariff.TariffRestrictions memory restrictions,
        SessionMeterLog memory current_log,
        uint256 total_duration
    ) internal pure returns (bool) {

        if(
            restrictions.min_power == 0
            && restrictions.max_power == 0
            && restrictions.min_kwh == 0
            && restrictions.max_kwh == 0
            && restrictions.min_duration == 0
            && restrictions.max_duration == 0
            && restrictions.start_time_hour == 0
            && restrictions.end_time_hour == 0
            && restrictions.min_current == 0
            && restrictions.max_current == 0
            && restrictions.day_of_week.length == 0

        ){
            return true;
        }

        if(total_duration == 0){
            revert InvalidSessionDuration();
        }


        bool time_check = _isTimeInTariffPeriod(current_log.timestamp, restrictions);

        if (!time_check) {
            return false;
        }
        
        
        if (restrictions.min_power > 0 && current_log.power < restrictions.min_power) {
            return false;
        }
        if (restrictions.max_power > 0 && current_log.power > restrictions.max_power) {
            return false;
        }
        

        
        if (restrictions.min_kwh > 0 && current_log.meter_value < restrictions.min_kwh) {
            return false;
        }
        if (restrictions.max_kwh > 0 && current_log.meter_value > restrictions.max_kwh) {
            return false;
        }
        
        
        if (restrictions.min_duration > 0 && total_duration < restrictions.min_duration) {
            return false;
        }
        if (restrictions.max_duration > 0 && total_duration > restrictions.max_duration) {
            return false;
        }


        if (restrictions.min_current > 0 && current_log.current < restrictions.min_current) {
            return false;
        }
        if (restrictions.max_current > 0 && current_log.current > restrictions.max_current) {
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
