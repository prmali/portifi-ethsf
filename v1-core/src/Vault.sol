// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import {ERC4626} from "solmate/mixins/ERC4626.sol";
import {ERC20} from "solmate/tokens/ERC20.sol";

import {IStrategy} from "./interfaces/IStrategy.sol";

contract Vault is ERC4626 {
    uint256 public feeAccrued;
    uint128 public feePercent;
    uint128 public epoch;

    mapping (address => bool) public guardians;
    mapping(address => bool) public assets;

    modifier onlyGuardian() {
        require(guardians[msg.sender], "!guardian");
        _;
    }
    constructor(
        address baseAsset,
        string memory name,
        string memory ticker
    ) ERC4626(ERC20(baseAsset), name, ticker) {}

    function approve(
        address sAddress,
        address asset,
        uint256 amount
    ) external onlyGuardian {
        assets[asset] = true;
        ERC20(asset).approve(sAddress, amount);
    }

    function executeStrategy(bytes calldata strategyData) onlyGuardian external {
        Strategy(getStrategy()).execute(strategyData);
    }

}
