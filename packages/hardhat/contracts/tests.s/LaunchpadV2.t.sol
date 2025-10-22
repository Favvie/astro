// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {LaunchpadV2, CampaignInfo, IParentContract} from "./LaunchpadV2.sol";
import {TokenFacet} from "./Token.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Mock USDC Token (6 decimals like real USDC)
contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {
        _mint(msg.sender, 1_000_000_000 * 10 ** 6); // 1B USDC
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

// Mock Uniswap V2 Pair
contract MockUniswapV2Pair is ERC20 {
    address public token0;
    address public token1;
    uint112 private reserve0;
    uint112 private reserve1;

    constructor(address _token0, address _token1) ERC20("Uniswap V2", "UNI-V2") {
        token0 = _token0;
        token1 = _token1;
    }

    function mint(address to) external returns (uint256 liquidity) {
        uint256 balance0 = IERC20(token0).balanceOf(address(this));
        uint256 balance1 = IERC20(token1).balanceOf(address(this));

        liquidity = (balance0 + balance1) / 2;
        _mint(to, liquidity);

        reserve0 = uint112(balance0);
        reserve1 = uint112(balance1);

        return liquidity;
    }

    function getReserves() external view returns (uint112, uint112, uint32) {
        return (reserve0, reserve1, uint32(block.timestamp));
    }
}

// Mock Uniswap V2 Factory
contract MockUniswapV2Factory {
    mapping(address => mapping(address => address)) public pairs;

    function createPair(address tokenA, address tokenB) external returns (address pair) {
        require(pairs[tokenA][tokenB] == address(0), "Pair exists");
        pair = address(new MockUniswapV2Pair(tokenA, tokenB));
        pairs[tokenA][tokenB] = pair;
        pairs[tokenB][tokenA] = pair;
        return pair;
    }

    function getPair(address tokenA, address tokenB) external view returns (address) {
        return pairs[tokenA][tokenB];
    }
}

// Mock Uniswap V2 Router
contract MockUniswapV2Router {
    address public factory;
    address public usdc;

    constructor(address _factory) {
        factory = _factory;
    }

    function setUSDC(address _usdc) external {
        usdc = _usdc;
    }

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 /* amountAMin */,
        uint256 /* amountBMin */,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        require(deadline >= block.timestamp, "Expired");

        // Transfer tokens to pair
        address pair = MockUniswapV2Factory(factory).getPair(tokenA, tokenB);
        require(pair != address(0), "Pair doesn't exist");

        IERC20(tokenA).transferFrom(msg.sender, pair, amountADesired);
        IERC20(tokenB).transferFrom(msg.sender, pair, amountBDesired);

        // Mint LP tokens
        liquidity = MockUniswapV2Pair(pair).mint(to);

        return (amountADesired, amountBDesired, liquidity);
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        require(deadline >= block.timestamp, "Expired");
        require(path.length == 2, "Invalid path");

        address tokenIn = path[0];
        address tokenOut = path[1];

        // Transfer input tokens from sender
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);

        // Bidirectional swap logic based on USDC position
        uint256 amountOut;
        if (tokenIn == usdc) {
            // USDC -> Token: 1 USDC (6 decimals) = 1000 tokens (18 decimals)
            // amountIn is in USDC (6 decimals), multiply by 1000 and adjust for decimal difference
            amountOut = amountIn * 1000 * 10**12; // Scale from 6 to 18 decimals and apply 1:1000 ratio
        } else if (tokenOut == usdc) {
            // Token -> USDC: 1000 tokens (18 decimals) = 1 USDC (6 decimals)
            // amountIn is in tokens (18 decimals), divide by 1000 and adjust for decimal difference
            amountOut = amountIn / 1000 / 10**12; // Scale from 18 to 6 decimals and apply 1000:1 ratio
        } else {
            // For other token pairs, use 1:1 ratio
            amountOut = amountIn;
        }

        require(amountOut >= amountOutMin, "Insufficient output");

        // Transfer output tokens to recipient
        IERC20(tokenOut).transfer(to, amountOut);

        amounts = new uint256[](2);
        amounts[0] = amountIn;
        amounts[1] = amountOut;

        return amounts;
    }
}

