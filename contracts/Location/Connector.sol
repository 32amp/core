// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../Hub/IHub.sol";
import "./IEVSE.sol";
import "./IConnector.sol";
import "../Tariff/ITariff.sol";
import "../User/IUserAccess.sol";
import "../RevertCodes/IRevertCodes.sol";

contract Connector is IConnector, Initializable {

    address hubContract;
    uint256 partner_id;
    uint256 connector_counter;

    mapping (uint256 => Connector)  connectors;
    mapping (uint256 => uint256) last_updated;
    mapping (uint256 => ConnectorStatus) connector_status;
    mapping (uint256 => uint256) connector_tariff;

    function initialize(uint256 _partner_id, address _hubContract) public initializer {
        hubContract = _hubContract;
        partner_id = _partner_id;
    }

    function registerRevertCodes() external {
        _RevertCodes().registerRevertCode("Connector", "access_denied_level_four", "Access denied, you must have access to module Connector not lower than four");
        _RevertCodes().registerRevertCode("Connector", "evse_does_not_exist", "EVSE does not exist");
        _RevertCodes().registerRevertCode("Connector", "tariff_does_not_exist", "EVSE does not exist");
    }

    function getVersion() external pure returns(string memory){
        return "1.0";
    }

    modifier access( uint256 id) {

        _UserAccess().checkAccess(msg.sender, "Connector", bytes32(id), uint(IUserAccess.AccessLevel.FOURTH));
        _;
    }

    function _UserAccess() private view returns(IUserAccess) {
        return IUserAccess(IHub(hubContract).getModule("UserAccess", partner_id));
    }

    function _EVSE() private view returns(IEVSE) {
        return IEVSE(IHub(hubContract).getModule("EVSE", partner_id));
    }


    function _Tariff() private view returns(ITariff) {
        return ITariff(IHub(hubContract).getModule("Tariff", partner_id));
    }

    function _RevertCodes() private view returns(IRevertCodes) {
        return IRevertCodes(IHub(hubContract).getModule("RevertCodes", partner_id));
    }

    function _panic(string memory code) private {
        _RevertCodes().panic("Connector", code);
    }

    function add( Connector memory connector, uint256 evse_id) external {
        
        uint access_level = _UserAccess().getModuleAccessLevel("Connector", msg.sender);

        if(access_level < uint(IUserAccess.AccessLevel.FOURTH)){
            _panic("access_denied_level_four");
        }

        if(!_EVSE().exist(evse_id))
            _panic("evse_does_not_exist");

        connector_counter++;

        connectors[connector_counter] = connector;

        _UserAccess().setAccessLevelToModuleObject(bytes32(connector_counter),msg.sender,"Connector",IUserAccess.AccessLevel.FOURTH);
        _EVSE().addConnector(evse_id, connector_counter);

/* 
        {
            (bool success, bytes memory data ) = IHub(hubContract).getModule("UserAccess", partner_id).delegatecall(
                abi.encodeWithSignature("setAccessLevelToModuleObject( bytes32, address, string, uint)", bytes32(connector_counter),msg.sender,"Connector",IUserAccess.AccessLevel.FOURTH)
            );
        }

        {
            (bool success, bytes memory data ) = IHub(hubContract).getModule("EVSE", partner_id).delegatecall(
                abi.encodeWithSignature("addConnector( uint256, uint256)",  evse_id, connector_counter)
            );
        } */
        

        emit AddConnector(connector_counter, partner_id, msg.sender);

        _updated(connector_counter);
    }


    function setTariffs( uint256 id, uint256  _tariff) access(id) external {

        if(!_Tariff().exist(_tariff))
            revert("tariff_does_not_exist");

        connector_tariff[id] = _tariff;
    }


    function get(uint256 id) external view returns (output memory) {
        output memory ret;

        ret.id = id;
        ret.connector = connectors[id];
        ret.last_updated = last_updated[id];
        ret.status = connector_status[id];


        if(connector_tariff[id] > 0){
            ret.tariff = _Tariff().getLight(connector_tariff[id]);
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