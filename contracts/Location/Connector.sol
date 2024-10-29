// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../Hub/IHub.sol";
import "./IEVSE.sol";
import "./IConnector.sol";
import "../User/IAuth.sol";
import "../Tariff/ITariff.sol";
import "../User/IUserAccess.sol";


contract Connector is IConnector, Initializable {
    address hubContract;
    uint256 partner_id;
    uint256 connector_counter;
    mapping (uint256 => Connector)  connectors;
    mapping (uint256 => uint256) last_updated;
    mapping (uint256 => ConnectorStatus) connector_status;
    mapping (uint256 => uint256[]) connector_tariff;

    function initialize(uint256 _partner_id, address _hubContract) public initializer {
        hubContract = _hubContract;
        partner_id = _partner_id;
    }

    function getVersion() external pure returns(string memory){
        return "1.0";
    }

    modifier access(bytes32 _token, uint256 id) {
        _UserAccess().checkAccess( "Connector",bytes32(id), _token, uint(IUserAccess.AccessLevel.FOURTH));
        _;
    }

    function _UserAccess() private view returns(IUserAccess) {
        return IUserAccess(IHub(hubContract).getModule("UserAccess", partner_id));
    }

    function _Auth() private view returns(IAuth) {
        return IAuth(IHub(hubContract).getModule("Auth", partner_id));
    }


    function _EVSE() private view returns(IEVSE) {
        return IEVSE(IHub(hubContract).getModule("EVSE", partner_id));
    }


    function _Tariff() private view returns(ITariff) {
        return ITariff(IHub(hubContract).getModule("Tariff", partner_id));
    }

    function add(bytes32 _token, Connector memory connector, uint256 evse_id) external {
        
        uint256 user_id = _Auth().isLogin(_token);

        uint access_level = _UserAccess().getModuleAccessLevel("Connector", user_id);

        if(access_level < uint(IUserAccess.AccessLevel.FOURTH)){
            revert("access_denied");
        }

        if(!_EVSE().exist(evse_id))
            revert("evse_does_not_exist");

        connector_counter++;

        connectors[connector_counter] = connector;

        _EVSE().addConnector(_token, evse_id, connector_counter);

        _UserAccess().setAccessLevelToModuleObject(_token,bytes32(connector_counter),user_id,"Connector",IUserAccess.AccessLevel.FOURTH);

        emit AddConnector(connector_counter, partner_id, user_id);

        _updated(connector_counter);
    }


    function setTariffs(bytes32 _token, uint256 id, uint256[] calldata _tariffs) access(_token, id) external {
        for (uint i = 0; i < _tariffs.length; i++) {
            if(!_Tariff().exist(_tariffs[i]))
                revert("tarif_not_exist ");
        }
        connector_tariff[id] = _tariffs;
    }


    function get(uint256 id) external view returns (output memory) {
        output memory ret;

        ret.id = id;
        ret.connector = connectors[id];
        ret.last_updated = last_updated[id];
        ret.status = connector_status[id];


        if(connector_tariff[id].length > 0){
            ITariff.OutputLight[] memory tariffs = new ITariff.OutputLight[](connector_tariff[id].length);
            for (uint i = 0; i < connector_tariff[id].length; i++) {
                tariffs[i] = _Tariff().getLight(connector_tariff[id][i]);
            }
            ret.tariffs = tariffs;
        }
        

        return ret;
    }

    function exist(uint256 id) external view returns(bool){
        if(last_updated[id] != 0)
            return true;
        
        return false;
    }

    function _updated(uint256 id) internal {
        last_updated[id] = block.timestamp;
    }
}