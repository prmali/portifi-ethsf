// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "./IVaultFactory.sol";
// import "./Vault.sol";

contract VaultFactory is IVaultFactory {
	address registry;
	mapping (address => Info) vaultInfos;
	
	struct Info {
		address asset;
		string name;
		string symbol;
		uint maxSize;
		uint fee;
		uint epochTime;
		address[] guardians;
	}

	constructor(address _registry) {
		registry = _registry;
	}

	function createVault(address _asset, string memory _name, string memory _symbol, uint _maxSize, uint _fee, uint _epochTime, address[] memory _guardians) external returns(address vault) {
		require(msg.sender == registry, "Caller must be Registry Contract");
		// vault = new Vault(_asset, _name, _symbol, _maxSize, _fee, _epochTime, _guardians);
		vaultInfos[address(vault)] = Info({asset: _asset, name: _name, symbol: _symbol, maxSize: _maxSize, fee: _fee, epochTime: _epochTime, guardians: _guardians });
	}
}
