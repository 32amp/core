// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../Services/ICurrencies.sol";
import "../Hub/IHub.sol";
import "./IBalance.sol";
import "../User/IUserAccess.sol";
import "../User/IUser.sol";

/**
 * @title Balance Management Contract
 * @notice Handles token balances and transfers within the ecosystem
 * @dev Implements ERC-20-like functionality with custom access control
 * @custom:warning Requires proper initialization via Hub contract
 */
contract Balance is Initializable, IBalance {
    // State variables documentation
    /// @notice Hub contract reference
    address hubContract;
    
    /// @notice Currencies service contract address
    address currenciesServiceAddress;
    
    /// @notice Associated partner ID
    uint256 partner_id;
    
    /// @dev Total token supply
    uint256 _totalSupply;
    
    /// @dev Currency identifier
    uint256 _currency;
    
    // Storage mappings documentation
    /// @dev Account balances storage
    mapping(address => uint256) _balances;
    mapping(address => uint256) _debts;
    

    /**
     * @notice Initializes contract with currency configuration
     * @param _partner_id Partner ID from Hub registry
     * @param _hubContract Address of Hub contract
     * @param __currency Currency identifier
     * @custom:reverts "ObjectNotFound:Currency" if invalid currency ID
     * @custom:init Called once during proxy deployment
     */
    function initialize(uint256 _partner_id, address _hubContract, uint256 __currency) public initializer {
        hubContract = _hubContract;
        partner_id = _partner_id;
        currenciesServiceAddress = IHub(_hubContract).getService("Currencies");

        if(ICurrencies(currenciesServiceAddress).exist(__currency) == false){
            revert ObjectNotFound("Currency", __currency);
        }

        _currency = __currency;
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
        uint access_level = _UserAccess().getModuleAccessLevel("Balance", msg.sender);

        if(access_level < uint(IUserAccess.AccessLevel.FOURTH)){
            revert AccessDeniedLevel("Balance", uint8(IUserAccess.AccessLevel.FOURTH));
        }

        _;
    }

    /// @notice Access control modifier requiring for check user exist
    modifier onlyUser() {
        _User().exist(msg.sender);
        _;
    }    

    /**
     * @notice Gets associated currency ID
     * @return uint256 Currency identifier
     */
    function getCurrency() external view returns (uint256){
        return _currency;
    }

    /**
     * @notice Creates new tokens
     * @param account Recipient address
     * @param amount Amount to mint
     * @custom:reverts "InvalidReceiver" for zero address
     * @custom:reverts "AccessDeniedLevel:Four" if unauthorized
     */    
    function mint(address account, uint256 amount) external onlyAdmin() {
        _mint(account, amount);
    }

    /**
     * @notice Destroys existing tokens
     * @param account Holder address
     * @param amount Amount to burn
     * @custom:reverts "InvalidSender" for zero address
     * @custom:reverts "AccessDeniedLevel:Four" if unauthorized
     */    
    function burn(address account, uint256 amount) external onlyAdmin() {
        _burn(account, amount);
    }

    /**
     * @notice Gets total token supply
     * @return uint256 Current total supply
     */    
    function totalSupply() onlyAdmin() external view returns (uint256){
        return _totalSupply;
    }

    /**
     * @notice Gets account balance
     * @param account User address
     * @return uint256 Account balance
     */    
    function balanceOf(address account) onlyUser() external view returns (uint256){
        return _balances[account];
    }

    /**
     * @notice Transfers tokens between accounts
     * @param to Recipient address
     * @param value Transfer amount
     * @custom:reverts "InsufficientBalance" if sender lacks funds
     * @custom:reverts "InvalidReceiver" for zero address
     */    
    function transfer(address to, uint256 value)  onlyUser() external {
        _User().exist(to);
        _update(msg.sender, to, value);
    }

    /**
     * @notice Admin-initiated transfer between accounts
     * @param from Sender address
     * @param to Recipient address
     * @param value Transfer amount
     * @custom:reverts "AccessDeniedLevel:Four" if unauthorized
     */
    function transferFrom(address from, address to, uint256 value) onlyAdmin() external {
        _update(from, to, value);
    }

    /**
     * @dev Internal balance update mechanism
     * @param from Sender address (address(0) for mint)
     * @param to Recipient address (address(0) for burn)
     * @param value Transfer amount
     * @custom:emits Transfer On successful transfer
     */
    function _update(address from, address to, uint256 value) internal {

        if (from == address(0)) {
            _totalSupply += value;
        } else {
            uint256 fromBalance = _balances[from];
            if (fromBalance < value) {
                revert InsufficientBalance(fromBalance, value);
            }
            unchecked {
                _balances[from] = fromBalance - value;
            }
        }

        if (to == address(0)) {
            unchecked {
                _totalSupply -= value;
            }
        } else {
            unchecked {
                _balances[to] += value;
            }
        }

        emit Transfer(from, to, value, _balances[from], _balances[to]);
    }

    /// @dev Internal minting implementation    
    function _mint(address account, uint256 value) internal {
        if (account == address(0)) {
            revert InvalidReceiver(account);
        }
        _update(address(0), account, value);
    }

    /// @dev Internal burning implementation
    function _burn(address account, uint256 value) internal {
        if (account == address(0)) {
            revert InvalidSender(account);
        }
        _update(account, address(0), value);
    }

}