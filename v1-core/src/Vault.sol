// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import {ERC4626} from "solmate/mixins/ERC4626.sol";
import {ERC20} from "solmate/tokens/ERC20.sol";

import {VaultFactory} from "./VaultFactory.sol";
import {SwapToWithdraw} from "./SwapToWithdraw.sol";
import {IStrategy} from "./interfaces/IStrategy.sol";

contract Vault is ERC4626 {
    address public factory;
    uint256 public feeAccrued;
    uint256 public feePercent;
    uint256 public epoch;

    mapping (address => bool) public guardians;
    address[] public assets;

    event FeePercentUpdated(address indexed guardian, uint256 newFeePercent);

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

    function setFeePercent(uint256 newFeePercent) external onlyGuardian {
        require(newFeePercent <= 1e18, "VAULT: FEE_TOO_HIGH");

        // Update the fee percentage.
        feePercent = newFeePercent;

        emit FeePercentUpdated(msg.sender, newFeePercent);
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
        assets.push(asset);
        ERC20(asset).approve(sAddress, amount);
    }

    function executeStrategy(
        address payable sAddress,
        bytes calldata strategyData
    ) external onlyGuardian  {
        IStrategy(VaultFactory(payable(factory)).getStrategy(msg.sender))
            .execute(sAddress, strategyData);
    }

    function withdraw() external {
        require(_checkEpoch(), "VAULT: WITHDRAWAL_WINDOW_NOT_OPEN");

        // TODO: address
        SwapToWithdraw()
            .execute(msg.sender, _encodeWithdraw());
    }

    function _encodeWithdraw() internal returns (bytes memory swapData) {
        bytes memory swapData;
        for (uint256 i = 0; i < assets.length; i++) {
            swapData = abi.encodePacked(
                swapData,
                abi.encode(
                    assets[i],
                    asset,
                    ERC20(assets[i]).balanceOf(address(this))
                )
            );
        }
    }

    function _checkEpoch() internal returns (bool) {
        return block.timestamp >= epoch;
    }



    // TODO: just to override ERC4626 - not useful
    function totalAssets() public view virtual override returns (uint256) {
        return ERC20(asset).balanceOf(address(this));
    }

}
