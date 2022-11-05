// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

interface IVaultFactory {

	// Deploy vault and strategy contract 
    function createVault(address asset, string memory name, string memory symbol, uint maxSize, uint fee, uint epochTime, address[] memory guardians) external returns(address); 
}
