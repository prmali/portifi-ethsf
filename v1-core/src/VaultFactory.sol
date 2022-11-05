// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "./interfaces/IVaultFactory.sol";
import "./Vault.sol";

contract VaultFactory is IVaultFactory {
	address registry;
	mapping (address => Info) vaultInfos;

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
}
