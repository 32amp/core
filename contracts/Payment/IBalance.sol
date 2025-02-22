// SPDX-License-Identifier: GPLV3

pragma solidity ^0.8.20;

interface IBalance {

    event Transfer(address indexed from, address indexed to, uint256 indexed transfer_id);
    
    //event WriteOff(address indexed user_id, uint256 amount);

    function totalSupply() external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function transfer(address to, uint256 value) external;

    function transferFrom(address from, address to, uint256 value) external;

    function getCurrency() external view returns (uint256);
}
