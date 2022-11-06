// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "../lib/forge-std/src/Script.sol";
import "../lib/forge-std/src/Vm.sol";
import "../src/SingleStalkStrategy.sol";
import "../src/VaultFactory.sol";
import "../lib/solmate/src/tokens/ERC20.sol";
import "./IUniswapV2Router02.sol";

import {ERC20} from "../lib/solmate/src/tokens/ERC20.sol";

contract UserVault is Script {
	SingleStalkStrategy strategy;
	VaultFactory vaultFactory;
	address usdc;
	address weth;
	IUniswapV2Router02 uniswapRouter;

	function run() external {
		uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        vm.startBroadcast(deployerPrivateKey);

		// swap for usdc
		usdc = address(ERC20(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48));
		weth = address(ERC20(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2));

		Vault vault = Vault(0x3482173066f5A4f3326A116BBC8B621737bc4a24);
		ERC20(usdc).approve(address(vault), 1000000);
		Vault(vault).deposit(1000000, address(0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266));
	}

}