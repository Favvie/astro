// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {TokenStaking} from "./CampaignTokenStaking.sol";
import {TokenFacet} from "./Token.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title TokenStakingTest
 * @dev Comprehensive test suite for TokenStaking contract
 */
contract TokenStakingTest is Test {
    TokenStaking public staking;
    MockLaunchpad public launchpad;
    TokenFacet public token1;
    TokenFacet public token2;

    address public owner = address(1);
    address public user1 = address(2);
    address public user2 = address(3);
    address public user3 = address(4);

    uint32 public constant CAMPAIGN_ID_1 = 1;
    uint32 public constant CAMPAIGN_ID_2 = 2;
    uint64 public constant DEFAULT_APY = 1000; // 10%
    uint64 public constant MIN_STAKING_PERIOD = 7 days;

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

    function setUp() public {
        vm.startPrank(owner);

        // Deploy mock launchpad
        launchpad = new MockLaunchpad();

        // Deploy tokens
        token1 = new TokenFacet("Campaign Token 1", "CT1", owner);
        token2 = new TokenFacet("Campaign Token 2", "CT2", owner);

        // Set up mock campaigns in launchpad
        launchpad.addCampaign(CAMPAIGN_ID_1, address(token1), true, false);
        launchpad.addCampaign(CAMPAIGN_ID_2, address(token2), true, false);

        // Deploy staking contract
        staking = new TokenStaking();
        staking.initialize(address(launchpad), owner);

        // Mint tokens to users
        token1.mint(user1, 10_000 * 10**18);
        token1.mint(user2, 10_000 * 10**18);
        token1.mint(user3, 10_000 * 10**18);
        token1.mint(owner, 100_000 * 10**18); // For rewards

        token2.mint(user1, 10_000 * 10**18);
        token2.mint(user2, 10_000 * 10**18);
        token2.mint(owner, 100_000 * 10**18);

        vm.stopPrank();
    }

    // ============================================
    // INITIALIZATION TESTS
    // ============================================

    function test_Initialize_Success() public view {
        assertEq(address(staking.launchpad()), address(launchpad), "Launchpad address mismatch");
        assertEq(staking.owner(), owner, "Owner mismatch");
        assertEq(staking.stakingPoolCount(), 0, "Initial pool count should be zero");
    }

    function test_Initialize_ZeroAddresses() public {
        TokenStaking newStaking = new TokenStaking();

        vm.expectRevert(TokenStaking.InvalidInput.selector);
        newStaking.initialize(address(0), owner);

        newStaking = new TokenStaking();
        vm.expectRevert(TokenStaking.InvalidInput.selector);
        newStaking.initialize(address(launchpad), address(0));
    }

    function test_Initialize_CannotReinitialize() public {
        vm.expectRevert();
        staking.initialize(address(launchpad), owner);
    }

    // ============================================
    // STAKING POOL CREATION TESTS
    // ============================================

    function test_CreateStakingPool_Success() public {
        vm.startPrank(owner);

        vm.expectEmit(true, true, false, true);
        emit StakingPoolCreated(CAMPAIGN_ID_1, address(token1), DEFAULT_APY, MIN_STAKING_PERIOD);

        staking.createStakingPool(CAMPAIGN_ID_1, DEFAULT_APY, MIN_STAKING_PERIOD);

        assertEq(staking.stakingPoolCount(), 1, "Pool count should be 1");

        (
            address stakingToken,
            uint128 totalStaked,
            uint128 rewardPool,
            uint64 apy,
            uint64 minStakingPeriod,
            bool enabled,
            bool emergencyMode,
            uint256 stakerCount
        ) = staking.getStakingPoolInfo(CAMPAIGN_ID_1);

        assertEq(stakingToken, address(token1), "Staking token mismatch");
        assertEq(totalStaked, 0, "Initial total staked should be zero");
        assertEq(rewardPool, 0, "Initial reward pool should be zero");
        assertEq(apy, DEFAULT_APY, "APY mismatch");
        assertEq(minStakingPeriod, MIN_STAKING_PERIOD, "Min staking period mismatch");
        assertTrue(enabled, "Pool should be enabled");
        assertFalse(emergencyMode, "Emergency mode should be off");
        assertEq(stakerCount, 0, "Initial staker count should be zero");

        vm.stopPrank();
    }

    function test_CreateStakingPool_OnlyOwner() public {
        vm.startPrank(user1);

        vm.expectRevert();
        staking.createStakingPool(CAMPAIGN_ID_1, DEFAULT_APY, MIN_STAKING_PERIOD);

        vm.stopPrank();
    }

    function test_CreateStakingPool_InvalidCampaignId() public {
        vm.startPrank(owner);

        vm.expectRevert(TokenStaking.InvalidInput.selector);
        staking.createStakingPool(0, DEFAULT_APY, MIN_STAKING_PERIOD);

        vm.expectRevert(TokenStaking.InvalidInput.selector);
        staking.createStakingPool(999, DEFAULT_APY, MIN_STAKING_PERIOD);

        vm.stopPrank();
    }

    function test_CreateStakingPool_CampaignNotCompleted() public {
        // Add incomplete campaign
        launchpad.addCampaign(3, address(token1), false, false);

        vm.startPrank(owner);

        vm.expectRevert(TokenStaking.CampaignNotCompleted.selector);
        staking.createStakingPool(3, DEFAULT_APY, MIN_STAKING_PERIOD);

        vm.stopPrank();
    }

    function test_CreateStakingPool_CancelledCampaign() public {
        // Add cancelled campaign
        launchpad.addCampaign(3, address(token1), true, true);

        vm.startPrank(owner);

        vm.expectRevert(TokenStaking.CampaignNotCompleted.selector);
        staking.createStakingPool(3, DEFAULT_APY, MIN_STAKING_PERIOD);

        vm.stopPrank();
    }

    function test_CreateStakingPool_InvalidAPY() public {
        vm.startPrank(owner);

        vm.expectRevert(TokenStaking.InvalidInput.selector);
        staking.createStakingPool(CAMPAIGN_ID_1, 0, MIN_STAKING_PERIOD);

        vm.expectRevert(TokenStaking.InvalidInput.selector);
        staking.createStakingPool(CAMPAIGN_ID_1, 10001, MIN_STAKING_PERIOD); // > MAX_APY

        vm.stopPrank();
    }

    function test_CreateStakingPool_InvalidMinStakingPeriod() public {
        vm.startPrank(owner);

        vm.expectRevert(TokenStaking.InvalidInput.selector);
        staking.createStakingPool(CAMPAIGN_ID_1, DEFAULT_APY, 12 hours); // < MIN_STAKING_PERIOD

        vm.expectRevert(TokenStaking.InvalidInput.selector);
        staking.createStakingPool(CAMPAIGN_ID_1, DEFAULT_APY, 366 days); // > MAX_STAKING_PERIOD

        vm.stopPrank();
    }

    function test_CreateStakingPool_PoolAlreadyExists() public {
        vm.startPrank(owner);

        staking.createStakingPool(CAMPAIGN_ID_1, DEFAULT_APY, MIN_STAKING_PERIOD);

        vm.expectRevert(TokenStaking.InvalidInput.selector);
        staking.createStakingPool(CAMPAIGN_ID_1, DEFAULT_APY, MIN_STAKING_PERIOD);

        vm.stopPrank();
    }

    // ============================================
    // STAKING TESTS
    // ============================================

    function test_StakeTokens_Success() public {
        // Create pool
        vm.prank(owner);
        staking.createStakingPool(CAMPAIGN_ID_1, DEFAULT_APY, MIN_STAKING_PERIOD);

        // Approve and stake
        vm.startPrank(user1);
        token1.approve(address(staking), 1000 * 10**18);

        vm.expectEmit(true, true, false, false);
        emit TokensStaked(CAMPAIGN_ID_1, user1, 1000 * 10**18, block.timestamp);

        staking.stakeTokens(CAMPAIGN_ID_1, 1000 * 10**18);

        (uint128 amount, uint128 rewards, uint64 stakingTime, uint64 timeToUnlock) = staking.getUserStakeInfo(
            CAMPAIGN_ID_1,
            user1
        );

        assertEq(amount, 1000 * 10**18, "Staked amount mismatch");
        assertEq(rewards, 0, "Initial rewards should be zero");
        assertEq(stakingTime, block.timestamp, "Staking time mismatch");
        assertGt(timeToUnlock, 0, "Should have time until unlock");

        vm.stopPrank();
    }

    function test_StakeTokens_MultipleStakes() public {
        vm.prank(owner);
        staking.createStakingPool(CAMPAIGN_ID_1, DEFAULT_APY, MIN_STAKING_PERIOD);

        vm.startPrank(user1);
        token1.approve(address(staking), 5000 * 10**18);

        staking.stakeTokens(CAMPAIGN_ID_1, 1000 * 10**18);
        staking.stakeTokens(CAMPAIGN_ID_1, 2000 * 10**18);

        (uint128 amount, , , ) = staking.getUserStakeInfo(CAMPAIGN_ID_1, user1);

        assertEq(amount, 3000 * 10**18, "Total staked amount should be sum");

        vm.stopPrank();
    }

    function test_StakeTokens_MultipleUsers() public {
        vm.prank(owner);
        staking.createStakingPool(CAMPAIGN_ID_1, DEFAULT_APY, MIN_STAKING_PERIOD);

        vm.prank(user1);
        token1.approve(address(staking), 1000 * 10**18);
        vm.prank(user1);
        staking.stakeTokens(CAMPAIGN_ID_1, 1000 * 10**18);

        vm.prank(user2);
        token1.approve(address(staking), 2000 * 10**18);
        vm.prank(user2);
        staking.stakeTokens(CAMPAIGN_ID_1, 2000 * 10**18);

        (, uint128 totalStaked, , , , , , uint256 stakerCount) = staking.getStakingPoolInfo(CAMPAIGN_ID_1);

        assertEq(totalStaked, 3000 * 10**18, "Total staked mismatch");
        assertEq(stakerCount, 2, "Staker count mismatch");
    }

    function test_StakeTokens_ZeroAmount() public {
        vm.prank(owner);
        staking.createStakingPool(CAMPAIGN_ID_1, DEFAULT_APY, MIN_STAKING_PERIOD);

        vm.startPrank(user1);

        vm.expectRevert(TokenStaking.InvalidInput.selector);
        staking.stakeTokens(CAMPAIGN_ID_1, 0);

        vm.stopPrank();
    }

    function test_StakeTokens_InsufficientBalance() public {
        vm.prank(owner);
        staking.createStakingPool(CAMPAIGN_ID_1, DEFAULT_APY, MIN_STAKING_PERIOD);

        vm.startPrank(user1);
        token1.approve(address(staking), 100_000 * 10**18);

        vm.expectRevert(TokenStaking.InsufficientBalance.selector);
        staking.stakeTokens(CAMPAIGN_ID_1, 100_000 * 10**18); // More than user has

        vm.stopPrank();
    }

    function test_StakeTokens_StakingNotEnabled() public {
        vm.prank(owner);
        staking.createStakingPool(CAMPAIGN_ID_1, DEFAULT_APY, MIN_STAKING_PERIOD);

        // Disable staking
        vm.prank(owner);
        staking.updateStakingPool(CAMPAIGN_ID_1, DEFAULT_APY, false);

        vm.startPrank(user1);
        token1.approve(address(staking), 1000 * 10**18);

        vm.expectRevert(TokenStaking.StakingNotEnabled.selector);
        staking.stakeTokens(CAMPAIGN_ID_1, 1000 * 10**18);

        vm.stopPrank();
    }

    // ============================================
    // UNSTAKING TESTS
    // ============================================

    function test_UnstakeTokens_Success() public {
        vm.prank(owner);
        staking.createStakingPool(CAMPAIGN_ID_1, DEFAULT_APY, MIN_STAKING_PERIOD);

        // Add rewards to pool
        vm.prank(owner);
        token1.approve(address(staking), 10_000 * 10**18);
        vm.prank(owner);
        staking.addRewards(CAMPAIGN_ID_1, 10_000 * 10**18);

        // Stake
        vm.prank(user1);
        token1.approve(address(staking), 1000 * 10**18);
        vm.prank(user1);
        staking.stakeTokens(CAMPAIGN_ID_1, 1000 * 10**18);

        // Fast forward past minimum staking period
        vm.warp(block.timestamp + MIN_STAKING_PERIOD + 1);

        uint256 balanceBefore = token1.balanceOf(user1);

        vm.prank(user1);
        staking.unstakeTokens(CAMPAIGN_ID_1, 1000 * 10**18);

        uint256 balanceAfter = token1.balanceOf(user1);

        assertGt(balanceAfter, balanceBefore + 1000 * 10**18, "Should receive staked tokens plus rewards");

        (uint128 amount, , , ) = staking.getUserStakeInfo(CAMPAIGN_ID_1, user1);
        assertEq(amount, 0, "Staked amount should be zero after full unstake");
    }

    function test_UnstakeTokens_PartialUnstake() public {
        vm.prank(owner);
        staking.createStakingPool(CAMPAIGN_ID_1, DEFAULT_APY, MIN_STAKING_PERIOD);

        vm.prank(user1);
        token1.approve(address(staking), 3000 * 10**18);
        vm.prank(user1);
        staking.stakeTokens(CAMPAIGN_ID_1, 3000 * 10**18);

        vm.warp(block.timestamp + MIN_STAKING_PERIOD + 1);

        vm.prank(user1);
        staking.unstakeTokens(CAMPAIGN_ID_1, 1000 * 10**18);

        (uint128 amount, , , ) = staking.getUserStakeInfo(CAMPAIGN_ID_1, user1);
        assertEq(amount, 2000 * 10**18, "Remaining staked amount should be 2000");
    }

    function test_UnstakeTokens_UnstakeAll_WithZeroAmount() public {
        vm.prank(owner);
        staking.createStakingPool(CAMPAIGN_ID_1, DEFAULT_APY, MIN_STAKING_PERIOD);

        vm.prank(user1);
        token1.approve(address(staking), 1000 * 10**18);
        vm.prank(user1);
        staking.stakeTokens(CAMPAIGN_ID_1, 1000 * 10**18);

        vm.warp(block.timestamp + MIN_STAKING_PERIOD + 1);

        vm.prank(user1);
        staking.unstakeTokens(CAMPAIGN_ID_1, 0); // 0 means unstake all

        (uint128 amount, , , ) = staking.getUserStakeInfo(CAMPAIGN_ID_1, user1);
        assertEq(amount, 0, "Should unstake all tokens");
    }

    function test_UnstakeTokens_BeforeMinimumPeriod() public {
        vm.prank(owner);
        staking.createStakingPool(CAMPAIGN_ID_1, DEFAULT_APY, MIN_STAKING_PERIOD);

        vm.prank(user1);
        token1.approve(address(staking), 1000 * 10**18);
        vm.prank(user1);
        staking.stakeTokens(CAMPAIGN_ID_1, 1000 * 10**18);

        // Try to unstake before minimum period
        vm.prank(user1);
        vm.expectRevert(TokenStaking.StakingPeriodNotEnded.selector);
        staking.unstakeTokens(CAMPAIGN_ID_1, 1000 * 10**18);
    }

    function test_UnstakeTokens_NoStake() public {
        vm.prank(owner);
        staking.createStakingPool(CAMPAIGN_ID_1, DEFAULT_APY, MIN_STAKING_PERIOD);

        vm.prank(user1);
        vm.expectRevert(TokenStaking.InsufficientBalance.selector);
        staking.unstakeTokens(CAMPAIGN_ID_1, 1000 * 10**18);
    }

    // ============================================
    // REWARDS TESTS
    // ============================================

    function test_Rewards_AccumulateOverTime() public {
        vm.prank(owner);
        staking.createStakingPool(CAMPAIGN_ID_1, DEFAULT_APY, MIN_STAKING_PERIOD);

        // Add rewards
        vm.prank(owner);
        token1.approve(address(staking), 10_000 * 10**18);
        vm.prank(owner);
        staking.addRewards(CAMPAIGN_ID_1, 10_000 * 10**18);

        vm.prank(user1);
        token1.approve(address(staking), 1000 * 10**18);
        vm.prank(user1);
        staking.stakeTokens(CAMPAIGN_ID_1, 1000 * 10**18);

        // Check rewards after 1 day
        vm.warp(block.timestamp + 1 days);

        (, uint128 rewards1, , ) = staking.getUserStakeInfo(CAMPAIGN_ID_1, user1);
        assertGt(rewards1, 0, "Should have rewards after 1 day");

        // Check rewards after 7 days
        vm.warp(block.timestamp + 6 days);

        (, uint128 rewards2, , ) = staking.getUserStakeInfo(CAMPAIGN_ID_1, user1);
        assertGt(rewards2, rewards1, "Rewards should increase over time");
    }

    function test_ClaimRewards_Success() public {
        vm.prank(owner);
        staking.createStakingPool(CAMPAIGN_ID_1, DEFAULT_APY, MIN_STAKING_PERIOD);

        // Add rewards
        vm.prank(owner);
        token1.approve(address(staking), 10_000 * 10**18);
        vm.prank(owner);
        staking.addRewards(CAMPAIGN_ID_1, 10_000 * 10**18);

        vm.prank(user1);
        token1.approve(address(staking), 1000 * 10**18);
        vm.prank(user1);
        staking.stakeTokens(CAMPAIGN_ID_1, 1000 * 10**18);

        vm.warp(block.timestamp + 30 days);

        uint256 balanceBefore = token1.balanceOf(user1);

        vm.prank(user1);
        staking.claimRewards(CAMPAIGN_ID_1);

        uint256 balanceAfter = token1.balanceOf(user1);

        assertGt(balanceAfter, balanceBefore, "Should receive rewards");

        // Check staked amount unchanged
        (uint128 amount, uint128 rewards, , ) = staking.getUserStakeInfo(CAMPAIGN_ID_1, user1);
        assertEq(amount, 1000 * 10**18, "Staked amount should not change");
        assertEq(rewards, 0, "Rewards should be reset after claiming");
    }

    function test_ClaimRewards_NoStake() public {
        vm.prank(owner);
        staking.createStakingPool(CAMPAIGN_ID_1, DEFAULT_APY, MIN_STAKING_PERIOD);

        vm.prank(user1);
        vm.expectRevert(TokenStaking.InsufficientBalance.selector);
        staking.claimRewards(CAMPAIGN_ID_1);
    }

    function test_ClaimRewards_NoRewardsAvailable() public {
        vm.prank(owner);
        staking.createStakingPool(CAMPAIGN_ID_1, DEFAULT_APY, MIN_STAKING_PERIOD);

        vm.prank(user1);
        token1.approve(address(staking), 1000 * 10**18);
        vm.prank(user1);
        staking.stakeTokens(CAMPAIGN_ID_1, 1000 * 10**18);

        // Try to claim immediately (no time passed)
        vm.prank(user1);
        vm.expectRevert(TokenStaking.NoRewardsAvailable.selector);
        staking.claimRewards(CAMPAIGN_ID_1);
    }

    function test_AddRewards_Success() public {
        vm.prank(owner);
        staking.createStakingPool(CAMPAIGN_ID_1, DEFAULT_APY, MIN_STAKING_PERIOD);

        vm.startPrank(owner);
        token1.approve(address(staking), 5000 * 10**18);

        vm.expectEmit(true, false, false, true);
        emit RewardsAdded(CAMPAIGN_ID_1, 5000 * 10**18);

        staking.addRewards(CAMPAIGN_ID_1, 5000 * 10**18);

        (, , uint128 rewardPool, , , , , ) = staking.getStakingPoolInfo(CAMPAIGN_ID_1);
        assertEq(rewardPool, 5000 * 10**18, "Reward pool should be updated");

        vm.stopPrank();
    }

    function test_AddRewards_ZeroAmount() public {
        vm.prank(owner);
        staking.createStakingPool(CAMPAIGN_ID_1, DEFAULT_APY, MIN_STAKING_PERIOD);

        vm.prank(owner);
        vm.expectRevert(TokenStaking.InvalidInput.selector);
        staking.addRewards(CAMPAIGN_ID_1, 0);
    }

    function test_CalculateRewards_View() public {
        vm.prank(owner);
        staking.createStakingPool(CAMPAIGN_ID_1, DEFAULT_APY, MIN_STAKING_PERIOD);

        uint128 amount = 1000 * 10**18;
        uint64 duration = 365 days;

        uint256 expectedRewards = staking.calculateRewards(CAMPAIGN_ID_1, amount, duration);

        // APY is 10% (1000 basis points), so for 1 year:
        // rewards = (1000 * 10**18 * 1000 * 365 days) / (10000 * 365 days) = 100 * 10**18
        assertEq(expectedRewards, 100 * 10**18, "Calculated rewards should match expected");
    }

    // ============================================
    // ADMIN FUNCTION TESTS
    // ============================================

    function test_UpdateStakingPool_Success() public {
        vm.prank(owner);
        staking.createStakingPool(CAMPAIGN_ID_1, DEFAULT_APY, MIN_STAKING_PERIOD);

        vm.startPrank(owner);

        uint64 newApy = 2000; // 20%

        vm.expectEmit(true, false, false, true);
        emit StakingPoolUpdated(CAMPAIGN_ID_1, newApy, true);

        staking.updateStakingPool(CAMPAIGN_ID_1, newApy, true);

        (, , , uint64 apy, , bool enabled, , ) = staking.getStakingPoolInfo(CAMPAIGN_ID_1);
        assertEq(apy, newApy, "APY should be updated");
        assertTrue(enabled, "Pool should remain enabled");

        vm.stopPrank();
    }

    function test_UpdateStakingPool_DisablePool() public {
        vm.prank(owner);
        staking.createStakingPool(CAMPAIGN_ID_1, DEFAULT_APY, MIN_STAKING_PERIOD);

        vm.prank(owner);
        staking.updateStakingPool(CAMPAIGN_ID_1, DEFAULT_APY, false);

        (, , , , , bool enabled, , ) = staking.getStakingPoolInfo(CAMPAIGN_ID_1);
        assertFalse(enabled, "Pool should be disabled");
    }

    function test_UpdateStakingPool_OnlyOwner() public {
        vm.prank(owner);
        staking.createStakingPool(CAMPAIGN_ID_1, DEFAULT_APY, MIN_STAKING_PERIOD);

        vm.prank(user1);
        vm.expectRevert();
        staking.updateStakingPool(CAMPAIGN_ID_1, 2000, true);
    }

    function test_UpdateStakingPool_InvalidAPY() public {
        vm.prank(owner);
        staking.createStakingPool(CAMPAIGN_ID_1, DEFAULT_APY, MIN_STAKING_PERIOD);

        vm.prank(owner);
        vm.expectRevert(TokenStaking.InvalidInput.selector);
        staking.updateStakingPool(CAMPAIGN_ID_1, 10001, true); // > MAX_APY
    }

    function test_SetEmergencyMode_Success() public {
        vm.prank(owner);
        staking.createStakingPool(CAMPAIGN_ID_1, DEFAULT_APY, MIN_STAKING_PERIOD);

        vm.prank(owner);
        staking.setEmergencyMode(CAMPAIGN_ID_1, true);

        (, , , , , , bool emergencyMode, ) = staking.getStakingPoolInfo(CAMPAIGN_ID_1);
        assertTrue(emergencyMode, "Emergency mode should be enabled");
    }

    function test_SetEmergencyMode_OnlyOwner() public {
        vm.prank(owner);
        staking.createStakingPool(CAMPAIGN_ID_1, DEFAULT_APY, MIN_STAKING_PERIOD);

        vm.prank(user1);
        vm.expectRevert();
        staking.setEmergencyMode(CAMPAIGN_ID_1, true);
    }

    // ============================================
    // EMERGENCY WITHDRAWAL TESTS
    // ============================================

    function test_EmergencyWithdraw_Success() public {
        vm.prank(owner);
        staking.createStakingPool(CAMPAIGN_ID_1, DEFAULT_APY, MIN_STAKING_PERIOD);

        vm.prank(user1);
        token1.approve(address(staking), 1000 * 10**18);
        vm.prank(user1);
        staking.stakeTokens(CAMPAIGN_ID_1, 1000 * 10**18);

        // Enable emergency mode
        vm.prank(owner);
        staking.setEmergencyMode(CAMPAIGN_ID_1, true);

        uint256 balanceBefore = token1.balanceOf(user1);

        vm.prank(user1);
        vm.expectEmit(true, true, false, true);
        emit EmergencyWithdraw(CAMPAIGN_ID_1, user1, 1000 * 10**18);

        staking.emergencyWithdraw(CAMPAIGN_ID_1);

        uint256 balanceAfter = token1.balanceOf(user1);

        assertEq(balanceAfter, balanceBefore + 1000 * 10**18, "Should receive staked tokens");

        (uint128 amount, uint128 rewards, , ) = staking.getUserStakeInfo(CAMPAIGN_ID_1, user1);
        assertEq(amount, 0, "Staked amount should be zero");
        assertEq(rewards, 0, "Rewards should be zero");
    }

    function test_EmergencyWithdraw_BeforeMinimumPeriod() public {
        vm.prank(owner);
        staking.createStakingPool(CAMPAIGN_ID_1, DEFAULT_APY, MIN_STAKING_PERIOD);

        vm.prank(user1);
        token1.approve(address(staking), 1000 * 10**18);
        vm.prank(user1);
        staking.stakeTokens(CAMPAIGN_ID_1, 1000 * 10**18);

        // Enable emergency mode
        vm.prank(owner);
        staking.setEmergencyMode(CAMPAIGN_ID_1, true);

        // Can withdraw immediately in emergency mode
        vm.prank(user1);
        staking.emergencyWithdraw(CAMPAIGN_ID_1);

        (uint128 amount, , , ) = staking.getUserStakeInfo(CAMPAIGN_ID_1, user1);
        assertEq(amount, 0, "Should be able to emergency withdraw immediately");
    }

    function test_EmergencyWithdraw_NotInEmergencyMode() public {
        vm.prank(owner);
        staking.createStakingPool(CAMPAIGN_ID_1, DEFAULT_APY, MIN_STAKING_PERIOD);

        vm.prank(user1);
        token1.approve(address(staking), 1000 * 10**18);
        vm.prank(user1);
        staking.stakeTokens(CAMPAIGN_ID_1, 1000 * 10**18);

        vm.prank(user1);
        vm.expectRevert(TokenStaking.InvalidInput.selector);
        staking.emergencyWithdraw(CAMPAIGN_ID_1);
    }

    function test_EmergencyWithdraw_NoStake() public {
        vm.prank(owner);
        staking.createStakingPool(CAMPAIGN_ID_1, DEFAULT_APY, MIN_STAKING_PERIOD);

        vm.prank(owner);
        staking.setEmergencyMode(CAMPAIGN_ID_1, true);

        vm.prank(user1);
        vm.expectRevert(TokenStaking.InsufficientBalance.selector);
        staking.emergencyWithdraw(CAMPAIGN_ID_1);
    }

    // ============================================
    // VIEW FUNCTION TESTS
    // ============================================

    function test_GetUserStakeInfo() public {
        vm.prank(owner);
        staking.createStakingPool(CAMPAIGN_ID_1, DEFAULT_APY, MIN_STAKING_PERIOD);

        vm.prank(user1);
        token1.approve(address(staking), 1000 * 10**18);
        vm.prank(user1);
        staking.stakeTokens(CAMPAIGN_ID_1, 1000 * 10**18);

        (uint128 amount, uint128 rewards, uint64 stakingTime, uint64 timeToUnlock) = staking.getUserStakeInfo(
            CAMPAIGN_ID_1,
            user1
        );

        assertEq(amount, 1000 * 10**18, "Amount should match staked");
        assertEq(rewards, 0, "Initial rewards should be zero");
        assertEq(stakingTime, block.timestamp, "Staking time should match");
        assertEq(timeToUnlock, MIN_STAKING_PERIOD, "Time to unlock should match min period");
    }

    function test_GetStakingPoolInfo() public {
        vm.prank(owner);
        staking.createStakingPool(CAMPAIGN_ID_1, DEFAULT_APY, MIN_STAKING_PERIOD);

        (
            address stakingToken,
            uint128 totalStaked,
            uint128 rewardPool,
            uint64 apy,
            uint64 minStakingPeriod,
            bool enabled,
            bool emergencyMode,
            uint256 stakerCount
        ) = staking.getStakingPoolInfo(CAMPAIGN_ID_1);

        assertEq(stakingToken, address(token1), "Token address should match");
        assertEq(totalStaked, 0, "Initial total staked should be zero");
        assertEq(rewardPool, 0, "Initial reward pool should be zero");
        assertEq(apy, DEFAULT_APY, "APY should match");
        assertEq(minStakingPeriod, MIN_STAKING_PERIOD, "Min period should match");
        assertTrue(enabled, "Should be enabled");
        assertFalse(emergencyMode, "Emergency mode should be off");
        assertEq(stakerCount, 0, "Initial staker count should be zero");
    }

    function test_GetUserStakingPools() public {
        vm.prank(owner);
        staking.createStakingPool(CAMPAIGN_ID_1, DEFAULT_APY, MIN_STAKING_PERIOD);
        vm.prank(owner);
        staking.createStakingPool(CAMPAIGN_ID_2, DEFAULT_APY, MIN_STAKING_PERIOD);

        vm.prank(user1);
        token1.approve(address(staking), 1000 * 10**18);
        vm.prank(user1);
        staking.stakeTokens(CAMPAIGN_ID_1, 1000 * 10**18);

        vm.prank(user1);
        token2.approve(address(staking), 1000 * 10**18);
        vm.prank(user1);
        staking.stakeTokens(CAMPAIGN_ID_2, 1000 * 10**18);

        uint32[] memory pools = staking.getUserStakingPools(user1);

        assertEq(pools.length, 2, "User should be in 2 pools");
        assertEq(pools[0], CAMPAIGN_ID_1, "First pool ID should match");
        assertEq(pools[1], CAMPAIGN_ID_2, "Second pool ID should match");
    }

    function test_GetPoolStakers() public {
        vm.prank(owner);
        staking.createStakingPool(CAMPAIGN_ID_1, DEFAULT_APY, MIN_STAKING_PERIOD);

        vm.prank(user1);
        token1.approve(address(staking), 1000 * 10**18);
        vm.prank(user1);
        staking.stakeTokens(CAMPAIGN_ID_1, 1000 * 10**18);

        vm.prank(user2);
        token1.approve(address(staking), 1000 * 10**18);
        vm.prank(user2);
        staking.stakeTokens(CAMPAIGN_ID_1, 1000 * 10**18);

        address[] memory stakers = staking.getPoolStakers(CAMPAIGN_ID_1);

        assertEq(stakers.length, 2, "Should have 2 stakers");
        assertEq(stakers[0], user1, "First staker should be user1");
        assertEq(stakers[1], user2, "Second staker should be user2");
    }

    // ============================================
    // INTEGRATION TESTS
    // ============================================

    function test_Integration_CompleteStakingCycle() public {
        // 1. Create pool
        vm.prank(owner);
        staking.createStakingPool(CAMPAIGN_ID_1, DEFAULT_APY, MIN_STAKING_PERIOD);

        // 2. Add rewards
        vm.prank(owner);
        token1.approve(address(staking), 10_000 * 10**18);
        vm.prank(owner);
        staking.addRewards(CAMPAIGN_ID_1, 10_000 * 10**18);

        // 3. User stakes
        vm.prank(user1);
        token1.approve(address(staking), 1000 * 10**18);
        vm.prank(user1);
        staking.stakeTokens(CAMPAIGN_ID_1, 1000 * 10**18);

        // 4. Time passes
        vm.warp(block.timestamp + 30 days);

        // 5. Claim rewards
        uint256 balanceBefore = token1.balanceOf(user1);
        vm.prank(user1);
        staking.claimRewards(CAMPAIGN_ID_1);
        uint256 balanceAfterClaim = token1.balanceOf(user1);

        assertGt(balanceAfterClaim, balanceBefore, "Should receive rewards");

        // 6. More time passes
        vm.warp(block.timestamp + MIN_STAKING_PERIOD);

        // 7. Unstake
        vm.prank(user1);
        staking.unstakeTokens(CAMPAIGN_ID_1, 0);

        (uint128 amount, , , ) = staking.getUserStakeInfo(CAMPAIGN_ID_1, user1);
        assertEq(amount, 0, "Should have no remaining stake");
    }

    function test_Integration_MultipleUsersMultiplePools() public {
        // Create two pools
        vm.prank(owner);
        staking.createStakingPool(CAMPAIGN_ID_1, DEFAULT_APY, MIN_STAKING_PERIOD);
        vm.prank(owner);
        staking.createStakingPool(CAMPAIGN_ID_2, 2000, MIN_STAKING_PERIOD); // 20% APY

        // Users stake in different pools
        vm.prank(user1);
        token1.approve(address(staking), 1000 * 10**18);
        vm.prank(user1);
        staking.stakeTokens(CAMPAIGN_ID_1, 1000 * 10**18);

        vm.prank(user2);
        token2.approve(address(staking), 2000 * 10**18);
        vm.prank(user2);
        staking.stakeTokens(CAMPAIGN_ID_2, 2000 * 10**18);

        // Verify totals
        (, uint128 totalStaked1, , , , , , ) = staking.getStakingPoolInfo(CAMPAIGN_ID_1);
        (, uint128 totalStaked2, , , , , , ) = staking.getStakingPoolInfo(CAMPAIGN_ID_2);

        assertEq(totalStaked1, 1000 * 10**18, "Pool 1 total should match");
        assertEq(totalStaked2, 2000 * 10**18, "Pool 2 total should match");
    }
}

// Mock Launchpad contract for testing
contract MockLaunchpad {
    struct Campaign {
        address creator;
        address token;
        address uniswapPair;
        uint128 targetAmount;
        uint128 amountRaised;
        uint64 deadline;
        uint32 reserveRatio;
        uint32 blockNumberCreated;
        bool isActive;
        bool isFundingComplete;
        bool isCancelled;
        bool isPromoted;
    }

    mapping(uint256 => Campaign) public campaigns;
    uint32 public campaignCount;

    function addCampaign(uint32 _id, address _token, bool _isFundingComplete, bool _isCancelled) external {
        campaigns[_id] = Campaign({
            creator: address(1),
            token: _token,
            uniswapPair: address(0),
            targetAmount: 1000,
            amountRaised: 1000,
            deadline: uint64(block.timestamp + 30 days),
            reserveRatio: 5000,
            blockNumberCreated: uint32(block.number),
            isActive: true,
            isFundingComplete: _isFundingComplete,
            isCancelled: _isCancelled,
            isPromoted: false
        });

        if (_id > campaignCount) {
            campaignCount = _id;
        }
    }
}
