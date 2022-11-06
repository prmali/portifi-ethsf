// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "../lib/forge-std/src/Script.sol";
import "../lib/forge-std/src/Vm.sol";
import "../src/SingleStalkStrategy.sol";
import "../src/VaultFactory.sol";
import "../lib/solmate/src/tokens/ERC20.sol";
import "./IUniswapV2Router02.sol";

contract VaultScript is Script {
	SingleStalkStrategy strategy;
	VaultFactory vaultFactory;
	address usdc;
	address weth;
	IUniswapV2Router02 uniswapRouter;

	function run() external {
		uint256 managerPrivateKey = 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d;
        vm.startBroadcast(managerPrivateKey);

		// contracts initialization
		strategy = SingleStalkStrategy(0x3D63c50AD04DD5aE394CAB562b7691DD5de7CF6f);
		vaultFactory = VaultFactory(payable(0x90c84237fDdf091b1E63f369AF122EB46000bc70));

		// swap for usdc
		usdc = address(ERC20(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48));
		weth = address(ERC20(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2));

		address newVault = vaultFactory.createVault(usdc, "Whale Watcher", "W");
		console.log("newVault: ", newVault);
	}

	// Checking vault assets
	// cast call 0xb0b63Fb66B22C8A2801F3782938E310Dba0aFCE0 "totalAssets()uint256" --rpc-url http://127.0.0.1:8545

	// 

}