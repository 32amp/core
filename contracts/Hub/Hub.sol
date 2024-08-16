// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./IHub.sol";
import "hardhat/console.sol";

contract Hub is IHub, Initializable, OwnableUpgradeable {
    
    mapping (uint256 => IHub.Member) partners;
    mapping (bytes2 => mapping(bytes3 => uint256) ) unique_idex;
    mapping (address => uint256) owner_address_to_id;
    mapping (uint256 => mapping(string => address)) modules;
    mapping (uint256 => string[]) modules_list;
    mapping (string => bool) avaliable_modules;
    uint256 counter;

    string version;
    
    event Test(bytes calculated_hash, bytes _secret_key, bytes secret_key);

    function initialize() public initializer {
        version = "1.0";
        avaliable_modules["User"] = true;
        avaliable_modules["UserGroups"] = true;
        avaliable_modules["UserAccess"] = true;
        avaliable_modules["Location"] = true;
        avaliable_modules["EVSE"] = true;
        avaliable_modules["Connector"] = true;
        __Ownable_init(msg.sender);
    }


    function addPartner(bytes memory name, bytes2 country_code, bytes3 party_id, address owner_address) external onlyOwner returns(uint256) {

        if(name.length < 3)
            revert("name_length_more_than_3");

        if(unique_idex[country_code][party_id] > 0){
            revert("already_exist");
        }

        counter++;

        IHub.Member memory partnerData;
        partnerData.id = counter;
        partnerData.country_code = country_code;
        partnerData.party_id = party_id;
        partnerData.status = IHub.ConnectionStatus.PLANNED;
        partnerData.owner_address = owner_address;
        partnerData.last_updated = block.timestamp;
        
        owner_address_to_id[partnerData.owner_address] = counter;

        partners[counter] = partnerData;
        unique_idex[country_code][party_id] = counter;

        emit AddPartner(counter, country_code, party_id, owner_address);
        return counter;
    }

    function addModule(string memory name, address contractAddress) external {
        uint256 partner_id = owner_address_to_id[msg.sender];

        if(partner_id == 0)
            revert("access_denied");

        if(avaliable_modules[name] == false)
            revert("module_name_incorrect");

        modules[partner_id][name] = contractAddress;
        modules_list[partner_id].push(name);        
    }

    function changeModuleAddress(string memory name, address contractAddress)  external {
        uint256 partner_id = owner_address_to_id[msg.sender];

        if(partner_id == 0)
            revert("access_denied");
        
        if(avaliable_modules[name] == false)
            revert("module_name_incorrect");
        
        modules[partner_id][name] = contractAddress;        
    }

    function getModule(string memory name, uint256 partner_id)  external view returns (address) {
        return modules[partner_id][name];
    }

    function checkModuleExist(string memory name, uint256 partner_id)  external view {
        if(modules[partner_id][name] == address(0))
            revert("module_not_found");
    }

    function getPartnerModules(uint256 partner_id) external view returns (string[] memory){
        return modules_list[partner_id];
    }

    function _updateStatus(uint256 id, IHub.ConnectionStatus status) internal {
        partners[id].status = status;
    }

    function _updateRole(uint256 id, IHub.Roles[] memory role) internal {
        partners[id].role = role;
    }

    function getPartners() external view returns(IHub.Member[] memory){
        
        IHub.Member[] memory ret = new IHub.Member[](counter);

        for (uint i = 1; i <= counter; i++) {
            ret[i-1] = partners[i];
        }

        return ret;
    }

    function me() external view returns(IHub.Member memory){
        return this.getPartnerByAddress(msg.sender);
    }

    function getPartnerByAddress(address partner_address) external view returns(IHub.Member memory){
        return partners[owner_address_to_id[partner_address]];
    }

    function getPartnerIdByAddress(address partner_address) external view returns(uint256){
        return owner_address_to_id[partner_address];
    }

    function getPartner(uint256 partner_id) external view returns(IHub.Member memory){
        return partners[partner_id];
    }
    function getPartnerName(uint256 partner_id) external view returns(bytes32){
        return partners[partner_id].name;
    }

    function getPartnerPartyId(uint256 partner_id) external view returns(bytes3){
        return partners[partner_id].party_id;
    }

    function getPartnerCountryCode(uint256 partner_id) external view returns(bytes2){
        return partners[partner_id].country_code;
    }


}