// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../Hub/IHub.sol";
import "../RevertCodes/IRevertCodes.sol";
import "../User/IAuth.sol";
import "../User/IUserAccess.sol";
import "./ICards.sol";

contract Cards is ICards, Initializable {

    address hubContract;
    uint256 partner_id;
    uint256 max_user_cards;

    mapping(uint256 => Card[]) cards;
    mapping(uint256 => AutopaySettings) autopay_settings;
    mapping(uint256 => uint256) add_card_request_id;
    mapping(uint256 => uint256) write_off_request_id;

    function initialize(uint256 _partner_id, address _hubContract) public initializer {
        hubContract = _hubContract;
        partner_id = _partner_id;
        max_user_cards = 5;
    }


    function _RevertCodes() private view returns(IRevertCodes) {
        return IRevertCodes(IHub(hubContract).getModule("RevertCodes", partner_id));
    }

    function _Auth() private view returns(IAuth) {
        return IAuth(IHub(hubContract).getModule("Auth", partner_id));
    }

    function _UserAccess() private view returns(IUserAccess) {
        return IUserAccess(IHub(hubContract).getModule("UserAccess", partner_id));
    }

    function registerRevertCodes() external {
        _RevertCodes().registerRevertCode("Cards", "access_denied_level_four", "Access denied, you must have access to module Cards not lower than four");
        _RevertCodes().registerRevertCode("Cards", "access_denied", "Access denied");
        _RevertCodes().registerRevertCode("Cards", "max_cards", "Maximum of cards is 5");
        _RevertCodes().registerRevertCode("Cards", "card_not_found", "Card not found");
 
    }

    function getVersion() external pure returns(string memory){
        return "1.0";
    }


    modifier onlyAdmin(bytes32 _token){
        uint256 user_id = _Auth().isLogin(_token);

        uint access_level = _UserAccess().getModuleAccessLevel("Cards", user_id);

        if(access_level < uint(IUserAccess.AccessLevel.FOURTH)){
            revert("access_denied_level_four");
        }

        _;
    }

    function addCardRequest(bytes32 _token) external {
        uint256 user_id = _Auth().isLogin(_token);
        
        if (user_id == 0) revert("access_denied");

        if(max_user_cards == cards[user_id].length)
            revert("max_cards");

        add_card_request_id[user_id]++;
        
        emit AddCardRequest(user_id, add_card_request_id[user_id], _token);
    }

    function addCardResponse(bytes32 _token, uint256 user_id, bool status, string memory message, string memory paymentEndpoint) onlyAdmin(_token) external {
        emit AddCardResponse(user_id, add_card_request_id[user_id], status, message, paymentEndpoint);
    }


    function addCard(bytes32 _token, uint256 user_id, Card memory card) onlyAdmin(_token) external {

        if(cards[user_id].length > 0)
            for (uint i = 0; i < cards[user_id].length; i++) {
                cards[user_id][i].is_primary = false;
            }

        cards[user_id].push(card);
        
        emit AddCardSuccess(user_id, cards[user_id].length);
    }

    function setAutoPaySettings(bytes32 _token, uint256 amount, uint256 monthly_limit, uint256 threshold) external {
        uint256 user_id = _Auth().isLogin(_token);

        if (user_id == 0) revert("access_denied");

        autopay_settings[user_id].amount = amount;
        autopay_settings[user_id].monthly_limit = monthly_limit;
        autopay_settings[user_id].threshold = threshold;
        autopay_settings[user_id].is_active = true;
        
    }

    function disableAutoPay(bytes32 _token) external {
        uint256 user_id = _Auth().isLogin(_token);

        if (user_id == 0) revert("access_denied");

        autopay_settings[user_id].is_active = false;

    }

    function removeCard(bytes32 _token, uint _index) external {
        uint256 user_id = _Auth().isLogin(_token);

        if (user_id == 0) revert("access_denied");

        if (_index >= cards[user_id].length) {
            revert("card_not_found");
        }

        bool removedCardWasPrimary = false;

        if(cards[user_id][_index].is_primary)
            removedCardWasPrimary = true;
   
        for (uint i = _index; i < cards[user_id].length - 1; i++) {
            cards[user_id][i] = cards[user_id][i + 1];
        }

        cards[user_id].pop();

        if(removedCardWasPrimary && cards[user_id].length > 0)
            cards[user_id][0].is_primary = true;
    }

    function writeOffRequest(bytes32 _token, uint256 amount) external {
        uint256 user_id = _Auth().isLogin(_token);
        
        if (user_id == 0) revert("access_denied");

        if(cards[user_id].length == 0)
            revert("card_not_found");

        write_off_request_id[user_id]++;

        uint256 card_id = _getPrimaryCard(user_id);

        emit WriteOffRequest(user_id, write_off_request_id[user_id], card_id, amount);
    }

    function writeOffResponse(bytes32 _token, uint256 user_id, uint256 request_id, uint256 card_id, bool status, string memory message, uint256 amount ) onlyAdmin(_token)  external {
        emit WriteOffResponse(user_id, request_id, card_id, status, message, amount);
    }

    function _getPrimaryCard(uint256 user_id) internal returns(uint256){
        for (uint i = 0; i < cards[user_id].length; i++) {
            
            if(cards[user_id][i].is_primary){
                return i;
            }
        }
        return 0;
    }

    function getCards(uint256 user_id) external view returns(Card[] memory){
        return cards[user_id];
    }

    function getAutoPaymentSettings(uint256 user_id) external view returns(AutopaySettings memory){
        return autopay_settings[user_id];
    }
}