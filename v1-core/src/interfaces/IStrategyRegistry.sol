// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

interface IStrategyRegistry {

    function deployStrategy(address asset, string memory name, string memory symbol, uint maxSize, uint fee, uint epochTime, address[] memory guardians) external returns(address, address);

	function migrateStrategy(address _vault) external returns(address);

	function setFactory(address factory) external;
}
