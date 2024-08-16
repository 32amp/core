// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

interface IHub {

    enum Roles {
        None,
        CPO,
        EMSP,
        HUB,
        NSP,
        SCSP
    }

    enum Modules {
        None,
        Location,
        Users,
        ChargingProfiles,
        Commands,
        Credentials
    }

    enum ConnectionStatus {
        None,
        CONNECTED,
        OFFLINE,
        PLANNED,
        SUSPENDED
    }

    struct Member {
        uint256 id;
        bytes2 country_code;
        bytes3 party_id;
        bytes32 name;
        Roles[] role;
        ConnectionStatus status;
        address owner_address;
        uint256 last_updated;
    }

    event  AddPartner(uint256 id, bytes2 country_code, bytes3 party_id, address owner_address);

    function addPartner(bytes memory name,bytes2 country_code,bytes3 party_id, address owner_address) external returns (uint256);
    function addModule(string memory name, address contractAddress) external;
    function changeModuleAddress(string memory name, address contractAddress)  external;
    function getModule(string memory name, uint256 partner_id)  external view returns (address);
    function checkModuleExist(string memory name, uint256 partner_id)  external view;
    function getPartnerModules(uint256 partner_id) external view returns (string[] memory);
    function getPartners() external view returns(Member[] memory);
    function me() external view returns(Member memory);
    function getPartnerByAddress(address partner_address) external view returns(Member memory);
    function getPartnerIdByAddress(address partner_address) external view returns(uint256);
    function getPartner(uint256 partner_id) external view returns(Member memory);
    function getPartnerName(uint256 partner_id) external view returns(bytes32);
    function getPartnerPartyId(uint256 partner_id) external view returns(bytes3);
    function getPartnerCountryCode(uint256 partner_id) external view returns(bytes2);
}