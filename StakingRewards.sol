// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

// Inheritance
import "./interfaces/IStakingRewards.sol";
import "./interfaces/IStakingRewardsFactory.sol";
import "./interfaces/IERC20.sol";
import "./RewardsDistributionRecipient.sol";
import "./vendor/ReentrancyGuard.sol";
import "./libraries/Pausable.sol";

// Internal references
import "./Utils.sol";

// Libaries 
import "./libraries/TransferHelper.sol";
import "./libraries/EulerSwapLibrary.sol";

// Euler Swap
import "euler-swap-periphery/src/interfaces/IEulerSwapRouter.sol";
// import "euler-swap-core/src/interfaces/IEulerSwapFactory.sol";

// TODO: improve gas usage
// Original contract can be found under the following link:
// https://github.com/Synthetixio/synthetix/blob/master/contracts/StakingRewards.sol
contract StakingRewards is IStakingRewards, RewardsDistributionRecipient, ReentrancyGuard, Pausable {
    /* ========== STATE VARIABLES ========== */
    
    address public rewardsToken;
    address public stakingToken;
    address public stakingFactory;
    address public esFactory;
    uint public periodFinish = 0;
    uint public rewardRate = 0;
    uint public rewardsDuration = 7 days;
    uint public lastUpdateTime;
    uint public rewardPerTokenStored;

    mapping(address => uint) public userRewardPerTokenPaid;
    mapping(address => uint) public rewards;

    uint private _totalSupply;
    mapping(address => uint) private _balances;

    uint public lockTime = 7 days;
    uint public slashAmount = 300;
    address public slashTo;
    IEulerSwapRouter router;

    // maps withdraw request to rewards snapshot
    mapping(bytes32 => bool) requests;
    mapping(address => uint) _lockedBalance;
    
    struct WithdrawRequest {
        address owner;
		uint amount;
        // uint kSnapshot;
		uint unlockTime;
    }

    /* ========== CONSTRUCTOR ========== */

    constructor(
        address _rewardsDistribution,
        address _rewardsToken,
        address _stakingToken,
        address _slashTo,
        address _router, 
        address _esFactory
    ) Owned(msg.sender) {
        rewardsToken = _rewardsToken;
        stakingToken = _stakingToken;
        rewardsDistribution = _rewardsDistribution;
        slashTo = _slashTo;
        router = IEulerSwapRouter(_router);
        stakingFactory = msg.sender;
        esFactory = _esFactory;
    }

    /* ========== MODIFIERS ========== */

    modifier ensure(uint deadline) {
        require(deadline >= block.timestamp, 'StakingRewards: EXPIRED');
        _;
    }

    /* ========== VIEWS ========== */

    function totalSupply() external view override returns (uint) {
        return _totalSupply;
    }

    function balanceOf(address account) external view override returns (uint) {
        return _balances[account];
    }

    function lockedBalanceOf(address account) external view override returns (uint) {
        return _lockedBalance[account];
    }

    function lastTimeRewardApplicable() public view override returns (uint) {
        return block.timestamp < periodFinish ? block.timestamp : periodFinish;
    }

    function rewardPerToken() public view override returns (uint) {
        if (_totalSupply == 0) {
            return rewardPerTokenStored;
        }
        return rewardPerTokenStored + ((lastTimeRewardApplicable() - lastUpdateTime) * rewardRate * 1e18 / _totalSupply);
    }

    function earned(address account) public view override returns (uint) {
        return (_balances[account] * (rewardPerToken() - userRewardPerTokenPaid[account]) / 1e18) + rewards[account];
    }

    function penalty(uint unlockTime) public view returns (uint) {
        // TODO: revisit function
        // Placeholder function to calculate slash amount
        uint perc = (block.timestamp*1000)/unlockTime;
        uint num = (slashAmount-50) * perc;

        return num/1000 + 50;
    }

    function getRewardForDuration() external view override returns (uint) {
        return rewardRate * rewardsDuration;
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    function _stake(uint amount) internal {
        _totalSupply += amount;
        _balances[msg.sender] +=  amount;
        Utils.safeTransferFrom(stakingToken, msg.sender, address(this), amount);
        emit Staked(msg.sender, amount);
    }

    function _addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin
    ) internal virtual returns (uint amountA, uint amountB) {
        // create the pair if it doesn't exist yet
        if (IEulerSwapFactory(esFactory).getPair(tokenA, tokenB) == address(0)) {
            IEulerSwapFactory(esFactory).createPair(tokenA, tokenB);
        }
        (uint reserveA, uint reserveB) = EulerSwapLibrary.getReserves(esFactory, tokenA, tokenB);
        if (reserveA == 0 && reserveB == 0) {
            (amountA, amountB) = (amountADesired, amountBDesired);
        } else {
            uint amountBOptimal = EulerSwapLibrary.quote(amountADesired, reserveA, reserveB);
            if (amountBOptimal <= amountBDesired) {
                require(amountBOptimal >= amountBMin, 'StakingRewards: INSUFFICIENT_B_AMOUNT');
                (amountA, amountB) = (amountADesired, amountBOptimal);
            } else {
                uint amountAOptimal = EulerSwapLibrary.quote(amountBDesired, reserveB, reserveA);
                assert(amountAOptimal <= amountADesired);
                require(amountAOptimal >= amountAMin, 'StakingRewards: INSUFFICIENT_A_AMOUNT');
                (amountA, amountB) = (amountAOptimal, amountBDesired);
            }
        }
    }

    function _burnLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address protocolFactory 
    ) internal virtual returns (uint amountA, uint amountB) {
        address oldPair = EulerSwapLibrary.pairFor(protocolFactory, tokenA, tokenB);
        IEulerSwapPair(oldPair).transferFrom(msg.sender, oldPair, liquidity); // send liquidity to oldPair
        (uint amount0, uint amount1) = IEulerSwapPair(oldPair).burn(address(this));
        (address token0,) = EulerSwapLibrary.sortTokens(tokenA, tokenB);
        (amountA, amountB) = tokenA == token0 ? (amount0, amount1) : (amount1, amount0);
        require(amountA >= amountAMin, 'StakingRewards: INSUFFICIENT_A_AMOUNT');
        require(amountB >= amountBMin, 'StakingRewards: INSUFFICIENT_B_AMOUNT');
    }

    // TODO: evaluate potential attacks on this function 
    function addLiquidityAndStake( 
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        uint deadline
    ) external nonReentrant notPaused updateReward(msg.sender) ensure(deadline) returns(uint amountA, uint amountB, uint liquidity) {
        require(tokenA != address(0) && tokenB != address(0), "Invalid token addresses");

        (amountA, amountB) = _addLiquidity(tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin);
        address pair = EulerSwapLibrary.pairFor(esFactory, tokenA, tokenB);
        TransferHelper.safeTransferFrom(tokenA, msg.sender, pair, amountA);
        TransferHelper.safeTransferFrom(tokenB, msg.sender, pair, amountB);
        liquidity = IEulerSwapPair(pair).mint(address(this));
        
        _stake(liquidity);
    }

    function migrateLiquidityAndStake(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        uint256 deadline,
        uint16 protocolId
    ) external nonReentrant notPaused updateReward(msg.sender) ensure(deadline) returns(uint amountA, uint amountB, uint liq) {
        require(tokenA != address(0) && tokenB != address(0), "Invalid token addresses");

        address protocolFactory = IStakingRewardsFactory(stakingFactory).getWhitelist(protocolId);
        require(protocolFactory != address(0), "Protocol doesn't have a whitelisted router"); 

        (amountA, amountB) = _burnLiquidity(tokenA, tokenB, liquidity, amountAMin, amountBMin, protocolFactory);

        // TODO: don't think we need to check pairs here but may revisit
        // Remove liquidity from the old router with permit
        (amountA, amountB) = _addLiquidity(tokenA, tokenB, amountA, amountB, amountA, amountB);
        address pair = EulerSwapLibrary.pairFor(esFactory, tokenA, tokenB);
        IERC20(tokenA).approve(address(this), type(uint).max);
        IERC20(tokenB).approve(address(this), type(uint).max);
        TransferHelper.safeTransferFrom(tokenA, address(this), pair, amountA);
        TransferHelper.safeTransferFrom(tokenB, address(this), pair, amountB);
        liq = IEulerSwapPair(pair).mint(address(this));
        _stake(liq);
    }

    function stake(uint amount) external override nonReentrant notPaused updateReward(msg.sender) {
        require(amount > 0, "Cannot stake 0");
        _stake(amount);
    }

    function requestWithdraw(uint amount) public override nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot request to withdraw 0");
        require(amount <= _balances[msg.sender], "Request amount too large");
        
        uint unlockTime = block.timestamp + lockTime;
        bytes32 requestId = keccak256(abi.encode(WithdrawRequest({ owner: msg.sender, amount: amount, unlockTime: unlockTime })));
        require(requests[requestId] == false, "Request already exists");

        requests[requestId] = true;
        _balances[msg.sender] -= amount;
        _totalSupply -= amount;
        _lockedBalance[msg.sender] += amount;

        emit WithdrawRequested(msg.sender, amount, unlockTime);
    }

    function cancelRequest(uint amount, uint unlockTime) public override nonReentrant updateReward(msg.sender) {
        require(amount > 0, "No request with amount 0");
        require(amount <= _lockedBalance[msg.sender], "Cancel request amount too large");

        bytes32 requestId = keccak256(abi.encode(WithdrawRequest({ owner: msg.sender, amount: amount, unlockTime: unlockTime })));
        bool exists = requests[requestId];
        require(exists, "Request does not exist");
        requests[requestId] = false;
        _lockedBalance[msg.sender] -= amount;
        _balances[msg.sender] += amount;
        _totalSupply += amount;

        emit WithdrawCancelled(msg.sender, amount, unlockTime);
    }

    function completeWithdraw(uint amount, uint unlockTime) public override nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot withdraw 0");
        require(block.timestamp > unlockTime, "Cannot withdraw before unlock");

        bytes32 requestId = keccak256(abi.encode(WithdrawRequest({ owner: msg.sender, amount: amount, unlockTime: unlockTime })));
        bool exists = requests[requestId];
        require(exists, "Request does not exist");
        requests[requestId] = false;
        _lockedBalance[msg.sender] -= amount;

        Utils.safeTransfer(stakingToken, msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    function getReward() public override nonReentrant updateReward(msg.sender) {
        uint reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            Utils.safeTransfer(rewardsToken, msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }
    }

    function forceWithdrawBalance(uint amount) public override nonReentrant updateReward(msg.sender)  {
        require(amount > 0, "No request with amount 0");
        require(amount <= _balances[msg.sender], "Request amount too large");

        uint withdrawTotal = (amount*(1000-slashAmount))/1000;
        uint slashTotal = amount - withdrawTotal;
        _totalSupply -= amount;
        _balances[msg.sender] -= amount;
        Utils.safeTransfer(stakingToken, msg.sender, withdrawTotal);
        Utils.safeTransfer(stakingToken, slashTo, slashTotal);
        emit ForceWithdrawn(msg.sender, amount);
    }

    function forceWithdrawLockedBalance(uint amount, uint unlockTime) public override nonReentrant updateReward(msg.sender) {
        require(amount > 0, "No request with amount 0");
        require(amount <= _lockedBalance[msg.sender], "Request amount too large");

        bytes32 requestId = keccak256(abi.encode(WithdrawRequest({ owner: msg.sender, amount: amount, unlockTime: unlockTime })));
        bool exists = requests[requestId];
        require(exists, "Request does not exist");
        requests[requestId] = false;
        
        uint withdrawTotal =(amount*penalty(unlockTime))/1000; 
        uint slashTotal = amount - withdrawTotal;
        _lockedBalance[msg.sender] -= amount;
        Utils.safeTransfer(stakingToken, msg.sender, withdrawTotal);
        Utils.safeTransfer(stakingToken, slashTo, slashTotal);
        emit ForceWithdrawn(msg.sender, amount);
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    function notifyRewardAmount(uint reward) external override onlyRewardsDistribution updateReward(address(0)) {
        if (block.timestamp >= periodFinish) {
            rewardRate = reward / rewardsDuration;
        } else {
            uint remaining = periodFinish - block.timestamp;
            uint leftover = remaining * rewardRate;
            rewardRate = (reward + leftover) / rewardsDuration;
        }

        // Ensure the provided reward amount is not more than the balance in the contract.
        // This keeps the reward rate in the right range, preventing overflows due to
        // very high values of rewardRate in the earned and rewardsPerToken functions;
        // Reward + leftover must be less than 2^256 / 10^18 to avoid overflow.
        uint balance =  IERC20(rewardsToken).balanceOf(address(this));
        require(rewardRate <= balance / rewardsDuration, "Provided reward too high");

        lastUpdateTime = block.timestamp;
        periodFinish = block.timestamp + rewardsDuration;
        emit RewardAdded(reward);
    }

    // Added to support recovering LP Rewards from other systems such as BAL to be distributed to holders
    function recoverERC20(address tokenAddress, uint tokenAmount) external onlyOwner {
        require(tokenAddress != address(stakingToken), "Cannot withdraw the staking token");
        Utils.safeTransfer(tokenAddress, owner, tokenAmount);
        emit Recovered(tokenAddress, tokenAmount);
    }

    function setRewardsDuration(uint _rewardsDuration) external onlyOwner {
        require(
            block.timestamp > periodFinish,
            "Previous rewards period must be complete before changing the duration for the new period"
        );
        rewardsDuration = _rewardsDuration;
        emit RewardsDurationUpdated(_rewardsDuration);
    }

    function setLockTime(uint _lockTime) external onlyOwner {
        require(_lockTime > 0, "Liquidity lock time must be positive");
        lockTime = _lockTime;
        emit LockTimeUpdate(_lockTime);
    }

    function setSlashTo(address _slashTo) external onlyOwner {
        require(_slashTo != address(0), "Invalid address to send slash");
        require(_slashTo != address(this), "Invalid address to send slash");
        slashTo = _slashTo;
        emit SlashToUpdated(_slashTo);
    }

    function setSlashAmount(uint _slashAmount) external onlyOwner {
        require(_slashAmount >= 0, "slashAmount must be non-negative");
        slashAmount = _slashAmount;
        emit SlashAmountUpdated(_slashAmount);
    }

    function setRouter(address _router) external onlyOwner {
        require(_router != address(0), "Invalid router address");
        require(_router != address(router), "New address cannot be current");
        router = IEulerSwapRouter(_router);
        emit RouterAddressUpdated(_router);
    }

    // TODO: remove
    // Used for tests, will remove and make immutable in prod
    function setStakingFactory(address _stakingFactory) external onlyOwner {
        stakingFactory = _stakingFactory;
    }

    // TODO: remove
    // Used for tests, will remove and make immutable in prod
    function setEsFactory(address _esFactory) external onlyOwner {
        esFactory = _esFactory;
    }

    /* ========== MODIFIERS ========== */

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    /* ========== EVENTS ========== */

    event RewardAdded(uint reward);
    event Staked(address indexed user, uint amount);
    event WithdrawRequested(address indexed user, uint amount, uint unlockTime);
    event WithdrawCancelled(address indexed user, uint amount, uint unlockTime);
    event Withdrawn(address indexed user, uint amount);
    event ForceWithdrawn(address indexed user, uint amount);
    event RewardPaid(address indexed user, uint reward);
    event RewardsDurationUpdated(uint newDuration);
    event SlashToUpdated(address newSlashTo);
    event SlashAmountUpdated(uint newSlashAmount);
    event RouterAddressUpdated(address newRouter);
    event LockTimeUpdate(uint newLockTime);
    event Recovered(address token, uint amount);
}
