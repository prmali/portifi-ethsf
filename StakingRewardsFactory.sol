// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./interfaces/IStakingRewards.sol";
import "./interfaces/IStakingRewardsFactory.sol";
import "./interfaces/IERC20.sol";
import {StakingRewards} from "./StakingRewards.sol";
import "./libraries/Owned.sol";

contract StakingRewardsFactory is Owned, IStakingRewardsFactory {
    address public rewardsToken;
    uint public rewardsGenesis;
    address public router; // EulerSwap Router
    address public factory; // EulerSwap Factory
    address public slashTo; // Slash recipient
    address[] public stakingTokens;

    struct StakingRewardsInfo {
        address stakingRewards;
        uint rewardAmount;
    }

    // maps factory id to router address for whitelist
    uint16 public factoryId;
    mapping(uint16 => address) whitelist;
    mapping(address => StakingRewardsInfo) public tokenStakingRewardsInfo;

    constructor(address _rewardsToken, uint _rewardsGenesis, address _router, address _factory, address _slashTo) Owned(msg.sender) {
        require(_rewardsGenesis >= block.timestamp, "Rewards genesis too soon");
        rewardsToken = _rewardsToken;
        rewardsGenesis = _rewardsGenesis;
        router = _router;
        factory = _factory;
        slashTo = _slashTo;
        factoryId = 0;
    }

    /* ========== VIEWS ========== */

    function stakingRewardsInfo(address stakingToken) public view returns (address, uint) {
        StakingRewardsInfo storage info = tokenStakingRewardsInfo[stakingToken];
        return (info.stakingRewards, info.rewardAmount);
    }

    function getWhitelist(uint16 protocolId) public view returns(address) {
        return whitelist[protocolId];
    }

    /* ========== PERMISSIONED FUNCTIONS ========== */

    function createStakingRewards(address stakingToken, uint rewardAmount) public onlyOwner {
        StakingRewardsInfo storage info = tokenStakingRewardsInfo[stakingToken];
        require(info.stakingRewards == address(0), "Staking rewards for this token already exists");

        info.stakingRewards = address(new StakingRewards(/* rewardsDist */ address(this), 
                                                        rewardsToken,   
                                                        stakingToken, 
                                                        slashTo, 
                                                        router, 
                                                        factory));

        info.rewardAmount = rewardAmount;
        stakingTokens.push(stakingToken);
    }

    function update(address stakingToken, uint rewardAmount) public onlyOwner {
        StakingRewardsInfo storage info = tokenStakingRewardsInfo[stakingToken];
        require(info.stakingRewards != address(0), "Staking rewards for this token does not exist");

        info.rewardAmount = rewardAmount;
    }

    function recoverFunds(address stakingToken, address tokenAddress, uint tokenAmount) public onlyOwner {
        StakingRewardsInfo storage info = tokenStakingRewardsInfo[stakingToken];
        require(info.stakingRewards != address(0), "Staking rewards for this token does not exist");

        StakingRewards(info.stakingRewards).recoverERC20(tokenAddress, tokenAmount);
    }

    function recoverFactoryFunds(address tokenAddress, address to) public onlyOwner {
        IERC20 token = IERC20(tokenAddress);
        uint balance = token.balanceOf(address(this));
        require(balance > 0, "No balance for your given token address");
        token.transfer(to, balance);
    }

    /* ========== PERMISSIONLESS FUNCTIONS ========== */

    function notifyRewardAmounts() public {
        require(stakingTokens.length > 0, "No staking rewards have been deployed");
        for (uint i = 0; i < stakingTokens.length; i++) {
            notifyRewardAmount(stakingTokens[i]);
        }
    }

    function notifyRewardAmount(address stakingToken) public {
        require(block.timestamp >= rewardsGenesis, "Reward genesis is in the future");
        StakingRewardsInfo storage info = tokenStakingRewardsInfo[stakingToken];
        require(info.stakingRewards != address(0), "Staking rewards for this token does not exist");

        if (info.rewardAmount > 0) {
            uint rewardAmount = info.rewardAmount;
            info.rewardAmount = 0;

            require(
                IERC20(rewardsToken).transfer(info.stakingRewards, rewardAmount),
                'StakingRewardsFactory::notifyRewardAmount: transfer failed'
            );
            StakingRewards(info.stakingRewards).notifyRewardAmount(rewardAmount);
        }
    }

    // TODO: not sure if there's a way to check if the correct functions are implemented here
    // Might not need to since it's governance updated
    function whitelistFactory(address _factory) external onlyOwner returns(uint16 protocolId) {
        require(_factory != address(0), "Cannot add 0 address");
        factoryId++;
        protocolId = factoryId;
        whitelist[factoryId] = _factory;
        emit FactoryAddressWhitelisted(_factory);
    }

    event FactoryAddressWhitelisted(address whitelistedFactory);
}