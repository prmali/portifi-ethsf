// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IStakingRewardsFactory {

    function stakingRewardsInfo(address stakingToken) external view returns (address, uint);

    function getWhitelist(uint16 protocolId) external view returns(address);

    function createStakingRewards(address stakingToken, uint rewardAmount) external;

    function update(address stakingToken, uint rewardAmount) external;

    function recoverFunds(address stakingToken, address tokenAddress, uint tokenAmount) external;

    function recoverFactoryFunds(address tokenAddress, address to) external;

    function notifyRewardAmounts() external;

    function notifyRewardAmount(address stakingToken) external;
}
