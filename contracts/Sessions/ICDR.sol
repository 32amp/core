// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;


import "../IBaseErrors.sol";
import "../DataTypes.sol";
import "../Tariff/ITariff.sol";

interface ICDR is IBaseErrors, DataTypes {

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
        SessionMeterLog prev_log;
        SessionMeterLog current_log;
    }

    struct CDRElement {
        ITariff.TariffDimensionType _type;
        uint256 total_duration;
        Price price;
    }

    error InvalidSessionDuration();

    function createCDR(uint256 session_id, Session calldata session, uint256 timestamp, uint256 meter_start) external;
    function updateCDR(uint256 session_id, SessionMeterLog calldata log, uint256 total_duration) external returns(CDR memory, CDRElement[] memory);
    function getCDR(uint256 session_id) external view returns(CDR memory, CDRElement[] memory);
}