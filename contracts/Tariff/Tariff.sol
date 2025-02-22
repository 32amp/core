// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../Hub/IHub.sol";
import "./ITariff.sol";
import "../User/IUserAccess.sol";
import "../Services/ICurrencies.sol";
import "../RevertCodes/IRevertCodes.sol";

contract Tariff is ITariff, Initializable {
    address hubContract;
    uint256 partner_id;
    uint256 counter;


    mapping (uint256 => uint256) last_updated;
    mapping (uint256 => Tariff) tariffs;
    mapping (uint256 => Price) min_price;
    mapping (uint256 => Price) max_price;
    mapping (uint256 => uint256) start_date_time;
    mapping (uint256 => uint256) end_date_time;
    mapping (uint256 => EnergyMix) energy_mix;
    mapping (uint256 => bytes2) country_code;
    mapping (uint256 => bytes3) party_id;



    function initialize(uint256 _partner_id, address _hubContract) public initializer {
        hubContract = _hubContract;
        partner_id = _partner_id;
    }

    function registerRevertCodes() external {
        _RevertCodes().registerRevertCode("Tariff", "access_denied", "Access denied, you must have access to module Location not lower than four");
        _RevertCodes().registerRevertCode("Tariff", "currency_does_not_exist", "Currency does not exist");
    }

    function getVersion() external pure returns(string memory){
        return "1.0";
    }

    function exist(uint256 id) external view returns(bool){
        if(last_updated[id] != 0)
            return true;
    
        return false;
    }

    modifier access(uint256 id) {
        _UserAccess().checkAccess( msg.sender, "Tariff", bytes32(id), uint(IUserAccess.AccessLevel.FOURTH));
        _;
    }

    function _updated(uint256 id) internal {
        last_updated[id] = block.timestamp;
    }

    function _UserAccess() private view returns(IUserAccess) {
        return IUserAccess(IHub(hubContract).getModule("UserAccess", partner_id));
    }


    function _Currencies() private view returns(ICurrencies) {
        return ICurrencies(IHub(hubContract).getService("Currencies"));
    }

    function _RevertCodes() private view returns(IRevertCodes) {
        return IRevertCodes(IHub(hubContract).getModule("RevertCodes", partner_id));
    }

    function _panic(string memory code) private {
        _RevertCodes().panic("Tariff", code);
    }


    function add(Tariff calldata tariff) external {

        uint access_level = _UserAccess().getModuleAccessLevel("Tariff", msg.sender);

        if(access_level < uint(IUserAccess.AccessLevel.FOURTH)){
            _panic("access_denied");
        }

        if(!_Currencies().exist(tariff.currency))
            _panic("currency_does_not_exist");

        counter++;
        tariffs[counter] = tariff;
        country_code[counter] = IHub(hubContract).getPartnerCountryCode(partner_id);
        party_id[counter] = IHub(hubContract).getPartnerPartyId(partner_id);

        _updated(counter);

        emit AddTariff(counter, partner_id, msg.sender);

        _UserAccess().setAccessLevelToModuleObject(bytes32(counter),msg.sender,"Tariff",IUserAccess.AccessLevel.FOURTH);

    }

    

    function setMinPrice(uint256 id, Price calldata _min_price) access(id) external{
        min_price[id] = _min_price;
    }
    
    function setMaxPrice(uint256 id, Price calldata _max_price) access(id) external{
        max_price[id] = _max_price;
    }

    function setStartDateTime(uint256 id, uint256 _start_date_time) access(id) external {
        start_date_time[id] = _start_date_time;
    }

    function setEndDateTime(uint256 id, uint256 _end_date_time) access(id) external {
        end_date_time[id] = _end_date_time;
    }

    function setEnergyMix(uint256 id, EnergyMix calldata _energy_mix ) access(id) external {
        energy_mix[id] = _energy_mix;
    }

    function get(uint256 id) external view returns(Output memory) {
        Output memory ret;

        ret.country_code = country_code[id];
        ret.party_id = party_id[id];
        ret.id = id;
        ret.last_updated = last_updated[id];
        ret.tariff = tariffs[id];
        ret.min_price = min_price[id];
        ret.max_price = max_price[id];
        ret.start_date_time = start_date_time[id];
        ret.end_date_time = end_date_time[id];
        ret.energy_mix = energy_mix[id];

        return ret;
    }

    function getLight(uint256 id) external view returns(OutputLight memory) {
        OutputLight memory ret;

        ret.id = id;
        ret.tariff = tariffs[id];


        return ret;
    }
}
