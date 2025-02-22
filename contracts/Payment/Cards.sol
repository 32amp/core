// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../Hub/IHub.sol";
import "../RevertCodes/IRevertCodes.sol";
import "../User/IUserAccess.sol";
import "./ICards.sol";

contract Cards is ICards, Initializable {

    address hubContract;
    uint256 partner_id;
    uint256 max_user_cards;

    mapping(address => Card[]) cards;
    mapping(address => AutopaySettings) autopay_settings;
    mapping(address => uint256) add_card_request_id;
    mapping(address => uint256) write_off_request_id;

    function initialize(uint256 _partner_id, address _hubContract) public initializer {
        hubContract = _hubContract;
        partner_id = _partner_id;
        max_user_cards = 5;
    }


    function _RevertCodes() private view returns(IRevertCodes) {
        return IRevertCodes(IHub(hubContract).getModule("RevertCodes", partner_id));
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


    modifier onlyAdmin(){
        _UserAccess().checkAccessModule( msg.sender, "Cards",  uint(IUserAccess.AccessLevel.FOURTH));
        _;
    }

    // check user exist
    function addCardRequest() external {
        
        if(max_user_cards == cards[msg.sender].length)
            revert("max_cards");

        add_card_request_id[msg.sender]++;
        
        emit AddCardRequest(msg.sender, add_card_request_id[msg.sender]);
    }

    function addCardResponse(address user_address, uint256 request_id, bool status, string memory message, string memory paymentEndpoint) onlyAdmin() external {
        emit AddCardResponse(user_address, request_id, status, message, paymentEndpoint);
    }


    function addCard(address user_address, Card memory card) onlyAdmin() external {

        if(cards[user_address].length > 0)
            for (uint i = 0; i < cards[user_address].length; i++) {
                cards[user_address][i].is_primary = false;
            }

        cards[user_address].push(card);
        
        emit AddCardSuccess(user_address, cards[user_address].length);
    }

    // check user exist
    function setAutoPaySettings(uint256 amount, uint256 monthly_limit, uint256 threshold) external {
        autopay_settings[msg.sender].amount = amount;
        autopay_settings[msg.sender].monthly_limit = monthly_limit;
        autopay_settings[msg.sender].threshold = threshold;
        autopay_settings[msg.sender].is_active = true;
    }

    // check user exist
    function disableAutoPay() external {
        autopay_settings[msg.sender].is_active = false;
    }

    // check user exist
    function removeCard(uint _index) external {


        if (_index >= cards[msg.sender].length) {
            revert("card_not_found");
        }

        bool removedCardWasPrimary = false;

        if(cards[msg.sender][_index].is_primary)
            removedCardWasPrimary = true;
   
        for (uint i = _index; i < cards[msg.sender].length - 1; i++) {
            cards[msg.sender][i] = cards[msg.sender][i + 1];
        }

        cards[msg.sender].pop();

        if(removedCardWasPrimary && cards[msg.sender].length > 0)
            cards[msg.sender][0].is_primary = true;
    }

    // check user exist
    function writeOffRequest(string memory amount) external {
        
        if(cards[msg.sender].length == 0)
            revert("card_not_found");

        write_off_request_id[msg.sender]++;

        uint256 card_id = _getPrimaryCard(msg.sender);

        emit WriteOffRequest(msg.sender, write_off_request_id[msg.sender], card_id, amount);
    }

    function writeOffResponse(address user_address, uint256 request_id, uint256 card_id, bool status, string memory message, string memory amount ) onlyAdmin()  external {
        emit WriteOffResponse(user_address, request_id, card_id, status, message, amount);
    }

    function _getPrimaryCard(address user_address) internal view returns(uint256){
        for (uint i = 0; i < cards[user_address].length; i++) {
            
            if(cards[user_address][i].is_primary){
                return i;
            }
        }
        return 0;
    }

    function getCards(address user_address) external view returns(Card[] memory){
        return cards[user_address];
    }

    function getAutoPaymentSettings(address user_address) external view returns(AutopaySettings memory){
        return autopay_settings[user_address];
    }
}