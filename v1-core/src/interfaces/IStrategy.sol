// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

contract IStrategy {
    function execute(address sAddress, bytes calldata data) public returns (bool success) {
        (bool success, ) = sAddress.call(data);
    }
}