// Mock Parent Contract (Launchpad)
contract MockParentContract is IParentContract {
    uint32 public override campaignCount;
    mapping(uint256 => CampaignInfo) private _campaigns;
    mapping(uint32 => mapping(address => uint128)) public userInvestments;
    IERC20 public override usdcToken;

    constructor(address _usdcToken) {
        usdcToken = IERC20(_usdcToken);
    }

    function createMockCampaign(
        uint32 _id,
        address _creator,
        address _tokenAddress,
        uint256 _targetAmount,
        uint256 _amountRaised,
        uint256 _totalSupply,
        bool _isFundingComplete,
        address _uniswapPair
    ) external {
        campaignCount = _id;
        _campaigns[_id] = CampaignInfo({
            id: _id,
            creator: _creator,
            targetAmount: _targetAmount,
            amountRaised: _amountRaised,
            tokensSold: _totalSupply / 2,
            totalSupply: _totalSupply,
            tokensForSale: _totalSupply / 2,
            creatorAllocation: _totalSupply / 5,
            liquidityAllocation: _totalSupply / 4,
            platformFeeTokens: _totalSupply / 50,
            deadline: block.timestamp + 30 days,
            tokenAddress: _tokenAddress,
            isActive: true,
            isFundingComplete: _isFundingComplete,
            isCancelled: false,
            name: "Test Token",
            symbol: "TEST",
            description: "Test campaign",
            reserveRatio: 500000,
            blockNumberCreated: block.number,
            promotionalOgPoints: 0,
            isPromoted: false,
            uniswapPair: _uniswapPair
        });
    }

    function setUserInvestment(uint32 _campaignId, address _user, uint128 _amount) external {
        userInvestments[_campaignId][_user] = _amount;
    }

    function getSummaryStats() external view override returns (
        uint256 totalCampaigns,
        uint256 activeCampaigns,
        uint256 completedCampaigns,
        uint256 cancelledCampaigns,
        uint256 expiredCampaigns,
        uint256 totalFundingRaised
    ) {
        return (campaignCount, 0, 0, 0, 0, 0);
    }

    function campaigns(uint256 _campaignId) external view override returns (CampaignInfo memory) {
        return _campaigns[_campaignId];
    }

    function _getCampaignInfo(uint32 _campaignId) external view override returns (CampaignInfo memory) {
        return _campaigns[_campaignId];
    }

    function userParticipatedCampaigns(address) external pure override returns (uint32[] memory) {
        return new uint32[](0);
    }

    function creatorCampaigns(address) external pure override returns (uint32[] memory) {
        return new uint32[](0);
    }

    function getUserInvestment(uint32 campaignId, address user) external view override returns (uint128) {
        return userInvestments[campaignId][user];
    }
}

/**
 * @title LaunchpadV2Test
 * @dev Comprehensive integration test suite for LaunchpadV2 contract
 */
