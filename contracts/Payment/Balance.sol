// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../Services/ICurrencies.sol";
import "../Hub/IHub.sol";
import "./IBalance.sol";
import "../RevertCodes/IRevertCodes.sol";
import "../User/IAuth.sol";
import "../User/IUserAccess.sol";

contract Balance is Initializable,  IBalance {

    address hubContract;
    address currenciesServiceAddress;
    uint256 partner_id;
    uint256 _totalSupply;
    uint256 _currency;

    mapping(uint256 => uint256) _balances;

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

    function _Auth() private view returns(IAuth) {
        return IAuth(IHub(hubContract).getModule("Auth", partner_id));
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


    modifier onlyAdmin(bytes32 _token){
        uint256 user_id = _Auth().isLogin(_token);

        uint access_level = _UserAccess().getModuleAccessLevel("Balance", user_id);

        if(access_level < uint(IUserAccess.AccessLevel.FOURTH)){
            revert("access_denied_level_four");
        }

        _;
    }

    function getCurrency() external view returns (uint256){
        return _currency;
    }

    function mint(bytes32 _token, uint256 account, uint256 amount) external onlyAdmin(_token) {
        _mint(account, amount);
    }

    function burn(bytes32 _token, uint256 account, uint256 amount) external onlyAdmin(_token) {
        _burn(account, amount);
    }

    function totalSupply() external view returns (uint256){
        return _totalSupply;
    }

    function balanceOf(uint256 user_id) external view returns (uint256){
        return _balances[user_id];
    }

    function transfer(bytes32 _token, uint256 to, uint256 value) external {
        uint256 user_id = _Auth().isLogin(_token);
        
        if (user_id == 0) revert("access_denied");
        
        _update(user_id, to, value);
    }

    function transferFrom(bytes32 _token, uint256 from, uint256 to, uint256 value) onlyAdmin(_token) external {
        _update(from, to, value);
    }


    function _update(uint256 from, uint256 to, uint256 value) internal {
        if (from == 0) {
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

        if (to == 0) {
            unchecked {
                _totalSupply -= value;
            }
        } else {
            unchecked {
                _balances[to] += value;
            }
        }

        emit Transfer(from, to, value);
    }

    function _mint(uint256 account, uint256 value) internal {
        if (account == 0) {
            revert("invalid_receiver");
        }
        _update(0, account, value);
    }

    function _burn(uint256 account, uint256 value) internal {
        if (account == 0) {
            revert("invalid_sender");
        }
        _update(account, 0, value);
    }

}