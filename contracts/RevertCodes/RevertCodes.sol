// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./IRevertCodes.sol";
import "../Hub/IHub.sol";

contract RevertCodes is IRevertCodes, Initializable  {

    mapping(string => mapping(string => mapping(string => string))) revert_codes;
    mapping(string => mapping(string => bool)) exist_revert_codes;
    mapping(string => string[]) revert_codes_index;

    address hubContract;
    uint256 partner_id;


    modifier onlyModule(string memory module) {
        
        if(IHub(hubContract).getModule(module, partner_id) != msg.sender)
            revert("only_module_have_access");
        _;
    }


    modifier onlyPartner() {
        IHub.Member memory partner =  IHub(hubContract).getPartner(partner_id);
        if(partner.owner_address != msg.sender)
            revert("only_partner_have_access");
        _;
    }
    
    function initialize(uint256 _partner_id, address _hubContract) public initializer {
        hubContract = _hubContract;
        partner_id = _partner_id;
    }

    function getRevertMessages(string calldata module, string memory lang) external view returns(Output[] memory output ){

        if(revert_codes_index[module].length == 0)
            revert("messages_not_found");

        Output[] memory ret = new Output[](revert_codes_index[module].length);

        for (uint i = 0; i < revert_codes_index[module].length; i++) {
            bytes memory have_lang_message = bytes(revert_codes[module][revert_codes_index[module][i]][lang]);

            Output memory element;
            element.code = revert_codes_index[module][i];

            if(have_lang_message.length > 0){    
                element.message = revert_codes[module][revert_codes_index[module][i]][lang];
            }else{
                element.message = revert_codes[module][revert_codes_index[module][i]]["en"];
            }

            ret[i] = element;

        }

        return ret;
    }


    function updateLocale(string calldata module, UpdateLocales[] calldata update_locales) onlyPartner external {
        for (uint i = 0; i < update_locales.length; i++) {

            if(!exist_revert_codes[module][update_locales[i].code])
                revert("undefined_error_code");

            revert_codes[module][update_locales[i].code][update_locales[i].lang] = update_locales[i].message;
        }
    }


    function registerRevertCode(string memory module, string memory code, string memory message) onlyModule(module) external {

        if(!exist_revert_codes[module][code]){
            revert_codes_index[module].push(code);
            exist_revert_codes[module][code] = true;
            revert_codes[module][code]["en"] = message;
        }
    }

    function panic(string memory module,string memory code) external view {
        if(!exist_revert_codes[module][code])
            revert("undefined_error_code");

        revert(code);
    }
}