// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import {IERC20} from "forge-std/interfaces/IERC20.sol";

import {PairData, ZRXHelper} from "./helpers/ZRXHelper.sol";

import {IStrategy} from "./interfaces/IStrategy.sol";
import {Vault} from "./Vault.sol";

contract SingleStalkStrategy is IStrategy {
    ZRXHelper internal helper;
    address controller;
    bytes data;

    function executeStrategy(
        address strategyAddress,
        bytes calldata strategyData) external {
        helper = new ZRXHelper(strategyAddress);

        bool flag = false;
        PairData[] memory batchPD = helper.decodeSwapData(strategyData);
        for (uint256 i = 0; i < batchPD.length; i++) {
            PairData memory pd = batchPD[i];

            Vault(msg.sender).approve(address(strategyAddress), pd.token0, pd.amount);
            IERC20(pd.token0).transferFrom(
                msg.sender,
                address(strategyAddress),
                pd.amount
            );
        }
    }
}
