// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../Hub/IHub.sol";
import "../User/IUserAccess.sol";
import "../User/IUser.sol";
import "./ICards.sol";
import "../Utils.sol";

/**
 * @title Cards Management Contract
 * @notice Handles user payment cards and autopay settings
 * @dev Manages card storage, autopay configurations, and card-related operations
 * @custom:warning Requires proper initialization via Hub contract
 */
contract Cards is ICards, Initializable {
    // State variables documentation
    /// @notice Reference to the Hub contract
    address hubContract;
    
    /// @notice Partner ID associated with this contract
    uint256 partner_id;
    
    /// @dev Maximum number of cards allowed per user
    uint256 max_user_cards;

    // Storage mappings documentation
    /// @dev Mapping of user addresses to their cards
    mapping(address => Card[]) cards;
    
    /// @dev Mapping of user addresses to their autopay settings
    mapping(address => AutopaySettings) autopay_settings;
    
    /// @dev Mapping of user addresses to their add card request IDs
    mapping(address => uint256) add_card_request_id;
    
    /// @dev Mapping of user addresses to their write-off request IDs
    mapping(address => uint256) write_off_request_id;

    using Utils for string;

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

    /**
     * @dev Returns the UserAccess module interface for the current partner
     * @return IUserAccess interface instance
     */
    function _UserAccess() private view returns(IUserAccess) {
        return IUserAccess(IHub(hubContract).getModule("UserAccess", partner_id));
    }

    /**
     * @dev Returns the User module interface for the current partner
     * @return IUser interface instance
     */
    function _User() private view returns(IUser) {
        return IUser(IHub(hubContract).getModule("User", partner_id));
    }    

    /// @notice Returns current contract version
    function getVersion() external pure returns(string memory){
        return "1.1";
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
        if (!message.isEncrypted()) revert ParamNotEncrypted("message");
        if (!payment_endpoint.isEncrypted()) revert ParamNotEncrypted("payment_endpoint");
        emit AddCardResponse(account, request_id, status, message, payment_endpoint);
    }

    /**
     * @notice Adds a new card for a user
     * @param account User address
     * @param card CardInfo data structure
     * @custom:reverts "AccessDeniedLevel:Four" if unauthorized
     * @custom:emits AddCardSuccess On successful card addition
     */
    function addCard(address account, uint256 request_id, CardInfo calldata card) onlyAdmin() external {

        if (!card.rebill_id.isEncrypted()) revert ParamNotEncrypted("card.rebill_id");
        if (!card.provider.isEncrypted()) revert ParamNotEncrypted("card.provider");
        if (!card.card_type.isEncrypted()) revert ParamNotEncrypted("card.card_type");
        if (!card.expire_year.isEncrypted()) revert ParamNotEncrypted("card.expire_year");
        if (!card.expire_month.isEncrypted()) revert ParamNotEncrypted("card.expire_month");
        if (!card.first6.isEncrypted()) revert ParamNotEncrypted("card.first6");
        if (!card.last4.isEncrypted()) revert ParamNotEncrypted("card.last4");

        bytes32 id = keccak256(abi.encode(card));

        if(_checkCardExist(account,id))
            revert AlreadyExist("Card");

        if(cards[account].length > 0)
            for (uint i = 0; i < cards[account].length; i++) {
                cards[account][i].is_primary = false;
            }

        Card memory newcard;

        newcard.id = id;
        newcard.card = card;
        newcard.is_primary = true;

        cards[account].push(newcard);
        
        emit AddCardSuccess(account, request_id, id);
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
     * @param card_id Card id to remove
     * @custom:reverts "ObjectNotFound:Card" if invalid index
     */    
    function removeCard(bytes32 card_id) onlyUser() external {


        uint256 _index = 999;

        for (uint i = 0; i < cards[msg.sender].length; i++) {
            if(cards[msg.sender][i].id == card_id){
                _index = i;
                break;
            }
            
        }


        if (_index == 999) {
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
        
        if (!amount.isEncrypted()) revert ParamNotEncrypted("amount");

        if(cards[msg.sender].length == 0)
            revert ObjectNotFound("Card", 0);

        write_off_request_id[msg.sender]++;

        Card memory card = getPrimaryCard(msg.sender);

        emit WriteOffRequest(msg.sender, write_off_request_id[msg.sender], card.id, amount);
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
    function writeOffResponse(address account, uint256 request_id, bytes32 card_id, uint256 error_code, bool status, string calldata message, string calldata amount ) onlyAdmin()  external {
        if (!message.isEncrypted()) revert ParamNotEncrypted("message");
        if (!amount.isEncrypted()) revert ParamNotEncrypted("amount");
        emit WriteOffResponse(account, request_id, card_id, error_code, status, message, amount);
    }

    /**
     * @dev Retrieves the primary card for a user
     * @param account User address
     * @return Card of the primary card
     */    
    function getPrimaryCard(address account) public view returns(Card memory){
        for (uint i = 0; i < cards[account].length; i++) {
            
            if(cards[account][i].is_primary){
                return cards[account][i];
            }
        }

        Card memory empty;

        return empty; 
    }

    function setPrimaryCard(bytes32 card_id) onlyUser() external {

        uint256 _index = 999;

        for (uint i = 0; i < cards[msg.sender].length; i++) {
            if(cards[msg.sender][i].id == card_id){
                _index = i;
                break;
            }
            
        }


        if (_index == 999) {
            revert ObjectNotFound("Card", _index);
        }

        for (uint i = 0; i < cards[msg.sender].length; i++) {
            if(i == _index){
                cards[msg.sender][i].is_primary = true;
            }else{
                cards[msg.sender][i].is_primary = false;
            }
            
        }

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

    function _checkCardExist(address account, bytes32 card_id) internal view returns (bool) {
        for (uint i = 0; i < cards[account].length; i++) {
            Card memory card = cards[account][i];

            if(card.id == card_id){
                return true;
            }
        }
        return false;
    }
}