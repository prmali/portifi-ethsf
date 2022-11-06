// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import {ERC4626} from "solmate/mixins/ERC4626.sol";
import {ERC20} from "solmate/tokens/ERC20.sol";

import {VaultFactory} from "./VaultFactory.sol";
import {IStrategy} from "./interfaces/IStrategy.sol";

contract Vault is ERC4626 {
    address public factory;
    uint256 public feeAccrued;
    uint128 public feePercent;
    uint128 public epoch;

    mapping (address => bool) public guardians;
    mapping(address => bool) public assets;

    modifier onlyGuardian() {
        require(guardians[msg.sender], "!guardian");
        _;
    }

    function isGuardian(address sender) public view returns(bool) {
        return guardians[sender];
    }

    function setGuardian(address guardian, bool flag) public onlyGuardian {
        guardians[guardian] = flag;
    }

    constructor(
        address baseAsset,
        string memory name,
        string memory ticker,
        address guardian_
    ) ERC4626(ERC20(baseAsset), name, ticker) {
        factory = msg.sender;
        guardians[guardian_] = true;
    }

    function approve(
        address sAddress,
        address asset,
        uint256 amount
    ) onlyGuardian external  {
        assets[asset] = true;
        ERC20(asset).approve(sAddress, amount);
    }

    function executeStrategy(address payable sAddress, bytes calldata strategyData) external onlyGuardian  {
        IStrategy(VaultFactory(payable(factory)).getStrategy(msg.sender))
            .execute(sAddress, strategyData);
    }

    // TODO: just to override ERC4626 - not useful
    function totalAssets() public view virtual override returns (uint256) {
        return ERC20(asset).balanceOf(address(this));
    }

}
