// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../Services/ICurrencies.sol";
import "../Hub/IHub.sol";
import "./IBalance.sol";
import "../RevertCodes/IRevertCodes.sol";
import "../User/IUserAccess.sol";

contract Balance is Initializable,  IBalance {

    address hubContract;
    address currenciesServiceAddress;
    uint256 partner_id;
    uint256 _totalSupply;
    uint256 _currency;
    uint256 _transfer_ids;

    struct TransferData {
        address from;
        address to;
        uint256 value;
    }

    mapping(address => uint256) _balances;
    mapping(uint256 => TransferData) _transfers;

    function initialize(uint256 _partner_id, address _hubContract, uint256 __currency) public initializer {
        hubContract = _hubContract;
        partner_id = _partner_id;
        currenciesServiceAddress = IHub(_hubContract).getService("Currencies");

        if(ICurrencies(currenciesServiceAddress).exist(__currency) == false){
            revert("currency_not_found");
        }

        _currency = __currency;
    }



    function _RevertCodes() private view returns(IRevertCodes) {
        return IRevertCodes(IHub(hubContract).getModule("RevertCodes", partner_id));
    }

    function _UserAccess() private view returns(IUserAccess) {
        return IUserAccess(IHub(hubContract).getModule("UserAccess", partner_id));
    }

    function registerRevertCodes() external {
        _RevertCodes().registerRevertCode("Balance", "access_denied_level_four", "Access denied, you must have access to module Balance not lower than four");
        _RevertCodes().registerRevertCode("Balance", "access_denied", "Access denied");
        _RevertCodes().registerRevertCode("Balance", "insufficient_balance", "Insufficient balance");
        _RevertCodes().registerRevertCode("Balance", "invalid_receiver", "Invalid receiver");
        _RevertCodes().registerRevertCode("Balance", "invalid_sender", "Invalid sender");
 
    }

    function getVersion() external pure returns(string memory){
        return "1.0";
    }


    modifier onlyAdmin(){
        uint access_level = _UserAccess().getModuleAccessLevel("Balance", msg.sender);

        if(access_level < uint(IUserAccess.AccessLevel.FOURTH)){
            revert("access_denied_level_four");
        }

        _;
    }

    function getCurrency() external view returns (uint256){
        return _currency;
    }

    function mint(address account, uint256 amount) external onlyAdmin() {
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) external onlyAdmin() {
        _burn(account, amount);
    }

    function totalSupply() external view returns (uint256){
        return _totalSupply;
    }

    function balanceOf(address account) external view returns (uint256){
        return _balances[account];
    }

    // check user exist
    function transfer(address to, uint256 value) external {
        _update(msg.sender, to, value);
    }

    function transferFrom(address from, address to, uint256 value) onlyAdmin() external {
        _update(from, to, value);
    }


    function _update(address from, address to, uint256 value) internal {
        if (from == address(0)) {
            _totalSupply += value;
        } else {
            uint256 fromBalance = _balances[from];
            if (fromBalance < value) {
                revert("insufficient_balance");
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

        _transfer_ids++;


        _transfers[_transfer_ids].from = from;
        _transfers[_transfer_ids].to = to;
        _transfers[_transfer_ids].value = value;

        emit Transfer(from, to, _transfer_ids);
    }

    function _mint(address account, uint256 value) internal {
        if (account == address(0)) {
            revert("invalid_receiver");
        }
        _update(address(0), account, value);
    }

    function _burn(address account, uint256 value) internal {
        if (account == address(0)) {
            revert("invalid_sender");
        }
        _update(account, address(0), value);
    }

}