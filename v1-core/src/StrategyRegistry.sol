// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "./interfaces/IStrategyRegistry.sol";
import "./interfaces/IVaultFactory.sol";
import "./Strategy.sol";

contract StrategyRegistry is IStrategyRegistry {
	mapping(address => address) vaultStrategy;
	mapping(address => address) strategyOwner;
	address owner;
	address factory;

	constructor() {
		owner = msg.sender;
	}

	modifier onlyOwner() {
		require(msg.sender == owner);
		_;
	}

	function getStrategyOwner(address strategy) external view returns(address) {
		return strategyOwner[strategy];
	}

	function getVaultStrategy(address vault) external view returns(address) {
		return vaultStrategy[vault];
	}

	function deployStrategy(address _asset, string memory _name, string memory _symbol, uint _maxSize, uint _fee, uint _epochTime, address[] memory _guardians) external returns(address vault, address strategy) {
		vault = IVaultFactory(factory).createVault(_asset, _name, _symbol, _maxSize, _fee, _epochTime, _guardians);
		strategy = address(new Strategy());

		vaultStrategy[vault] = strategy;
		strategyOwner[vault] = msg.sender;
		emit StrategyDeployed(strategy, vault);
	}

	function migrateStrategy(address _vault) external returns(address strategy) {
		require(strategyOwner[vaultStrategy[_vault]]  == msg.sender,"You do not own this strategy");
		strategy = address(new Strategy()); // change to allow strategy to be customizable
		vaultStrategy[_vault] = strategy;
	}

	function setFactory(address _factory) onlyOwner external {
		factory = _factory;
	}

	event StrategyDeployed(address strategy, address vault);
	event StrategyMigrated(address strategy, address vault);
}