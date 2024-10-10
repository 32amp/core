// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;


import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../Hub/IHub.sol";
import "./ILocation.sol";
import "./IConnector.sol";
import "./IEVSE.sol";
import "../User/IUser.sol";
import "../User/IUserAccess.sol";


contract EVSE is IEVSE, Initializable {
    mapping (uint256 => EVSE)  evses;
    mapping (uint256 => EVSEMeta)  evses_meta;
    mapping (uint256 => EVSEStatus)  evses_status;
    mapping (uint256 => uint256)  evses_related_location;
    mapping (uint256 => uint256) evses_last_updated;
    mapping (uint256 => Image[]) evse_images;
    mapping (uint256 => uint256[]) evse_connectors;


    address hubContract;
    string version;
    uint256 partner_id;
    uint256 evsecounter;

    function initialize(uint256 _partner_id, address _hubContract) public initializer {
        hubContract = _hubContract;
        partner_id = _partner_id;
        version = "1.0";
    }

    function getVersion() external view returns (string memory) {
        return version;
    }

    function _UserAccess() private view returns(IUserAccess) {
        return IUserAccess(IHub(hubContract).getModule("UserAccess", partner_id));
    }

    function _User() private view returns(IUser) {
        return IUser(IHub(hubContract).getModule("User", partner_id));
    }

    function _Location() private view returns(ILocation) {
        return ILocation(IHub(hubContract).getModule("Location", partner_id));
    }

    function _Connector() private view returns(IConnector) {
        return IConnector(IHub(hubContract).getModule("Connector", partner_id));
    }


    function exist(uint256 id) external view returns(bool){
        if(evses_last_updated[id] != 0)
            return true;
        
        return false;
    }

    function add(bytes32 _token, EVSE calldata evse, uint256 location_id) external {
        
        uint256 user_id = _User().isLogin(_token);

        uint access_level = _UserAccess().getModuleAccessLevel("EVSE", user_id);

        if(access_level < uint(IUserAccess.AccessLevel.FOURTH)){
            revert("access_denied");
        }

        if(!_Location().exist(location_id))
            revert("location_does_not_exist");

        evsecounter++;

        evses[evsecounter] = evse;


        
        evses_status[evsecounter] = EVSEStatus.Planned;
        evses_related_location[evsecounter] = location_id;

        _UserAccess().setAccessLevelToModuleObject(_token,bytes32(evsecounter),user_id,"EVSE",IUserAccess.AccessLevel.FOURTH);

        _Location().addEVSE(_token, location_id, evsecounter);
        emit AddEVSE(evsecounter, partner_id, user_id);        
        _updated(evsecounter);
    }

    function setMeta(bytes32 _token, uint256 id, EVSEMeta calldata meta) external {
        _UserAccess().checkAccess( "EVSE",bytes32(id), _token, uint(IUserAccess.AccessLevel.FOURTH));
        evses_meta[id] = meta;
        _updated(id);
    }


    function addImage(bytes32 _token, uint256 id, Image calldata image ) external {
        _UserAccess().checkAccess( "EVSE",bytes32(id), _token, uint(IUserAccess.AccessLevel.FOURTH));
        evse_images[id].push(image);
        _updated(id);
    }

    function removeImage(bytes32 _token, uint256 id, uint image_id) external {
        _UserAccess().checkAccess( "EVSE",bytes32(id), _token, uint(IUserAccess.AccessLevel.FOURTH));
        for (uint i = image_id; i < evse_images[id].length - 1; i++) {
            evse_images[id][i] = evse_images[id][i + 1];
        }
        evse_images[id].pop();
        _updated(id);
    }

    function setStatus(bytes32 _token, uint256 id, EVSEStatus status) external {
        _UserAccess().checkAccess( "EVSE",bytes32(id), _token, uint(IUserAccess.AccessLevel.FOURTH));
        

        if(evse_connectors[id].length == 0 && status == EVSEStatus.Available)
            revert("add_connectors_first");

        evses_status[id] = status;
    }

    function addConnector(bytes32 _token, uint256 evse_id,  uint256 connector_id ) external {


        _UserAccess().checkAccess( "EVSE",bytes32(evse_id), _token, uint(IUserAccess.AccessLevel.FOURTH));
        
        if(IHub(hubContract).getModule("Connector", partner_id) != msg.sender)
            if(!_Connector().exist(connector_id))
                revert("connector_does_not_exist");

        evse_connectors[evse_id].push(connector_id);
        _updated(evse_id);
    }


    function removeConnector(bytes32 _token, uint256 evse_id, uint connector_id) external {
        _UserAccess().checkAccess( "EVSE",bytes32(evse_id), _token, uint(IUserAccess.AccessLevel.FOURTH));
        
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
        evses_last_updated[id] = block.timestamp;
    }

}