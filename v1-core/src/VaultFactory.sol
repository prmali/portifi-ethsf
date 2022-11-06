// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "./interfaces/IVaultFactory.sol";
import "./Vault.sol";

contract VaultFactory is IVaultFactory {
	address registry;
	Vault public vault;
	mapping (address => address) public vaultsToStrategies;

	constructor(address _registry) {
		registry = _registry;
	}


	function createVault(
		address _asset,
		string memory _name,
		string memory _symbol
	) external returns(address ) {
		require(msg.sender == registry, "Caller must be Registry Contract");
		vault = new Vault(_asset, _name, _symbol);
		return address(vault);
	}

	function updateStrategy(address _vault, address _strategy) external {
		require(
			Vault(_vault).isGuardian(msg.sender),
			"Caller must be Vault Guardian"
		);
		vaultsToStrategies[_vault] = _strategy;
	}

	function getStrategy(address queryooor) external view returns(address) {
		return vaultsToStrategies[queryooor];
	}

	// Payable fallback to allow this contract to receive fee refunds.
    receive() external payable {}
}
