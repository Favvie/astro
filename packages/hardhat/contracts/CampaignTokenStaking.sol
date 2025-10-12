
//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/**
 * @title TokenStaking Contract
 * @dev Allows users to stake tokens from completed launchpad campaigns and earn rewards
 */

interface ILaunchpad {
    function campaigns(
        uint256 campaignId
    )
        external
        view
        returns (
            address creator,
            address token,
            address uniswapPair,
            uint128 targetAmount,
            uint128 amountRaised,
            uint64 deadline,
            uint32 reserveRatio,
            uint32 blockNumberCreated,
            bool isActive,
            bool isFundingComplete,
            bool isCancelled,
            bool isPromoted
        );

    function campaignCount() external view returns (uint32);
}

contract TokenStaking is Initializable, ReentrancyGuardUpgradeable, OwnableUpgradeable {
    using SafeERC20 for IERC20;

    // Custom errors
    error InvalidInput();
    error Unauthorized();
    error CampaignNotCompleted();
    error StakingNotEnabled();
    error InsufficientBalance();
    error NoRewardsAvailable();
    error StakingPeriodNotEnded();

    // Events
    event StakingPoolCreated(uint32 indexed campaignId, address indexed token, uint256 apy, uint256 minStakingPeriod);
    event TokensStaked(uint32 indexed campaignId, address indexed user, uint256 amount, uint256 timestamp);
    event TokensUnstaked(
        uint32 indexed campaignId,
        address indexed user,
        uint256 amount,
        uint256 rewards,
        uint256 timestamp
    );
    event RewardsClaimed(uint32 indexed campaignId, address indexed user, uint256 rewards, uint256 timestamp);
    event StakingPoolUpdated(uint32 indexed campaignId, uint256 newApy, bool enabled);
    event RewardsAdded(uint32 indexed campaignId, uint256 amount);
    event EmergencyWithdraw(uint32 indexed campaignId, address indexed user, uint256 amount);

    // Staking pool structure
    struct StakingPool {
        IERC20 stakingToken; // Token to be staked
        uint128 totalStaked; // Total amount staked in this pool
        uint128 rewardPool; // Available rewards for distribution
        uint64 apy; // Annual percentage yield (in basis points, e.g., 1000 = 10%)
        uint64 minStakingPeriod; // Minimum staking period in seconds
        uint32 campaignId; // Associated campaign ID
        bool enabled; // Whether staking is enabled for this pool
        bool emergencyMode; // Emergency mode for immediate withdrawals
    }

    // User stake information
    struct UserStake {
        uint128 amount; // Amount staked by user
        uint128 rewards; // Accumulated rewards
        uint64 stakingTime; // When user started staking
        uint64 lastRewardUpdate; // Last time rewards were calculated
    }

    // State variables
    ILaunchpad public launchpad;
    uint32 public stakingPoolCount;

    // Mappings

    mapping(address => uint32[]) public userStakingPools; // user => campaignIds they've staked in

    modifier validCampaign(uint32 _campaignId) {
        if (_campaignId == 0 || _campaignId > launchpad.campaignCount()) revert InvalidInput();
        _;
    }

    modifier campaignCompleted(uint32 _campaignId) {
        (, , , , , , , , , bool isFundingComplete, bool isCancelled, ) = launchpad.campaigns(_campaignId);
        if (!isFundingComplete || isCancelled) revert CampaignNotCompleted();
        _;
    }

    modifier stakingEnabled(uint32 _campaignId) {
        if (!stakingPools[_campaignId].enabled) revert StakingNotEnabled();
        _;
    }

    function initialize(address _launchpad, address _owner) public initializer {
        if (_launchpad == address(0) || _owner == address(0)) revert InvalidInput();

        __ReentrancyGuard_init();
        __Ownable_init(_owner);

        launchpad = ILaunchpad(_launchpad);
    }

    /**
     * @notice Creates a staking pool for a completed campaign
     * @param _campaignId The campaign ID
     * @param _apy Annual percentage yield in basis points (e.g., 1000 = 10%)
     * @param _minStakingPeriod Minimum staking period in seconds
     */
    function createStakingPool(
        uint32 _campaignId,
        uint64 _apy,
        uint64 _minStakingPeriod
    ) external onlyOwner validCampaign(_campaignId) campaignCompleted(_campaignId) {
        if (_apy == 0 || _apy > MAX_APY) revert InvalidInput();
        if (_minStakingPeriod < MIN_STAKING_PERIOD || _minStakingPeriod > MAX_STAKING_PERIOD) revert InvalidInput();
        if (address(stakingPools[_campaignId].stakingToken) != address(0)) revert InvalidInput(); // Pool already exists

        // Get token address from launchpad
        (, address tokenAddress, , , , , , , , , , ) = launchpad.campaigns(_campaignId);

        StakingPool storage pool = stakingPools[_campaignId];
        pool.stakingToken = IERC20(tokenAddress);
        pool.apy = _apy;
        pool.minStakingPeriod = _minStakingPeriod;
        pool.campaignId = _campaignId;
        pool.enabled = true;

        stakingPoolCount++;

        emit StakingPoolCreated(_campaignId, tokenAddress, _apy, _minStakingPeriod);
    }



    // View functions

    /**
     * @notice Get user's stake information for a campaign
     * @param _campaignId The campaign ID
     * @param _user User address
     * @return amount Amount staked
     * @return rewards Current rewards
     * @return stakingTime When user started staking
     * @return timeToUnlock Time until user can unstake
     */
    function getUserStakeInfo(
        uint32 _campaignId,
        address _user
    ) external view returns (uint128 amount, uint128 rewards, uint64 stakingTime, uint64 timeToUnlock) {
        UserStake memory userStake = userStakes[_campaignId][_user];
        StakingPool memory pool = stakingPools[_campaignId];

        amount = userStake.amount;
        stakingTime = userStake.stakingTime;

        // Calculate current rewards
        if (amount > 0) {
            uint256 timeStaked = block.timestamp - userStake.lastRewardUpdate;
            uint256 newRewards = (uint256(amount) * pool.apy * timeStaked) / (BASIS_POINTS * SECONDS_PER_YEAR);
            rewards = userStake.rewards + uint128(newRewards);
        }

        // Calculate time to unlock
        uint64 unlockTime = stakingTime + pool.minStakingPeriod;
        timeToUnlock = block.timestamp >= unlockTime ? 0 : unlockTime - uint64(block.timestamp);
    }


    
}