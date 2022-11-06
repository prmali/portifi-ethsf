// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import {IERC20} from "forge-std/interfaces/IERC20.sol";

struct PairData {
    address token0;
    address token1;
    uint256 amount;
}

contract ZRXHelper {
    address internal exchangeProxy;

    constructor(address exchangeProxy_) {
        exchangeProxy = exchangeProxy_;
    }

    function decodeSwapData(bytes calldata data) public pure returns (PairData[] memory) {
        require(data.length % 72 == 0, "ZRXHelper: INVALID_DATA_LENGTH");
        uint256 pairs = data.length / 72;
        uint256 start = 0;
        PairData[] memory batchPD = new PairData[](pairs);
        PairData memory pd;

        for (uint256 i = 0; i < pairs; i++) {
            start = i * 72;
            pd.token0 = abi.decode(data[start: start+20], (address));
            pd.token1 = abi.decode(data[start+20: start+40], (address));
            pd.amount = abi.decode(data[start+40: start+72], (uint256));
            batchPD[i] = pd;
        }
        return batchPD;
    }

    // Swaps ERC20->ERC20 tokens held by this contract using a 0x-API quote.
    function fillQuote(
        // The `sellTokenAddress` field from the API response.
        IERC20 sellToken,
        // The `buyTokenAddress` field from the API response.
        IERC20 buyToken,
        // The `allowanceTarget` field from the API response.
        address spender,
        // The `to` field from the API response.
        address payable swapTarget,
        // The `data` field from the API response.
        bytes calldata swapCallData
    ) external payable {
        // Checks that the swapTarget is actually the address of 0x ExchangeProxy
        require(swapTarget == exchangeProxy, "Target not ExchangeProxy");

        // Track our balance of the buyToken to determine how much we've bought.
        uint256 boughtAmount = buyToken.balanceOf(address(this));

        // Give `spender` an infinite allowance to spend this contract's `sellToken`.
        // Note that for some tokens (e.g., USDT, KNC), you must first reset any existing
        // allowance to 0 before being able to update it.
        require(sellToken.approve(spender, type(uint256).max));
        // Call the encoded swap function call on the contract at `swapTarget`,
        // passing along any ETH attached to this function call to cover protocol fees.
        (bool success,) = swapTarget.call{value: msg.value}(swapCallData);
        require(success, 'SWAP_CALL_FAILED');
        // Refund any unspent protocol fees to the sender.
        payable(msg.sender).transfer(address(this).balance);

        // Use our current buyToken balance to determine how much we've bought.
        boughtAmount = buyToken.balanceOf(address(this)) - boughtAmount;
    }
}