contract LaunchpadV2Test is Test {
    LaunchpadV2 public launchpadV2;
    MockParentContract public parentContract;
    MockUSDC public usdc;
    MockUniswapV2Router public uniswapRouter;
    MockUniswapV2Factory public uniswapFactory;
    TokenFacet public campaignToken;

    address public owner = address(1);
    address public creator = address(2);
    address public investor1 = address(3);
    address public investor2 = address(4);
    address public investor3 = address(5);

    uint32 public constant CAMPAIGN_ID = 1;
    uint256 public constant TOTAL_SUPPLY = 1_000_000 * 10**18;
    uint256 public constant TARGET_AMOUNT = 10_000 * 10**6; // 10k USDC

    // Events
    event RefundClaimed(uint256 indexed campaignId, address indexed investor, uint256 amount);
    event CampaignCancelled(uint256 indexed campaignId, address indexed creator);

    function setUp() public {
        // Deploy mock USDC
        usdc = new MockUSDC();

        // Deploy Uniswap mocks
        uniswapFactory = new MockUniswapV2Factory();
        uniswapRouter = new MockUniswapV2Router(address(uniswapFactory));

        // Set USDC address in router for bidirectional swaps
        uniswapRouter.setUSDC(address(usdc));

        // Deploy mock parent contract
        parentContract = new MockParentContract(address(usdc));

        // Deploy LaunchpadV2
        launchpadV2 = new LaunchpadV2(
            address(parentContract),
            address(usdc),
            address(uniswapRouter),
            address(uniswapFactory)
        );

        // Create campaign token (this contract is the owner)
        campaignToken = new TokenFacet("Test Token", "TEST", address(this));
        campaignToken.mint(address(this), TOTAL_SUPPLY);

        // Distribute USDC
        usdc.mint(creator, 100_000 * 10**6);
        usdc.mint(investor1, 100_000 * 10**6);
        usdc.mint(investor2, 100_000 * 10**6);
        usdc.mint(investor3, 100_000 * 10**6);

        // Distribute campaign tokens to investors for testing swaps
        campaignToken.transfer(investor1, 10_000 * 10**18);
        campaignToken.transfer(investor2, 10_000 * 10**18);
    }

    // ============================================
    // HELPER FUNCTIONS
    // ============================================

    function createFundedCampaignWithLiquidity() internal returns (address pair) {
        // Create a funded campaign
        parentContract.createMockCampaign(
            CAMPAIGN_ID,
            creator,
            address(campaignToken),
            TARGET_AMOUNT,
            TARGET_AMOUNT, // Fully funded
            TOTAL_SUPPLY,
            true, // Funding complete
            address(0)
        );

        // Create Uniswap pair
        pair = uniswapFactory.createPair(address(campaignToken), address(usdc));

        // Update campaign with pair address
        parentContract.createMockCampaign(
            CAMPAIGN_ID,
            creator,
            address(campaignToken),
            TARGET_AMOUNT,
            TARGET_AMOUNT,
            TOTAL_SUPPLY,
            true,
            pair
        );

        // Add initial liquidity
        uint256 tokenAmount = 100_000 * 10**18;
        uint256 usdcAmount = 100_000 * 10**6;

        campaignToken.approve(address(uniswapRouter), tokenAmount);
        usdc.approve(address(uniswapRouter), usdcAmount);

        // Transfer tokens to pair and mint LP tokens
        campaignToken.transfer(pair, tokenAmount);
        usdc.transfer(pair, usdcAmount);
        MockUniswapV2Pair(pair).mint(address(this));

        return pair;
    }

    // ============================================
    // DEPLOYMENT TESTS
    // ============================================

    function test_Deployment_Success() public view {
        assertEq(address(launchpadV2.usdcToken()), address(usdc), "USDC address mismatch");
        assertEq(address(launchpadV2.uniswapRouter()), address(uniswapRouter), "Router address mismatch");
        assertEq(address(launchpadV2.uniswapFactory()), address(uniswapFactory), "Factory address mismatch");
    }

    // ============================================
    // SWAP TOKEN FOR USDC TESTS
    // ============================================

    function test_SwapTokenForUsdc_Success() public {
        createFundedCampaignWithLiquidity();

        uint256 tokenAmount = 1_000 * 10**18;
        uint256 expectedUsdcOut = tokenAmount / 1000 / 10**12; // Based on mock router logic (token to USDC with decimal adjustment)
        uint256 deadline = block.timestamp + 1 hours;

        vm.startPrank(investor1);

        // Approve LaunchpadV2 to spend tokens
        campaignToken.approve(address(launchpadV2), tokenAmount);

        // Fund router with USDC for swap
        vm.stopPrank();
        usdc.transfer(address(uniswapRouter), expectedUsdcOut * 2);

        vm.startPrank(investor1);
        uint256 usdcBalanceBefore = usdc.balanceOf(investor1);

        // Execute swap
        launchpadV2.swapTokenForUsdc(
            CAMPAIGN_ID,
            tokenAmount,
            expectedUsdcOut - 10, // Allow some slippage
            deadline
        );

        uint256 usdcBalanceAfter = usdc.balanceOf(investor1);

        assertGt(usdcBalanceAfter, usdcBalanceBefore, "USDC balance should increase");

        vm.stopPrank();
    }

    function test_SwapTokenForUsdc_CampaignDoesNotExist() public {
        vm.startPrank(investor1);

        campaignToken.approve(address(launchpadV2), 1000 * 10**18);

        vm.expectRevert(LaunchpadV2.CampaignDoesNotExist.selector);
        launchpadV2.swapTokenForUsdc(
            999, // Non-existent campaign
            1000 * 10**18,
            1,
            block.timestamp + 1 hours
        );

        vm.stopPrank();
    }

    function test_SwapTokenForUsdc_ZeroAmount() public {
        createFundedCampaignWithLiquidity();

        vm.startPrank(investor1);

        vm.expectRevert(LaunchpadV2.ZeroValueNotAllowed.selector);
        launchpadV2.swapTokenForUsdc(
            CAMPAIGN_ID,
            0, // Zero amount
            1,
            block.timestamp + 1 hours
        );

        vm.stopPrank();
    }

    function test_SwapTokenForUsdc_DeadlineExpired() public {
        createFundedCampaignWithLiquidity();

        vm.startPrank(investor1);

        campaignToken.approve(address(launchpadV2), 1000 * 10**18);

        vm.expectRevert(LaunchpadV2.DeadlineExpired.selector);
        launchpadV2.swapTokenForUsdc(
            CAMPAIGN_ID,
            1000 * 10**18,
            1,
            block.timestamp - 1 // Expired deadline
        );

        vm.stopPrank();
    }

    function test_SwapTokenForUsdc_FundingNotComplete() public {
        // Create unfunded campaign
        parentContract.createMockCampaign(
            CAMPAIGN_ID,
            creator,
            address(campaignToken),
            TARGET_AMOUNT,
            5_000 * 10**6, // Only half funded
            TOTAL_SUPPLY,
            false, // Funding not complete
            address(0)
        );

        vm.startPrank(investor1);

        campaignToken.approve(address(launchpadV2), 1000 * 10**18);

        vm.expectRevert(LaunchpadV2.FundingNotMet.selector);
        launchpadV2.swapTokenForUsdc(
            CAMPAIGN_ID,
            1000 * 10**18,
            1,
            block.timestamp + 1 hours
        );

        vm.stopPrank();
    }

    function test_SwapTokenForUsdc_NotEnoughTokens() public {
        createFundedCampaignWithLiquidity();

        vm.startPrank(investor3); // Has no tokens

        campaignToken.approve(address(launchpadV2), 1000 * 10**18);

        vm.expectRevert(LaunchpadV2.NotEnoughTokens.selector);
        launchpadV2.swapTokenForUsdc(
            CAMPAIGN_ID,
            1000 * 10**18,
            1,
            block.timestamp + 1 hours
        );

        vm.stopPrank();
    }

    // ============================================
    // SWAP USDC FOR TOKEN TESTS
    // ============================================

    function test_SwapUsdcForToken_Success() public {
        createFundedCampaignWithLiquidity();

        uint256 usdcAmount = 100 * 10**6; // 100 USDC = 100,000 tokens
        uint256 expectedTokenOut = usdcAmount * 1000 * 10**12; // Based on mock router logic (USDC to token with decimal adjustment)
        uint256 deadline = block.timestamp + 1 hours;

        vm.startPrank(investor3);

        // Approve LaunchpadV2 to spend USDC
        usdc.approve(address(launchpadV2), usdcAmount);

        // Fund router with tokens for swap (using test contract address, not owner)
        vm.stopPrank();
        campaignToken.transfer(address(uniswapRouter), expectedTokenOut * 2);

        vm.startPrank(investor3);
        uint256 tokenBalanceBefore = campaignToken.balanceOf(investor3);

        // Execute swap
        launchpadV2.swapUsdcForToken(
            CAMPAIGN_ID,
            usdcAmount,
            expectedTokenOut - 100, // Allow some slippage
            deadline
        );

        uint256 tokenBalanceAfter = campaignToken.balanceOf(investor3);

        assertGt(tokenBalanceAfter, tokenBalanceBefore, "Token balance should increase");

        vm.stopPrank();
    }

    function test_SwapUsdcForToken_CampaignDoesNotExist() public {
        vm.startPrank(investor3);

        usdc.approve(address(launchpadV2), 1000 * 10**6);

        vm.expectRevert(LaunchpadV2.CampaignDoesNotExist.selector);
        launchpadV2.swapUsdcForToken(
            999,
            1000 * 10**6,
            1,
            block.timestamp + 1 hours
        );

        vm.stopPrank();
    }

    function test_SwapUsdcForToken_ZeroAmount() public {
        createFundedCampaignWithLiquidity();

        vm.startPrank(investor3);

        vm.expectRevert(LaunchpadV2.ZeroValueNotAllowed.selector);
        launchpadV2.swapUsdcForToken(
            CAMPAIGN_ID,
            0,
            1,
            block.timestamp + 1 hours
        );

        vm.stopPrank();
    }

    function test_SwapUsdcForToken_DeadlineExpired() public {
        createFundedCampaignWithLiquidity();

        vm.startPrank(investor3);

        usdc.approve(address(launchpadV2), 1000 * 10**6);

        vm.expectRevert(LaunchpadV2.DeadlineExpired.selector);
        launchpadV2.swapUsdcForToken(
            CAMPAIGN_ID,
            1000 * 10**6,
            1,
            block.timestamp - 1
        );

        vm.stopPrank();
    }

    function test_SwapUsdcForToken_FundingNotComplete() public {
        parentContract.createMockCampaign(
            CAMPAIGN_ID,
            creator,
            address(campaignToken),
            TARGET_AMOUNT,
            5_000 * 10**6,
            TOTAL_SUPPLY,
            false,
            address(0)
        );

        vm.startPrank(investor3);

        usdc.approve(address(launchpadV2), 1000 * 10**6);

        vm.expectRevert(LaunchpadV2.FundingNotMet.selector);
        launchpadV2.swapUsdcForToken(
            CAMPAIGN_ID,
            1000 * 10**6,
            1,
            block.timestamp + 1 hours
        );

        vm.stopPrank();
    }

    // ============================================
    // ADD LIQUIDITY TO POOL TESTS
    // ============================================

    function test_AddLiquidityToPool_Success() public {
        address pair = createFundedCampaignWithLiquidity();

        uint256 tokenAmount = 5_000 * 10**18;
        uint256 usdcAmount = 5_000 * 10**6;
        uint256 deadline = block.timestamp + 1 hours;

        vm.startPrank(investor1);

        // Approve LaunchpadV2
        campaignToken.approve(address(launchpadV2), tokenAmount);
        usdc.approve(address(launchpadV2), usdcAmount);

        uint256 lpBalanceBefore = MockUniswapV2Pair(pair).balanceOf(investor1);

        // Add liquidity
        launchpadV2.addLiquidityToPool(
            CAMPAIGN_ID,
            tokenAmount,
            usdcAmount,
            tokenAmount * 95 / 100, // 5% slippage
            usdcAmount * 95 / 100,
            deadline
        );

        uint256 lpBalanceAfter = MockUniswapV2Pair(pair).balanceOf(investor1);

        assertGt(lpBalanceAfter, lpBalanceBefore, "LP tokens should be received");

        vm.stopPrank();
    }

    function test_AddLiquidityToPool_CampaignDoesNotExist() public {
        vm.startPrank(investor1);

        vm.expectRevert(LaunchpadV2.CampaignDoesNotExist.selector);
        launchpadV2.addLiquidityToPool(
            999,
            1000 * 10**18,
            1000 * 10**6,
            1,
            1,
            block.timestamp + 1 hours
        );

        vm.stopPrank();
    }

    function test_AddLiquidityToPool_ZeroTokenAmount() public {
        createFundedCampaignWithLiquidity();

        vm.startPrank(investor1);

        vm.expectRevert(LaunchpadV2.ZeroValueNotAllowed.selector);
        launchpadV2.addLiquidityToPool(
            CAMPAIGN_ID,
            0, // Zero token amount
            1000 * 10**6,
            1,
            1,
            block.timestamp + 1 hours
        );

        vm.stopPrank();
    }

    function test_AddLiquidityToPool_ZeroUsdcAmount() public {
        createFundedCampaignWithLiquidity();

        vm.startPrank(investor1);

        vm.expectRevert(LaunchpadV2.ZeroValueNotAllowed.selector);
        launchpadV2.addLiquidityToPool(
            CAMPAIGN_ID,
            1000 * 10**18,
            0, // Zero USDC amount
            1,
            1,
            block.timestamp + 1 hours
        );

        vm.stopPrank();
    }

    function test_AddLiquidityToPool_DeadlineExpired() public {
        createFundedCampaignWithLiquidity();

        vm.startPrank(investor1);

        vm.expectRevert(LaunchpadV2.DeadlineExpired.selector);
        launchpadV2.addLiquidityToPool(
            CAMPAIGN_ID,
            1000 * 10**18,
            1000 * 10**6,
            1,
            1,
            block.timestamp - 1 // Expired
        );

        vm.stopPrank();
    }

    function test_AddLiquidityToPool_FundingNotComplete() public {
        parentContract.createMockCampaign(
            CAMPAIGN_ID,
            creator,
            address(campaignToken),
            TARGET_AMOUNT,
            5_000 * 10**6,
            TOTAL_SUPPLY,
            false,
            address(0)
        );

        vm.startPrank(investor1);

        campaignToken.approve(address(launchpadV2), 1000 * 10**18);
        usdc.approve(address(launchpadV2), 1000 * 10**6);

        vm.expectRevert(LaunchpadV2.FundingNotMet.selector);
        launchpadV2.addLiquidityToPool(
            CAMPAIGN_ID,
            1000 * 10**18,
            1000 * 10**6,
            1,
            1,
            block.timestamp + 1 hours
        );

        vm.stopPrank();
    }

    function test_AddLiquidityToPool_NotEnoughTokens() public {
        createFundedCampaignWithLiquidity();

        vm.startPrank(investor3); // Has no campaign tokens

        campaignToken.approve(address(launchpadV2), 1000 * 10**18);
        usdc.approve(address(launchpadV2), 1000 * 10**6);

        vm.expectRevert(LaunchpadV2.NotEnoughTokens.selector);
        launchpadV2.addLiquidityToPool(
            CAMPAIGN_ID,
            1000 * 10**18,
            1000 * 10**6,
            1,
            1,
            block.timestamp + 1 hours
        );

        vm.stopPrank();
    }

    // ============================================
    // VIEW FUNCTION TESTS - Edge Cases Only
    // Note: Integration tests for view functions are in LaunchpadV2.integration.ts
    // ============================================

    function test_GetAllCampaignsPaginated_InvalidLimit() public {
        parentContract.createMockCampaign(
            CAMPAIGN_ID,
            creator,
            address(campaignToken),
            TARGET_AMOUNT,
            TARGET_AMOUNT,
            TOTAL_SUPPLY,
            true,
            address(0)
        );

        vm.expectRevert(LaunchpadV2.InvalidInput.selector);
        launchpadV2.getAllCampaignsPaginated(0, 0); // Zero limit

        vm.expectRevert(LaunchpadV2.InvalidInput.selector);
        launchpadV2.getAllCampaignsPaginated(0, 51); // Limit > 50
    }

    function test_GetAllCampaignsPaginated_OffsetOutOfBounds() public {
        parentContract.createMockCampaign(
            CAMPAIGN_ID,
            creator,
            address(campaignToken),
            TARGET_AMOUNT,
            TARGET_AMOUNT,
            TOTAL_SUPPLY,
            true,
            address(0)
        );

        (CampaignInfo[] memory campaigns, uint32 total, bool hasMore) =
            launchpadV2.getAllCampaignsPaginated(100, 10);

        assertEq(campaigns.length, 0, "Should return empty array");
        assertEq(total, 1, "Total should be 1");
        assertFalse(hasMore, "Should not have more");
    }

    function test_PreviewPurchase_Success() public {
        parentContract.createMockCampaign(
            CAMPAIGN_ID,
            creator,
            address(campaignToken),
            TARGET_AMOUNT,
            5_000 * 10**6,
            TOTAL_SUPPLY,
            false, // Not yet complete
            address(0)
        );

        uint256 usdcAmount = 1000 * 10**6;
        uint256 tokensReceived = launchpadV2.previewPurchase(CAMPAIGN_ID, usdcAmount);

        // Should return calculated tokens based on bonding curve
        assertGt(tokensReceived, 0, "Should receive tokens");
    }

    function test_PreviewPurchase_InactiveCampaign() public {
        // Campaign doesn't exist, should revert with InvalidInput
        vm.expectRevert(LaunchpadV2.InvalidInput.selector);
        launchpadV2.previewPurchase(999, 1000 * 10**6);
    }
}
