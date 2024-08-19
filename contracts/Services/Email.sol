// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./MessageOracle.sol";

contract Email is Initializable, MessageOracle {
    
    function initv1(uint256 sendTimeout, uint256 priceForMessage, bool whitelistEnable, string memory bodyTemplate) public initializer {
        initialize(sendTimeout, priceForMessage, whitelistEnable, bodyTemplate);
    }

}