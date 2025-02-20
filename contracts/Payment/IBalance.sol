// SPDX-License-Identifier: GPLV3

pragma solidity ^0.8.20;

interface IBalance {

    event Transfer(uint256 indexed from, uint256 indexed to, uint256 indexed value);
    
    event WriteOff(uint256 indexed user_id, uint256 amount);

    function totalSupply() external view returns (uint256);

    function balanceOf(uint256 user_id) external view returns (uint256);

    function transfer(bytes32 _token, uint256 to, uint256 value) external;

    function transferFrom(bytes32 _token, uint256 from, uint256 to, uint256 value) external;

    function getCurrency() external view returns (uint256);
}
