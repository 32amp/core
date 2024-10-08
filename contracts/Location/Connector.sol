// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../Hub/IHub.sol";
import "./IEVSE.sol";
import "./IConnector.sol";
import "../User/IUser.sol";
import "../User/IUserAccess.sol";
import "./DataTypes.sol";


contract Connector is IConnector, Initializable {
    address hubContract;
    string version;
    uint256 partner_id;
    uint256 connector_counter;
    mapping (uint256 => DataTypesLocation.Connector)  connectors;
    mapping (uint256 => uint256) last_updated;
    mapping (uint256 => DataTypesLocation.ConnectorStatus) connector_status;
    mapping (uint256 => uint256[]) connector_tariff;

    function initialize(uint256 _partner_id, address _hubContract) public initializer {
        hubContract = _hubContract;
        partner_id = _partner_id;
        version = "1.0";
    }

    function getVersion() public view returns(string memory){
        return version;
    }

    function _UserAccess() private view returns(IUserAccess) {
        return IUserAccess(IHub(hubContract).getModule("UserAccess", partner_id));
    }

    function _User() private view returns(IUser) {
        return IUser(IHub(hubContract).getModule("User", partner_id));
    }


    function _EVSE() private view returns(IEVSE) {
        return IEVSE(IHub(hubContract).getModule("EVSE", partner_id));
    }

    function add(bytes32 _token, DataTypesLocation.Connector memory connector, uint256 evse_id) external {
        
        uint256 user_id = _User().isLogin(_token);

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

    // TODO: ADD set tariff

    function get(uint256 id) external view returns (output memory) {
        output memory ret;

        ret.id = id;
        ret.connector = connectors[id];
        ret.last_updated = last_updated[id];
        ret.status = connector_status[id];
        ret.tariffs = connector_tariff[id];

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