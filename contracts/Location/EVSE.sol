// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;


import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../Hub/IHub.sol";
import "./ILocation.sol";
import "./IConnector.sol";
import "./IEVSE.sol";
import "../User/IUserAccess.sol";
import "../RevertCodes/IRevertCodes.sol";

contract EVSE is IEVSE, Initializable {
    mapping (uint256 => EVSE)  evses;
    mapping (uint256 => EVSEMeta)  evses_meta;
    mapping (uint256 => EVSEStatus)  evses_status;
    mapping (uint256 => uint256)  evses_related_location;
    mapping (uint256 => uint256) evses_last_updated;
    mapping (uint256 => Image[]) evse_images;
    mapping (uint256 => uint256[]) evse_connectors;


    address hubContract;
    uint256 partner_id;
    uint256 evsecounter;
    uint256 timestampCounter;

    function initialize(uint256 _partner_id, address _hubContract) public initializer {
        hubContract = _hubContract;
        partner_id = _partner_id;
    }

    function registerRevertCodes() external{
        _RevertCodes().registerRevertCode("EVSE", "access_denied", "Access denied, you must have access to module EVSE not lower than four");
        _RevertCodes().registerRevertCode("EVSE", "location_does_not_exist", "Location does not exist");
        _RevertCodes().registerRevertCode("EVSE", "add_connectors_first", "You cannot set status Available because you dont have connectors");
        _RevertCodes().registerRevertCode("EVSE", "connector_does_not_exist", "Connector does not eist");
    }
    

    function getVersion() external pure returns(string memory){
        return "1.0";
    }

    function _UserAccess() private view returns(IUserAccess) {
        return IUserAccess(IHub(hubContract).getModule("UserAccess", partner_id));
    }

    function _Location() private view returns(ILocation) {
        return ILocation(IHub(hubContract).getModule("Location", partner_id));
    }

    function _Connector() private view returns(IConnector) {
        return IConnector(IHub(hubContract).getModule("Connector", partner_id));
    }


    function _RevertCodes() private view returns(IRevertCodes) {
        return IRevertCodes(IHub(hubContract).getModule("RevertCodes", partner_id));
    }

    function _panic(string memory code) private {
        _RevertCodes().panic("EVSE", code);
    }



    function exist(uint256 id) external view returns(bool){
        if(evses_last_updated[id] != 0)
            return true;
        
        return false;
    }

    modifier access(uint256 evse_id) {
        _UserAccess().checkAccess( msg.sender, "EVSE", bytes32(evse_id), uint(IUserAccess.AccessLevel.FOURTH));
        _;
    }

    function add(EVSE calldata evse, uint256 location_id) external {
        

        uint access_level = _UserAccess().getModuleAccessLevel("EVSE", msg.sender);

        if(access_level < uint(IUserAccess.AccessLevel.FOURTH)){
            _panic("access_denied");
        }

        if(!_Location().exist(location_id))
            _panic("location_does_not_exist");

        evsecounter++;

        evses[evsecounter] = evse;


        
        evses_status[evsecounter] = EVSEStatus.Planned;
        evses_related_location[evsecounter] = location_id;

        _UserAccess().setAccessLevelToModuleObject(bytes32(evsecounter), msg.sender, "EVSE", IUserAccess.AccessLevel.FOURTH);

        _Location().addEVSE(location_id, evsecounter);

        emit AddEVSE(evsecounter, partner_id, msg.sender);        
        _updated(evsecounter);
    }

    function setMeta(uint256 evse_id, EVSEMeta calldata meta) access(evse_id) external {
        evses_meta[evse_id] = meta;
        _updated(evse_id);
    }


    function addImage( uint256 evse_id, Image calldata image ) access(evse_id) external {
        evse_images[evse_id].push(image);
        _updated(evse_id);
    }

    function removeImage(uint256 evse_id, uint image_id) access(evse_id) external {

        for (uint i = image_id; i < evse_images[evse_id].length - 1; i++) {
            evse_images[evse_id][i] = evse_images[evse_id][i + 1];
        }

        evse_images[evse_id].pop();
        _updated(evse_id);
    }

    function setStatus( uint256 evse_id, EVSEStatus status) access(evse_id) external {
        
        if(evse_connectors[evse_id].length == 0 && status == EVSEStatus.Available)
            _panic("add_connectors_first");

        evses_status[evse_id] = status;
    }

    function addConnector(uint256 evse_id,  uint256 connector_id ) access(evse_id) external {
        
        if(IHub(hubContract).getModule("Connector", partner_id) != msg.sender)
            if(!_Connector().exist(connector_id))
                _panic("connector_does_not_exist");

        evse_connectors[evse_id].push(connector_id);
        _updated(evse_id);
    }


    function removeConnector(uint256 evse_id, uint connector_id) access(evse_id) external {
        
        for (uint i = connector_id; i < evse_connectors[evse_id].length - 1; i++) {
            evse_connectors[evse_id][i] = evse_connectors[evse_id][i + 1];
        }

        evse_connectors[evse_id].pop();
        _updated(evse_id);
    }




    function get(uint256 id) external view returns(outEVSE memory){
        outEVSE memory ret;

        ret.evse = evses[id];
        ret.meta = evses_meta[id];
        ret.evses_status = evses_status[id];
        ret.last_updated = evses_last_updated[id];
        ret.location_id = evses_related_location[id];
        ret.images = evse_images[id];

        if(evse_connectors[id].length > 0){
            IConnector.output[] memory connectors = new IConnector.output[](evse_connectors[id].length);

            for (uint i = 0; i < evse_connectors[id].length; i++) {
                connectors[i] = _Connector().get(evse_connectors[id][i]);
            }
            ret.connectors = connectors;
        }


        return ret;
    }

    function _updated(uint256 id) internal {
        evses_last_updated[id] = block.timestamp+timestampCounter;

        timestampCounter++;

        if(timestampCounter == 20)
            timestampCounter = 0;
    }

}