// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "../lib/forge-std/src/Script.sol";
import "../lib/forge-std/src/Vm.sol";
import "../src/SingleStalkStrategy.sol";
import "../src/VaultFactory.sol";
import "../lib/solmate/src/tokens/ERC20.sol";
import "./IUniswapV2Router02.sol";

// https://mainnet.infura.io/v3/ce6507f5f69d41fc8ec43bdd3d566708
// to run, first start anvil: anvil --fork-url https://rpc.flashbots.net
// After starting anvil: forge script script/DeployFactory.s.sol:DeployFactoryScript --rpc-url http://127.0.0.1:8545

contract MainnetFork is Script {
	SingleStalkStrategy strategy;
	VaultFactory vaultFactory;
	address usdc;
	address weth;
	IUniswapV2Router02 uniswapRouter;

    function run() external {
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        vm.startBroadcast(deployerPrivateKey);

		// Initialize
		usdc = address(ERC20(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48));
		weth = address(ERC20(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2));
		vaultFactory = new VaultFactory();
		strategy = new SingleStalkStrategy();
		uniswapRouter = IUniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);

		// Swap from eth to USDC
		address[] memory path = new address[](2);
		path[0] = weth;
		path[1] = usdc;
		uniswapRouter.swapExactETHForTokens{value: 1000 ether}(1000000, path, address(0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266), block.timestamp + 100);

		console.log("vaultFactory: ", address(vaultFactory));
		console.log("strategy: ", address(strategy));

        vm.stopBroadcast();
    }
}