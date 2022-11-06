// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "../lib/forge-std/src/Script.sol";
import "../lib/forge-std/src/Vm.sol";
import "../src/SingleStalkStrategy.sol";
import "../src/VaultFactory.sol";
import "../lib/solmate/src/tokens/ERC20.sol";
import "./IUniswapV2Router02.sol";


contract Swap is Script {
	SingleStalkStrategy strategy;
	VaultFactory vaultFactory;
	address usdc;
	address weth;
	IUniswapV2Router02 uniswapRouter;

	function run() external {
		uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

		// contracts initialization
		strategy = SingleStalkStrategy(0x3D63c50AD04DD5aE394CAB562b7691DD5de7CF6f);
		vaultFactory = VaultFactory(0x90c84237fDdf091b1E63f369AF122EB46000bc70);

		// swap for usdc
		usdc = address(ERC20(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48));
		weth = address(ERC20(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2));

		address[] memory path = new address[](2);
		path[0] = weth;
		path[1] = usdc;
		uniswapRouter.swapExactETHForTokens{value: 1000 ether}(1000000, path, address(0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266), block.timestamp + 100);
	}

}