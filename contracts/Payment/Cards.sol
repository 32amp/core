// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../Hub/IHub.sol";
import "../User/IUserAccess.sol";
import "../User/IUser.sol";
import "./ICards.sol";

/**
 * @title Cards Management Contract
 * @notice Handles user payment cards and autopay settings
 * @dev Manages card storage, autopay configurations, and card-related operations
 * @custom:warning Requires proper initialization via Hub contract
 */
contract Cards is ICards, Initializable {
    // State variables documentation
    /// @notice Hub contract reference
    address hubContract;
    
    /// @notice Associated partner ID
    uint256 partner_id;
    
    /// @dev Maximum number of cards allowed per user
    uint256 max_user_cards;

    // Storage mappings documentation
    /// @dev User card storage
    mapping(address => Card[]) cards;
    
    /// @dev User autopay settings
    mapping(address => AutopaySettings) autopay_settings;
    
    /// @dev Card addition request IDs
    mapping(address => uint256) add_card_request_id;
    
    /// @dev Write-off request IDs
    mapping(address => uint256) write_off_request_id;

    /**
     * @notice Initializes contract with Hub connection
     * @param _partner_id Partner ID from Hub registry
     * @param _hubContract Address of Hub contract
     * @custom:init Called once during proxy deployment
     */
    function initialize(uint256 _partner_id, address _hubContract) public initializer {
        hubContract = _hubContract;
        partner_id = _partner_id;
        max_user_cards = 5;
    }

    /// @dev Returns UserAccess module interface
    function _UserAccess() private view returns(IUserAccess) {
        return IUserAccess(IHub(hubContract).getModule("UserAccess", partner_id));
    }

    /// @dev Returns User module interface
    function _User() private view returns(IUser) {
        return IUser(IHub(hubContract).getModule("User", partner_id));
    }    

    /// @notice Returns current contract version
    function getVersion() external pure returns(string memory){
        return "1.0";
    }

    /// @notice Access control modifier requiring FOURTH level privileges
    modifier onlyAdmin(){
        _UserAccess().checkAccessModule(msg.sender, "Cards", uint(IUserAccess.AccessLevel.FOURTH));
        _;
    }

    /// @notice Access control modifier requiring for check user exist
    modifier onlyUser() {
        _User().exist(msg.sender);
        _;
    }

    
    /**
     * @notice Initiates a card addition request
     * @custom:reverts "MaximumOfObject:Cards" if user has reached card limit
     * @custom:emits AddCardRequest On successful request initiation
     */
    function addCardRequest() onlyUser() external {
        
        if(max_user_cards == cards[msg.sender].length)
            revert MaximumOfObject("Cards", max_user_cards);

        add_card_request_id[msg.sender]++;
        
        emit AddCardRequest(msg.sender, add_card_request_id[msg.sender]);
    }

    /**
     * @notice Responds to a card addition request
     * @param account User address
     * @param request_id Request ID
     * @param status Response status
     * @param message Response message
     * @param payment_endpoint Payment endpoint URL
     * @custom:reverts "AccessDeniedLevel:Four" if unauthorized
     * @custom:emits AddCardResponse On response submission
     */
    function addCardResponse(address account, uint256 request_id, bool status, string calldata message, string calldata payment_endpoint) onlyAdmin() external {
        emit AddCardResponse(account, request_id, status, message, payment_endpoint);
    }

    /**
     * @notice Adds a new card for a user
     * @param account User address
     * @param card Card data structure
     * @custom:reverts "AccessDeniedLevel:Four" if unauthorized
     * @custom:emits AddCardSuccess On successful card addition
     */
    function addCard(address account, uint256 request_id, Card calldata card) onlyAdmin() external {

        if(cards[account].length > 0)
            for (uint i = 0; i < cards[account].length; i++) {
                cards[account][i].is_primary = false;
            }

        cards[account].push(card);
        
        emit AddCardSuccess(account, request_id, cards[account].length);
    }

    /**
     * @notice Configures autopay settings for a user
     * @param amount Autopay amount
     * @param monthly_limit Monthly spending limit
     * @param threshold Balance threshold for autopay
     */    
    function setAutoPaySettings(uint256 amount, uint256 monthly_limit, uint256 threshold) onlyUser() external {
        autopay_settings[msg.sender].amount = amount;
        autopay_settings[msg.sender].monthly_limit = monthly_limit;
        autopay_settings[msg.sender].threshold = threshold;
        autopay_settings[msg.sender].is_active = true;
    }

    
    /**
     * @notice Disables autopay for a user
     */    
    function disableAutoPay() onlyUser() external {
        autopay_settings[msg.sender].is_active = false;
    }

    
    /**
     * @notice Removes a card by index
     * @param _index Card index to remove
     * @custom:reverts "ObjectNotFound:Card" if invalid index
     */    
    function removeCard(uint _index) onlyUser() external {


        if (_index >= cards[msg.sender].length) {
            revert ObjectNotFound("Card", _index);
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

    /**
     * @notice Initiates a write-off request
     * @param amount Write-off amount
     * @custom:reverts "ObjectNotFound:Card" if user has no cards
     * @custom:emits WriteOffRequest On successful request initiation
     */    
    function writeOffRequest(string calldata amount) onlyUser() external {
        
        if(cards[msg.sender].length == 0)
            revert ObjectNotFound("Card", 0);

        write_off_request_id[msg.sender]++;

        string memory card_id = _getPrimaryCard(msg.sender);

        emit WriteOffRequest(msg.sender, write_off_request_id[msg.sender], card_id, amount);
    }

    /**
     * @notice Responds to a write-off request
     * @param account User address
     * @param request_id Request ID
     * @param card_id Card ID used for write-off
     * @param error_code Response code from bank
     * @param status Response status
     * @param message Response message
     * @param amount Write-off amount
     * @custom:reverts "AccessDeniedLevel:Four" if unauthorized
     * @custom:emits WriteOffResponse On response submission
     */
    function writeOffResponse(address account, uint256 request_id, string calldata card_id, uint256 error_code, bool status, string calldata message, string calldata amount ) onlyAdmin()  external {
        emit WriteOffResponse(account, request_id, card_id, error_code, status, message, amount);
    }

    /**
     * @dev Retrieves the primary card index for a user
     * @param account User address
     * @return uint256 Index of the primary card
     */    
    function _getPrimaryCard(address account) internal view returns(string memory){
        for (uint i = 0; i < cards[account].length; i++) {
            
            if(cards[account][i].is_primary){
                return cards[account][i].card_id;
            }
        }
        return "";
    }

    /**
     * @notice Retrieves user cards
     * @param account User address
     * @return Card[] Array of user cards
     */    
    function getCards(address account) external view returns(Card[] memory){
        return cards[account];
    }

    /**
     * @notice Retrieves user autopay settings
     * @param account User address
     * @return AutopaySettings Autopay configuration
     */    
    function getAutoPaymentSettings(address account) external view returns(AutopaySettings memory){
        return autopay_settings[account];
    }
}