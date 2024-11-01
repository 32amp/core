// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;

interface IRevertCodes  {

    struct Output {
        string code;
        string message;
    }


    struct UpdateLocales {
        string lang;
        string code;
        string message;
    }

    function getRevertMessages(string calldata module, string memory lang) external view returns(Output[] memory output );
    function updateLocale(string calldata module, UpdateLocales[] calldata update_locales) external;
    function registerRevertCode(string memory module, string memory code, string memory message) external;
    function panic(string memory module,string memory code) external;
}