// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../Hub/IHub.sol";
import "./ITariff.sol";
import "../User/IUser.sol";
import "../User/IUserAccess.sol";
import "../Services/ICurrencies.sol";

contract Tariff is ITariff, Initializable {
    address hubContract;
    string version;
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
        version = "1.0";
    }

    function getVersion() public view returns(string memory){
        return version;
    }

    function exist(uint256 id) external view returns(bool){
        if(last_updated[id] != 0)
            return true;
    
        return false;
    }

    modifier access(bytes32 _token, uint256 id) {
        _UserAccess().checkAccess( "Tariff",bytes32(id), _token, uint(IUserAccess.AccessLevel.FOURTH));
        _;
    }

    function _updated(uint256 id) internal {
        last_updated[id] = block.timestamp;
    }

    function _UserAccess() private view returns(IUserAccess) {
        return IUserAccess(IHub(hubContract).getModule("UserAccess", partner_id));
    }

    function _User() private view returns(IUser) {
        return IUser(IHub(hubContract).getModule("User", partner_id));
    }

    function _Currencies() private view returns(ICurrencies) {
        return ICurrencies(IHub(hubContract).getService("Currencies"));
    }

    function add(bytes32 _token, Tariff calldata tariff) external {
        uint256 user_id = _User().isLogin(_token);

        uint access_level = _UserAccess().getModuleAccessLevel("Tariff", user_id);

        if(access_level < uint(IUserAccess.AccessLevel.FOURTH)){
            revert("access_denied");
        }

        if(!_Currencies().exist(tariff.currency))
            revert("currency_not_exist");

        counter++;
        tariffs[counter] = tariff;
        country_code[counter] = IHub(hubContract).getPartnerCountryCode(partner_id);
        party_id[counter] = IHub(hubContract).getPartnerPartyId(partner_id);

        _updated(counter);

        emit AddTariff(counter, partner_id, user_id);

        _UserAccess().setAccessLevelToModuleObject(_token,bytes32(counter),user_id,"Tariff",IUserAccess.AccessLevel.FOURTH);
    }

    

    function setMinPrice(bytes32 _token, uint256 id, Price calldata _min_price) access(_token,id) external{
        min_price[id] = _min_price;
    }
    
    function setMaxPrice(bytes32 _token, uint256 id, Price calldata _max_price) access(_token,id) external{
        max_price[id] = _max_price;
    }

    function setStartDateTime(bytes32 _token, uint256 id, uint256 _start_date_time) access(_token,id) external {
        start_date_time[id] = _start_date_time;
    }

    function setEndDateTime(bytes32 _token, uint256 id, uint256 _end_date_time) access(_token,id) external {
        end_date_time[id] = _end_date_time;
    }

    function setEnergyMix(bytes32 _token, uint256 id, EnergyMix calldata _energy_mix ) access(_token,id) external {
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
