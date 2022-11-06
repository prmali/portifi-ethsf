// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

interface IVaultFactory {

	// Deploy vault and strategy contract
    function createVault(
        address asset,
        string memory name,
        string memory symbol
    ) external returns(address);
}
