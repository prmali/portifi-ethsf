// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "./Strategy.sol";

contract Vault is ERC4626 {
    uint256 public feeAccrued;
    uint128 public feePercent;
    uint128 public epoch;

    mapping (address => bool) public guardians;

    modifier onlyGuardian(address actor) {
        require(guardians[actor], "!guardian");
        _;
    }
    constructor(string memory name, string memory ticker) ERC4626(name, ticker) {}

    function executeStrategy(bytes calldata strategyData) onlyGuardian external {
        Strategy(getStrategy()).execute(strategyData);
    }

    function totalAssets() external view returns (uint256) {}
}
