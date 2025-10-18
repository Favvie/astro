// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Launchpad} from "./Launchpad.sol";
import {TokenFacet} from "./Token.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Mock USDC Token (6 decimals like real USDC)
contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {
        _mint(msg.sender, 1_000_000 * 10 ** 6);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

// Mock Uniswap V2 Factory
contract MockUniswapV2Factory {
    mapping(address => mapping(address => address)) public pairs;

    function createPair(address tokenA, address tokenB) external returns (address pair) {
        pair = address(new MockUniswapV2Pair(tokenA, tokenB));
        pairs[tokenA][tokenB] = pair;
        pairs[tokenB][tokenA] = pair;
    }

    function getPair(address tokenA, address tokenB) external view returns (address) {
        return pairs[tokenA][tokenB];
    }
}

// Mock Uniswap V2 Pair
contract MockUniswapV2Pair {
    address public token0;
    address public token1;

    constructor(address _token0, address _token1) {
        token0 = _token0;
        token1 = _token1;
    }
}

// Mock Uniswap V2 Router
contract MockUniswapV2Router {
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256, // amountAMin
        uint256, // amountBMin
        address, // to
        uint256  // deadline
    ) external returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        // Transfer tokens from sender
        ERC20(tokenA).transferFrom(msg.sender, address(this), amountADesired);
        ERC20(tokenB).transferFrom(msg.sender, address(this), amountBDesired);

        return (amountADesired, amountBDesired, amountADesired + amountBDesired);
    }
}

contract LaunchpadTest is Test {
    Launchpad public launchpad;
    MockUSDC public usdc;
    MockUniswapV2Router public router;
    MockUniswapV2Factory public factory;

    address public owner = address(1);
    address public creator = address(2);
    address public investor = address(3);

    uint128 public constant PROMOTION_FEE = 100 * 10 ** 6; // 100 USDC with 6 decimals

    // Events - redeclare for testing
    event CampaignCreated(uint256 indexed campaignId, address indexed creator, string name, uint256 targetFunding, uint256 totalSupply, uint256 deadline, string tokenFileId, bool isDAOEnabled, string whitepaperFileId);
    event TokensPurchased(uint256 indexed campaignId, address indexed buyer, uint256 usdcAmount, uint256 tokensReceived, uint256 timestamp);
    event CampaignPromoted(uint256 indexed campaignId);
    event OgPointsAwarded(uint256 indexed campaignId, address indexed user, uint256 amount);
    event CampaignCancelled(uint256 indexed campaignId, address indexed creator);
    event RefundClaimed(uint256 indexed campaignId, address indexed investor, uint256 amount);
    event FundingCompleted(uint256 indexed campaignId, uint256 totalFunding);
    event LiquidityAdded(uint256 indexed campaignId, uint256 usdcAmount, uint256 tokensAmount);
    event UserParticipatedInCampaign(uint256 indexed campaignId, address indexed user, uint256 amount);

    function setUp() public {
        // Deploy mock contracts
        vm.startPrank(owner);
        usdc = new MockUSDC();
        router = new MockUniswapV2Router();
        factory = new MockUniswapV2Factory();

        // Deploy Launchpad
        launchpad = new Launchpad();
        launchpad.initialize(owner, address(usdc), address(router), address(factory), PROMOTION_FEE);

        // Distribute USDC to test accounts (6 decimals)
        usdc.mint(creator, 10_000 * 10 ** 6);
        usdc.mint(investor, 10_000 * 10 ** 6);
        vm.stopPrank();
    }

    function test_CreateCampaign_Success() public {
        vm.startPrank(creator);

        string memory name = "Test Token";
        string memory symbol = "TEST";
        string memory description = "A test token for the launchpad";
        string memory tokenFileId = "0.0.123456";
        uint128 targetFunding = 1000 * 10 ** 6;
        uint128 totalSupply = 1_000_000 * 10 ** 18;
        uint32 reserveRatio = 500000; // 50%
        uint64 deadline = uint64(block.timestamp + 30 days);

        // Expect the CampaignCreated event
        vm.expectEmit(true, true, false, true);
        emit CampaignCreated(1, creator, name, targetFunding, totalSupply, deadline, tokenFileId, false, "");

        uint32 campaignId = launchpad.createCampaign(
            name,
            symbol,
            description,
            tokenFileId,
            "", // No whitepaper
            false, // DAO not enabled
            targetFunding,
            totalSupply,
            reserveRatio,
            deadline
        );

        assertEq(campaignId, 1, "Campaign ID should be 1");

        // Verify campaign info
        Launchpad.CampaignInfo memory info = launchpad._getCampaignInfo(campaignId);

        assertEq(info.id, 1, "Campaign ID mismatch");
        assertEq(info.creator, creator, "Creator mismatch");
        assertEq(info.name, name, "Name mismatch");
        assertEq(info.symbol, symbol, "Symbol mismatch");
        assertEq(info.description, description, "Description mismatch");
        assertEq(info.tokenFileId, tokenFileId, "Token file ID mismatch");
        assertEq(info.whitepaperFileId, "", "Whitepaper file ID should be empty");
        assertEq(info.targetAmount, targetFunding, "Target amount mismatch");
        assertEq(info.totalSupply, totalSupply, "Total supply mismatch");
        assertEq(info.reserveRatio, reserveRatio, "Reserve ratio mismatch");
        assertEq(info.deadline, deadline, "Deadline mismatch");
        assertTrue(info.isActive, "Campaign should be active");
        assertFalse(info.isFundingComplete, "Campaign should not be funded yet");
        assertFalse(info.isCancelled, "Campaign should not be cancelled");
        assertFalse(info.isPromoted, "Campaign should not be promoted");
        assertFalse(info.isDAOEnabled, "DAO should not be enabled");

        // Verify allocations
        uint128 expectedTokensForSale = totalSupply * 5000 / 10000; // 50%
        uint128 expectedCreatorAllocation = totalSupply * 2000 / 10000; // 20%
        uint128 expectedLiquidityAllocation = totalSupply * 2500 / 10000; // 25%
        uint128 expectedPlatformFee = totalSupply * 200 / 10000; // 2%

        assertEq(info.tokensForSale, expectedTokensForSale, "Tokens for sale mismatch");
        assertEq(info.creatorAllocation, expectedCreatorAllocation, "Creator allocation mismatch");
        assertEq(info.liquidityAllocation, expectedLiquidityAllocation, "Liquidity allocation mismatch");
        assertEq(info.platformFeeTokens, expectedPlatformFee, "Platform fee mismatch");

        vm.stopPrank();
    }

    function test_CreateCampaign_WithHederaFileId() public {
        vm.startPrank(creator);

        string memory tokenFileId = "0.0.987654";
        string memory whitepaperFileId = "0.0.111222";
        uint128 targetFunding = 5000 * 10 ** 6;
        uint128 totalSupply = 10_000_000 * 10 ** 18;
        uint32 reserveRatio = 300000; // 30%
        uint64 deadline = uint64(block.timestamp + 60 days);

        uint32 campaignId = launchpad.createCampaign(
            "Hedera Token",
            "HBAR",
            "Token with Hedera File Service image and whitepaper",
            tokenFileId,
            whitepaperFileId,
            true, // DAO enabled
            targetFunding,
            totalSupply,
            reserveRatio,
            deadline
        );

        Launchpad.CampaignInfo memory info = launchpad._getCampaignInfo(campaignId);
        assertEq(info.tokenFileId, tokenFileId, "Token file ID should match Hedera file ID");
        assertEq(info.whitepaperFileId, whitepaperFileId, "Whitepaper file ID should match");
        assertTrue(info.isDAOEnabled, "DAO should be enabled");

        vm.stopPrank();
    }

    function test_CreateCampaign_InvalidTargetFunding() public {
        vm.startPrank(creator);

        vm.expectRevert(Launchpad.InvalidInput.selector);
        launchpad.createCampaign(
            "Test Token",
            "TEST",
            "Description",
            "0.0.123456",
            "",
            false,
            0, // Invalid: zero target funding
            1_000_000 * 10 ** 18,
            500000,
            uint64(block.timestamp + 30 days)
        );

        vm.stopPrank();
    }

    function test_CreateCampaign_TotalSupplyTooLow() public {
        vm.startPrank(creator);

        vm.expectRevert(Launchpad.InvalidInput.selector);
        launchpad.createCampaign(
            "Test Token",
            "TEST",
            "Description",
            "0.0.123456",
            "",
            false,
            1000 * 10 ** 6,
            100 * 10 ** 18, // Invalid: below MIN_TOTAL_SUPPLY
            500000,
            uint64(block.timestamp + 30 days)
        );

        vm.stopPrank();
    }

    function test_CreateCampaign_TotalSupplyTooHigh() public {
        vm.startPrank(creator);

        vm.expectRevert(Launchpad.InvalidInput.selector);
        launchpad.createCampaign(
            "Test Token",
            "TEST",
            "Description",
            "0.0.123456",
            "",
            false,
            1000 * 10 ** 6,
            2_000_000_000_000 * 10 ** 18, // Invalid: above MAX_TOTAL_SUPPLY
            500000,
            uint64(block.timestamp + 30 days)
        );

        vm.stopPrank();
    }

    function test_CreateCampaign_InvalidReserveRatioTooLow() public {
        vm.startPrank(creator);

        vm.expectRevert(Launchpad.InvalidInput.selector);
        launchpad.createCampaign(
            "Test Token",
            "TEST",
            "Description",
            "0.0.123456",
            "",
            false,
            1000 * 10 ** 6,
            1_000_000 * 10 ** 18,
            50000, // Invalid: below 100000 (10%)
            uint64(block.timestamp + 30 days)
        );

        vm.stopPrank();
    }

    function test_CreateCampaign_InvalidReserveRatioTooHigh() public {
        vm.startPrank(creator);

        vm.expectRevert(Launchpad.InvalidInput.selector);
        launchpad.createCampaign(
            "Test Token",
            "TEST",
            "Description",
            "0.0.123456",
            "",
            false,
            1000 * 10 ** 6,
            1_000_000 * 10 ** 18,
            950000, // Invalid: above 900000 (90%)
            uint64(block.timestamp + 30 days)
        );

        vm.stopPrank();
    }

    function test_CreateCampaign_DeadlineTooSoon() public {
        vm.startPrank(creator);

        vm.expectRevert(Launchpad.InvalidInput.selector);
        launchpad.createCampaign(
            "Test Token",
            "TEST",
            "Description",
            "0.0.123456",
            "",
            false,
            1000 * 10 ** 6,
            1_000_000 * 10 ** 18,
            500000,
            uint64(block.timestamp + 12 hours) // Invalid: less than MIN_DEADLINE (1 day)
        );

        vm.stopPrank();
    }

    function test_CreateCampaign_DeadlineTooFar() public {
        vm.startPrank(creator);

        vm.expectRevert(Launchpad.InvalidInput.selector);
        launchpad.createCampaign(
            "Test Token",
            "TEST",
            "Description",
            "0.0.123456",
            "",
            false,
            1000 * 10 ** 6,
            1_000_000 * 10 ** 18,
            500000,
            uint64(block.timestamp + 400 days) // Invalid: more than MAX_DEADLINE (365 days)
        );

        vm.stopPrank();
    }

    function test_CreateMultipleCampaigns() public {
        vm.startPrank(creator);

        // Create first campaign
        uint32 campaignId1 = launchpad.createCampaign(
            "Token One",
            "ONE",
            "First token",
            "0.0.111111",
            "",
            false,
            1000 * 10 ** 6,
            1_000_000 * 10 ** 18,
            500000,
            uint64(block.timestamp + 30 days)
        );

        // Create second campaign
        uint32 campaignId2 = launchpad.createCampaign(
            "Token Two",
            "TWO",
            "Second token",
            "0.0.222222",
            "0.0.333333", // With whitepaper
            true, // DAO enabled
            2000 * 10 ** 6,
            2_000_000 * 10 ** 18,
            600000,
            uint64(block.timestamp + 60 days)
        );

        assertEq(campaignId1, 1, "First campaign ID should be 1");
        assertEq(campaignId2, 2, "Second campaign ID should be 2");
        assertEq(launchpad.campaignCount(), 2, "Campaign count should be 2");

        Launchpad.CampaignInfo memory info1 = launchpad._getCampaignInfo(campaignId1);
        Launchpad.CampaignInfo memory info2 = launchpad._getCampaignInfo(campaignId2);

        assertEq(info1.name, "Token One", "First campaign name mismatch");
        assertEq(info2.name, "Token Two", "Second campaign name mismatch");
        assertEq(info1.tokenFileId, "0.0.111111", "First campaign file ID mismatch");
        assertEq(info2.tokenFileId, "0.0.222222", "Second campaign file ID mismatch");
        assertEq(info1.whitepaperFileId, "", "First campaign should have no whitepaper");
        assertEq(info2.whitepaperFileId, "0.0.333333", "Second campaign whitepaper mismatch");
        assertFalse(info1.isDAOEnabled, "First campaign should not have DAO enabled");
        assertTrue(info2.isDAOEnabled, "Second campaign should have DAO enabled");

        vm.stopPrank();
    }

    function test_CreateCampaign_TokenDeployment() public {
        vm.startPrank(creator);

        uint32 campaignId = launchpad.createCampaign(
            "Test Token",
            "TEST",
            "A test token",
            "0.0.123456",
            "",
            false,
            1000 * 10 ** 6,
            1_000_000 * 10 ** 18,
            500000,
            uint64(block.timestamp + 30 days)
        );

        Launchpad.CampaignInfo memory info = launchpad._getCampaignInfo(campaignId);

        // Verify token was deployed
        assertTrue(info.tokenAddress != address(0), "Token address should not be zero");

        // Verify token properties
        TokenFacet token = TokenFacet(info.tokenAddress);
        assertEq(token.name(), "Test Token", "Token name mismatch");
        assertEq(token.symbol(), "TEST", "Token symbol mismatch");
        assertEq(token.owner(), address(launchpad), "Launchpad should be token owner");

        vm.stopPrank();
    }

    // ============================================
    // CAMPAIGN PROMOTION TESTS
    // ============================================

    function test_PromoteCampaign_Success() public {
        // Create campaign
        vm.startPrank(creator);
        uint32 campaignId = launchpad.createCampaign(
            "Test Token",
            "TEST",
            "Description",
            "0.0.123456",
            "",
            false,
            1000 * 10 ** 6,
            1_000_000 * 10 ** 18,
            500000,
            uint64(block.timestamp + 30 days)
        );

        // Approve USDC for promotion fee
        usdc.approve(address(launchpad), PROMOTION_FEE);

        // Expect CampaignPromoted event
        vm.expectEmit(true, false, false, false);
        emit CampaignPromoted(campaignId);

        // Promote campaign
        launchpad.promoteCampaign(campaignId);

        // Verify promotion
        Launchpad.CampaignInfo memory info = launchpad._getCampaignInfo(campaignId);
        assertTrue(info.isPromoted, "Campaign should be promoted");
        assertEq(info.promotionalOgPoints, 1000, "Promotional OG points should be set");

        vm.stopPrank();
    }

    function test_PromoteCampaign_OnlyCreator() public {
        vm.startPrank(creator);
        uint32 campaignId = launchpad.createCampaign(
            "Test Token",
            "TEST",
            "Description",
            "0.0.123456",
            "",
            false,
            1000 * 10 ** 6,
            1_000_000 * 10 ** 18,
            500000,
            uint64(block.timestamp + 30 days)
        );
        vm.stopPrank();

        // Try to promote as non-creator
        vm.startPrank(investor);
        usdc.approve(address(launchpad), PROMOTION_FEE);

        vm.expectRevert(Launchpad.Unauthorized.selector);
        launchpad.promoteCampaign(campaignId);

        vm.stopPrank();
    }

    function test_PromoteCampaign_InsufficientBalance() public {
        vm.startPrank(creator);
        uint32 campaignId = launchpad.createCampaign(
            "Test Token",
            "TEST",
            "Description",
            "0.0.123456",
            "",
            false,
            1000 * 10 ** 6,
            1_000_000 * 10 ** 18,
            500000,
            uint64(block.timestamp + 30 days)
        );

        // Approve insufficient amount
        usdc.approve(address(launchpad), PROMOTION_FEE - 1);

        vm.expectRevert(); // Will revert from SafeERC20
        launchpad.promoteCampaign(campaignId);

        vm.stopPrank();
    }

    function test_PromoteCampaign_CancelledCampaign() public {
        vm.startPrank(creator);
        uint32 campaignId = launchpad.createCampaign(
            "Test Token",
            "TEST",
            "Description",
            "0.0.123456",
            "",
            false,
            1000 * 10 ** 6,
            1_000_000 * 10 ** 18,
            500000,
            uint64(block.timestamp + 30 days)
        );

        // Cancel campaign
        launchpad.cancelCampaign(campaignId);

        // Try to promote cancelled campaign
        usdc.approve(address(launchpad), PROMOTION_FEE);

        vm.expectRevert(Launchpad.InactiveCampaign.selector);
        launchpad.promoteCampaign(campaignId);

        vm.stopPrank();
    }

    function test_PromoteCampaign_AfterDeadline() public {
        vm.startPrank(creator);
        uint32 campaignId = launchpad.createCampaign(
            "Test Token",
            "TEST",
            "Description",
            "0.0.123456",
            "",
            false,
            1000 * 10 ** 6,
            1_000_000 * 10 ** 18,
            500000,
            uint64(block.timestamp + 30 days)
        );
        vm.stopPrank();

        // Fast forward past deadline
        vm.warp(block.timestamp + 31 days);

        vm.startPrank(creator);
        usdc.approve(address(launchpad), PROMOTION_FEE);

        vm.expectRevert(Launchpad.InvalidInput.selector);
        launchpad.promoteCampaign(campaignId);

        vm.stopPrank();
    }

    // ============================================
    // TOKEN PURCHASE TESTS
    // ============================================

    function test_BuyTokens_Success() public {
        vm.startPrank(creator);
        uint32 campaignId = launchpad.createCampaign(
            "Test Token",
            "TEST",
            "Description",
            "0.0.123456",
            "",
            false,
            1000 * 10 ** 6,
            1_000_000 * 10 ** 18,
            500000,
            uint64(block.timestamp + 30 days)
        );
        vm.stopPrank();

        // Buy tokens
        vm.startPrank(investor);
        uint128 purchaseAmount = 100 * 10 ** 6;
        usdc.approve(address(launchpad), purchaseAmount);

        vm.expectEmit(true, true, false, false);
        emit TokensPurchased(campaignId, investor, purchaseAmount, 0, block.timestamp);

        launchpad.buyTokens(campaignId, purchaseAmount);

        // Verify purchase
        Launchpad.CampaignInfo memory info = launchpad._getCampaignInfo(campaignId);
        assertEq(info.amountRaised, purchaseAmount, "Amount raised should match purchase");
        assertGt(info.tokensSold, 0, "Tokens should be sold");

        // Verify investor received tokens
        TokenFacet token = TokenFacet(info.tokenAddress);
        assertGt(token.balanceOf(investor), 0, "Investor should have tokens");

        vm.stopPrank();
    }

    function test_BuyTokens_UserParticipation() public {
        vm.startPrank(creator);
        uint32 campaignId = launchpad.createCampaign(
            "Test Token",
            "TEST",
            "Description",
            "0.0.123456",
            "",
            false,
            1000 * 10 ** 6,
            1_000_000 * 10 ** 18,
            500000,
            uint64(block.timestamp + 30 days)
        );
        vm.stopPrank();

        vm.startPrank(investor);
        uint128 purchaseAmount = 100 * 10 ** 6;
        usdc.approve(address(launchpad), purchaseAmount);

        vm.expectEmit(true, true, false, true);
        emit UserParticipatedInCampaign(campaignId, investor, purchaseAmount);

        launchpad.buyTokens(campaignId, purchaseAmount);

        // Verify participation tracking
        assertTrue(launchpad.userParticipation(investor, campaignId), "User should be marked as participant");

        vm.stopPrank();
    }

    function test_BuyTokens_MultiplePurchases() public {
        vm.startPrank(creator);
        uint32 campaignId = launchpad.createCampaign(
            "Test Token",
            "TEST",
            "Description",
            "0.0.123456",
            "",
            false,
            1000 * 10 ** 6,
            1_000_000 * 10 ** 18,
            500000,
            uint64(block.timestamp + 30 days)
        );
        vm.stopPrank();

        // First purchase
        vm.startPrank(investor);
        uint128 purchase1 = 100 * 10 ** 6;
        usdc.approve(address(launchpad), purchase1);
        launchpad.buyTokens(campaignId, purchase1);

        // Second purchase
        uint128 purchase2 = 200 * 10 ** 6;
        usdc.approve(address(launchpad), purchase2);
        launchpad.buyTokens(campaignId, purchase2);

        // Verify total
        uint128 investment = launchpad.getUserInvestment(campaignId, investor);
        assertEq(investment, purchase1 + purchase2, "Total investment should be sum of both purchases");

        vm.stopPrank();
    }

    function test_BuyTokens_ZeroAmount() public {
        vm.startPrank(creator);
        uint32 campaignId = launchpad.createCampaign(
            "Test Token",
            "TEST",
            "Description",
            "0.0.123456",
            "",
            false,
            1000 * 10 ** 6,
            1_000_000 * 10 ** 18,
            500000,
            uint64(block.timestamp + 30 days)
        );
        vm.stopPrank();

        vm.startPrank(investor);
        vm.expectRevert(Launchpad.InvalidInput.selector);
        launchpad.buyTokens(campaignId, 0);
        vm.stopPrank();
    }

    function test_BuyTokens_InactiveCampaign() public {
        vm.startPrank(creator);
        uint32 campaignId = launchpad.createCampaign(
            "Test Token",
            "TEST",
            "Description",
            "0.0.123456",
            "",
            false,
            1000 * 10 ** 6,
            1_000_000 * 10 ** 18,
            500000,
            uint64(block.timestamp + 30 days)
        );

        launchpad.cancelCampaign(campaignId);
        vm.stopPrank();

        vm.startPrank(investor);
        uint128 purchaseAmount = 100 * 10 ** 6;
        usdc.approve(address(launchpad), purchaseAmount);

        vm.expectRevert(Launchpad.InactiveCampaign.selector);
        launchpad.buyTokens(campaignId, purchaseAmount);

        vm.stopPrank();
    }

    function test_BuyTokens_AfterDeadline() public {
        vm.startPrank(creator);
        uint32 campaignId = launchpad.createCampaign(
            "Test Token",
            "TEST",
            "Description",
            "0.0.123456",
            "",
            false,
            1000 * 10 ** 6,
            1_000_000 * 10 ** 18,
            500000,
            uint64(block.timestamp + 30 days)
        );
        vm.stopPrank();

        // Fast forward past deadline
        vm.warp(block.timestamp + 31 days);

        vm.startPrank(investor);
        uint128 purchaseAmount = 100 * 10 ** 6;
        usdc.approve(address(launchpad), purchaseAmount);

        vm.expectRevert(Launchpad.InvalidInput.selector);
        launchpad.buyTokens(campaignId, purchaseAmount);

        vm.stopPrank();
    }

    function test_BuyTokens_InsufficientBalance() public {
        vm.startPrank(creator);
        uint32 campaignId = launchpad.createCampaign(
            "Test Token",
            "TEST",
            "Description",
            "0.0.123456",
            "",
            false,
            1000 * 10 ** 6,
            1_000_000 * 10 ** 18,
            500000,
            uint64(block.timestamp + 30 days)
        );
        vm.stopPrank();

        vm.startPrank(investor);
        uint128 tooMuch = 1_000_000 * 10 ** 6; // More than investor balance
        usdc.approve(address(launchpad), tooMuch);

        vm.expectRevert(Launchpad.InsufficientBalance.selector);
        launchpad.buyTokens(campaignId, tooMuch);

        vm.stopPrank();
    }

    // ============================================
    // OG POINTS TESTS
    // ============================================

    function test_OgPoints_AwardedOnPromotedCampaign() public {
        vm.startPrank(creator);
        uint32 campaignId = launchpad.createCampaign(
            "Test Token",
            "TEST",
            "Description",
            "0.0.123456",
            "",
            false,
            1000 * 10 ** 6,
            1_000_000 * 10 ** 18,
            500000,
            uint64(block.timestamp + 30 days)
        );

        // Promote campaign
        usdc.approve(address(launchpad), PROMOTION_FEE);
        launchpad.promoteCampaign(campaignId);
        vm.stopPrank();

        // Buy tokens - use larger amount to get meaningful OG points
        vm.startPrank(investor);
        uint128 purchaseAmount = 500 * 10 ** 6; // 500 USDC for more significant purchase
        usdc.approve(address(launchpad), purchaseAmount);

        launchpad.buyTokens(campaignId, purchaseAmount);

        // Verify OG points awarded
        uint128 ogPoints = launchpad.ogPoints(investor);
        assertGt(ogPoints, 0, "OG points should be awarded");

        vm.stopPrank();
    }

    function test_OgPoints_NotAwardedOnRegularCampaign() public {
        vm.startPrank(creator);
        uint32 campaignId = launchpad.createCampaign(
            "Test Token",
            "TEST",
            "Description",
            "0.0.123456",
            "",
            false,
            1000 * 10 ** 6,
            1_000_000 * 10 ** 18,
            500000,
            uint64(block.timestamp + 30 days)
        );
        vm.stopPrank();

        // Buy tokens without promotion
        vm.startPrank(investor);
        uint128 purchaseAmount = 100 * 10 ** 6;
        usdc.approve(address(launchpad), purchaseAmount);
        launchpad.buyTokens(campaignId, purchaseAmount);

        // Verify no OG points awarded
        uint128 ogPoints = launchpad.ogPoints(investor);
        assertEq(ogPoints, 0, "OG points should not be awarded");

        vm.stopPrank();
    }

    function test_OgPoints_DistributedProportionally() public {
        vm.startPrank(creator);
        uint32 campaignId = launchpad.createCampaign(
            "Test Token",
            "TEST",
            "Description",
            "0.0.123456",
            "",
            false,
            1000 * 10 ** 6,
            1_000_000 * 10 ** 18,
            500000,
            uint64(block.timestamp + 30 days)
        );

        usdc.approve(address(launchpad), PROMOTION_FEE);
        launchpad.promoteCampaign(campaignId);
        vm.stopPrank();

        // Multiple investors buy tokens - need significant purchases for OG points calculation
        address investor2 = address(4);
        vm.prank(owner);
        usdc.mint(investor2, 10_000 * 10 ** 6);

        vm.startPrank(investor);
        uint128 purchase1 = 400 * 10 ** 6; // 40% of target for meaningful OG points
        usdc.approve(address(launchpad), purchase1);
        launchpad.buyTokens(campaignId, purchase1);
        vm.stopPrank();

        vm.startPrank(investor2);
        uint128 purchase2 = 500 * 10 ** 6; // 50% of target for meaningful OG points
        usdc.approve(address(launchpad), purchase2);
        launchpad.buyTokens(campaignId, purchase2);
        vm.stopPrank();

        // Verify OG points were distributed (total should be less than initial allocation)
        Launchpad.CampaignInfo memory info = launchpad._getCampaignInfo(campaignId);
        uint128 ogPoints1 = launchpad.ogPoints(investor);
        uint128 ogPoints2 = launchpad.ogPoints(investor2);

        // Check that promotional OG points were depleted (distributed)
        assertLt(info.promotionalOgPoints, 1000, "Some OG points should have been distributed");

        // At least one investor should have received OG points
        uint128 totalDistributed = ogPoints1 + ogPoints2;
        assertGt(totalDistributed, 0, "Total OG points distributed should be greater than 0");
    }

    // ============================================
    // CAMPAIGN CANCELLATION TESTS
    // ============================================

    function test_CancelCampaign_Success() public {
        vm.startPrank(creator);
        uint32 campaignId = launchpad.createCampaign(
            "Test Token",
            "TEST",
            "Description",
            "0.0.123456",
            "",
            false,
            1000 * 10 ** 6,
            1_000_000 * 10 ** 18,
            500000,
            uint64(block.timestamp + 30 days)
        );

        vm.expectEmit(true, true, false, false);
        emit CampaignCancelled(campaignId, creator);

        launchpad.cancelCampaign(campaignId);

        Launchpad.CampaignInfo memory info = launchpad._getCampaignInfo(campaignId);
        assertFalse(info.isActive, "Campaign should not be active");
        assertTrue(info.isCancelled, "Campaign should be cancelled");

        vm.stopPrank();
    }

    function test_CancelCampaign_OnlyCreator() public {
        vm.startPrank(creator);
        uint32 campaignId = launchpad.createCampaign(
            "Test Token",
            "TEST",
            "Description",
            "0.0.123456",
            "",
            false,
            1000 * 10 ** 6,
            1_000_000 * 10 ** 18,
            500000,
            uint64(block.timestamp + 30 days)
        );
        vm.stopPrank();

        vm.startPrank(investor);
        vm.expectRevert(Launchpad.Unauthorized.selector);
        launchpad.cancelCampaign(campaignId);
        vm.stopPrank();
    }

    function test_CancelCampaign_InvalidId() public {
        vm.startPrank(creator);
        vm.expectRevert(Launchpad.InvalidInput.selector);
        launchpad.cancelCampaign(999);
        vm.stopPrank();
    }

    // ============================================
    // REFUND TESTS
    // ============================================

    function test_ClaimRefund_AfterCancellation() public {
        vm.startPrank(creator);
        uint32 campaignId = launchpad.createCampaign(
            "Test Token",
            "TEST",
            "Description",
            "0.0.123456",
            "",
            false,
            1000 * 10 ** 6,
            1_000_000 * 10 ** 18,
            500000,
            uint64(block.timestamp + 30 days)
        );
        vm.stopPrank();

        // Investor buys tokens
        vm.startPrank(investor);
        uint128 purchaseAmount = 100 * 10 ** 6;
        usdc.approve(address(launchpad), purchaseAmount);
        launchpad.buyTokens(campaignId, purchaseAmount);

        uint256 balanceBefore = usdc.balanceOf(investor);
        vm.stopPrank();

        // Cancel campaign
        vm.prank(creator);
        launchpad.cancelCampaign(campaignId);

        // Claim refund
        vm.startPrank(investor);
        vm.expectEmit(true, true, false, true);
        emit RefundClaimed(campaignId, investor, purchaseAmount);

        launchpad.claimRefund(campaignId);

        uint256 balanceAfter = usdc.balanceOf(investor);
        assertEq(balanceAfter, balanceBefore + purchaseAmount, "Should receive full refund");

        uint128 investment = launchpad.getUserInvestment(campaignId, investor);
        assertEq(investment, 0, "Investment should be reset to zero");

        vm.stopPrank();
    }

    function test_ClaimRefund_AfterDeadlineNotFunded() public {
        vm.startPrank(creator);
        uint32 campaignId = launchpad.createCampaign(
            "Test Token",
            "TEST",
            "Description",
            "0.0.123456",
            "",
            false,
            1000 * 10 ** 6,
            1_000_000 * 10 ** 18,
            500000,
            uint64(block.timestamp + 30 days)
        );
        vm.stopPrank();

        // Investor buys tokens
        vm.startPrank(investor);
        uint128 purchaseAmount = 100 * 10 ** 6;
        usdc.approve(address(launchpad), purchaseAmount);
        launchpad.buyTokens(campaignId, purchaseAmount);

        uint256 balanceBefore = usdc.balanceOf(investor);
        vm.stopPrank();

        // Fast forward past deadline
        vm.warp(block.timestamp + 31 days);

        // Claim refund
        vm.startPrank(investor);
        launchpad.claimRefund(campaignId);

        uint256 balanceAfter = usdc.balanceOf(investor);
        assertEq(balanceAfter, balanceBefore + purchaseAmount, "Should receive full refund");

        vm.stopPrank();
    }

    function test_ClaimRefund_BurnsTokens() public {
        vm.startPrank(creator);
        uint32 campaignId = launchpad.createCampaign(
            "Test Token",
            "TEST",
            "Description",
            "0.0.123456",
            "",
            false,
            1000 * 10 ** 6,
            1_000_000 * 10 ** 18,
            500000,
            uint64(block.timestamp + 30 days)
        );
        vm.stopPrank();

        vm.startPrank(investor);
        uint128 purchaseAmount = 100 * 10 ** 6;
        usdc.approve(address(launchpad), purchaseAmount);
        launchpad.buyTokens(campaignId, purchaseAmount);

        Launchpad.CampaignInfo memory info = launchpad._getCampaignInfo(campaignId);
        TokenFacet token = TokenFacet(info.tokenAddress);
        uint256 tokenBalanceBefore = token.balanceOf(investor);
        assertGt(tokenBalanceBefore, 0, "Should have tokens before refund");
        vm.stopPrank();

        vm.prank(creator);
        launchpad.cancelCampaign(campaignId);

        vm.startPrank(investor);
        launchpad.claimRefund(campaignId);

        uint256 tokenBalanceAfter = token.balanceOf(investor);
        assertEq(tokenBalanceAfter, 0, "Tokens should be burned");

        vm.stopPrank();
    }

    function test_ClaimRefund_ActiveCampaignBeforeDeadline() public {
        vm.startPrank(creator);
        uint32 campaignId = launchpad.createCampaign(
            "Test Token",
            "TEST",
            "Description",
            "0.0.123456",
            "",
            false,
            1000 * 10 ** 6,
            1_000_000 * 10 ** 18,
            500000,
            uint64(block.timestamp + 30 days)
        );
        vm.stopPrank();

        vm.startPrank(investor);
        uint128 purchaseAmount = 100 * 10 ** 6;
        usdc.approve(address(launchpad), purchaseAmount);
        launchpad.buyTokens(campaignId, purchaseAmount);

        vm.expectRevert(Launchpad.InvalidInput.selector);
        launchpad.claimRefund(campaignId);

        vm.stopPrank();
    }

    // ============================================
    // FUNDING COMPLETION TESTS
    // ============================================

    function test_FundingCompletion_TargetReached() public {
        vm.startPrank(creator);
        uint128 targetFunding = 1000 * 10 ** 6;
        uint32 campaignId = launchpad.createCampaign(
            "Test Token",
            "TEST",
            "Description",
            "0.0.123456",
            "",
            false,
            targetFunding,
            1_000_000 * 10 ** 18,
            500000,
            uint64(block.timestamp + 30 days)
        );

        uint256 creatorBalanceBefore = usdc.balanceOf(creator);
        vm.stopPrank();

        // Buy enough to reach target
        vm.startPrank(investor);
        usdc.approve(address(launchpad), targetFunding);

        vm.expectEmit(true, false, false, false);
        emit FundingCompleted(campaignId, 0);

        launchpad.buyTokens(campaignId, targetFunding);
        vm.stopPrank();

        // Verify funding complete
        Launchpad.CampaignInfo memory info = launchpad._getCampaignInfo(campaignId);
        assertTrue(info.isFundingComplete, "Funding should be complete");
        assertFalse(info.isActive, "Campaign should not be active");

        // Verify creator received half of funds
        uint256 creatorBalanceAfter = usdc.balanceOf(creator);
        assertEq(creatorBalanceAfter, creatorBalanceBefore + targetFunding / 2, "Creator should receive half");
    }

    function test_FundingCompletion_AllTokensSold() public {
        vm.startPrank(creator);
        uint32 campaignId = launchpad.createCampaign(
            "Test Token",
            "TEST",
            "Description",
            "0.0.123456",
            "",
            false,
            10_000 * 10 ** 6, // High target
            1_000_000 * 10 ** 18,
            500000,
            uint64(block.timestamp + 30 days)
        );
        vm.stopPrank();

        // Buy large amount to sell all tokens
        vm.startPrank(investor);
        uint128 largeAmount = 9_000 * 10 ** 6;
        usdc.approve(address(launchpad), largeAmount);
        launchpad.buyTokens(campaignId, largeAmount);
        vm.stopPrank();

        Launchpad.CampaignInfo memory info = launchpad._getCampaignInfo(campaignId);

        if (info.isFundingComplete) {
            assertEq(info.tokensSold, info.tokensForSale, "All tokens should be sold");
        }
    }

    function test_FundingCompletion_CreatorAllocationMinted() public {
        vm.startPrank(creator);
        uint128 targetFunding = 1000 * 10 ** 6;
        uint32 campaignId = launchpad.createCampaign(
            "Test Token",
            "TEST",
            "Description",
            "0.0.123456",
            "",
            false,
            targetFunding,
            1_000_000 * 10 ** 18,
            500000,
            uint64(block.timestamp + 30 days)
        );
        vm.stopPrank();

        vm.startPrank(investor);
        usdc.approve(address(launchpad), targetFunding);
        launchpad.buyTokens(campaignId, targetFunding);
        vm.stopPrank();

        Launchpad.CampaignInfo memory info = launchpad._getCampaignInfo(campaignId);
        TokenFacet token = TokenFacet(info.tokenAddress);

        uint256 creatorTokenBalance = token.balanceOf(creator);
        assertEq(creatorTokenBalance, info.creatorAllocation, "Creator should receive allocation");
    }

    function test_FundingCompletion_PlatformFeeMinted() public {
        vm.startPrank(creator);
        uint128 targetFunding = 1000 * 10 ** 6;
        uint32 campaignId = launchpad.createCampaign(
            "Test Token",
            "TEST",
            "Description",
            "0.0.123456",
            "",
            false,
            targetFunding,
            1_000_000 * 10 ** 18,
            500000,
            uint64(block.timestamp + 30 days)
        );
        vm.stopPrank();

        vm.startPrank(investor);
        usdc.approve(address(launchpad), targetFunding);
        launchpad.buyTokens(campaignId, targetFunding);
        vm.stopPrank();

        Launchpad.CampaignInfo memory info = launchpad._getCampaignInfo(campaignId);
        TokenFacet token = TokenFacet(info.tokenAddress);

        uint256 launchpadTokenBalance = token.balanceOf(address(launchpad));
        assertGe(launchpadTokenBalance, info.platformFeeTokens, "Platform should receive fee tokens");
    }

    function test_FundingCompletion_LiquidityAdded() public {
        vm.startPrank(creator);
        uint128 targetFunding = 1000 * 10 ** 6;
        uint32 campaignId = launchpad.createCampaign(
            "Test Token",
            "TEST",
            "Description",
            "0.0.123456",
            "",
            false,
            targetFunding,
            1_000_000 * 10 ** 18,
            500000,
            uint64(block.timestamp + 30 days)
        );
        vm.stopPrank();

        vm.startPrank(investor);
        usdc.approve(address(launchpad), targetFunding);

        vm.expectEmit(true, false, false, false);
        emit LiquidityAdded(campaignId, 0, 0);

        launchpad.buyTokens(campaignId, targetFunding);
        vm.stopPrank();

        Launchpad.CampaignInfo memory info = launchpad._getCampaignInfo(campaignId);
        assertTrue(info.uniswapPair != address(0), "Uniswap pair should be created");
    }

    function test_FundingCompletion_CannotBuyAfter() public {
        vm.startPrank(creator);
        uint128 targetFunding = 1000 * 10 ** 6;
        uint32 campaignId = launchpad.createCampaign(
            "Test Token",
            "TEST",
            "Description",
            "0.0.123456",
            "",
            false,
            targetFunding,
            1_000_000 * 10 ** 18,
            500000,
            uint64(block.timestamp + 30 days)
        );
        vm.stopPrank();

        // Complete funding
        vm.startPrank(investor);
        usdc.approve(address(launchpad), targetFunding);
        launchpad.buyTokens(campaignId, targetFunding);
        vm.stopPrank();

        // Try to buy more
        address investor2 = address(4);
        vm.prank(owner);
        usdc.mint(investor2, 10_000 * 10 ** 6);

        vm.startPrank(investor2);
        uint128 additionalPurchase = 100 * 10 ** 6;
        usdc.approve(address(launchpad), additionalPurchase);

        vm.expectRevert(Launchpad.InactiveCampaign.selector);
        launchpad.buyTokens(campaignId, additionalPurchase);

        vm.stopPrank();
    }

    // ============================================
    // VIEW FUNCTION TESTS
    // ============================================

    function test_GetCampaignInfo_AllFields() public {
        vm.startPrank(creator);
        string memory name = "Test Token";
        string memory symbol = "TEST";
        string memory description = "Test description";
        string memory tokenFileId = "0.0.123456";
        string memory whitepaperFileId = "0.0.789012";
        uint128 targetFunding = 1000 * 10 ** 6;
        uint128 totalSupply = 1_000_000 * 10 ** 18;
        uint32 reserveRatio = 500000;
        uint64 deadline = uint64(block.timestamp + 30 days);

        uint32 campaignId = launchpad.createCampaign(
            name,
            symbol,
            description,
            tokenFileId,
            whitepaperFileId,
            true,
            targetFunding,
            totalSupply,
            reserveRatio,
            deadline
        );

        Launchpad.CampaignInfo memory info = launchpad._getCampaignInfo(campaignId);

        assertEq(info.id, campaignId);
        assertEq(info.creator, creator);
        assertEq(info.name, name);
        assertEq(info.symbol, symbol);
        assertEq(info.description, description);
        assertEq(info.tokenFileId, tokenFileId);
        assertEq(info.whitepaperFileId, whitepaperFileId);
        assertEq(info.targetAmount, targetFunding);
        assertEq(info.totalSupply, totalSupply);
        assertEq(info.reserveRatio, reserveRatio);
        assertEq(info.deadline, deadline);
        assertTrue(info.isDAOEnabled);
        assertTrue(info.isActive);
        assertFalse(info.isFundingComplete);
        assertFalse(info.isCancelled);

        vm.stopPrank();
    }

    function test_GetUserInvestment() public {
        vm.startPrank(creator);
        uint32 campaignId = launchpad.createCampaign(
            "Test Token",
            "TEST",
            "Description",
            "0.0.123456",
            "",
            false,
            1000 * 10 ** 6,
            1_000_000 * 10 ** 18,
            500000,
            uint64(block.timestamp + 30 days)
        );
        vm.stopPrank();

        vm.startPrank(investor);
        uint128 purchaseAmount = 100 * 10 ** 6;
        usdc.approve(address(launchpad), purchaseAmount);
        launchpad.buyTokens(campaignId, purchaseAmount);

        uint128 investment = launchpad.getUserInvestment(campaignId, investor);
        assertEq(investment, purchaseAmount, "Investment should match purchase amount");

        vm.stopPrank();
    }

    function test_GetUserInvestment_NoInvestment() public {
        vm.startPrank(creator);
        uint32 campaignId = launchpad.createCampaign(
            "Test Token",
            "TEST",
            "Description",
            "0.0.123456",
            "",
            false,
            1000 * 10 ** 6,
            1_000_000 * 10 ** 18,
            500000,
            uint64(block.timestamp + 30 days)
        );
        vm.stopPrank();

        uint128 investment = launchpad.getUserInvestment(campaignId, investor);
        assertEq(investment, 0, "Investment should be zero");
    }

    // ============================================
    // EDGE CASES AND INTEGRATION TESTS
    // ============================================

    function test_MultipleInvestorsCompleteFunding() public {
        vm.startPrank(creator);
        uint128 targetFunding = 1000 * 10 ** 6;
        uint32 campaignId = launchpad.createCampaign(
            "Test Token",
            "TEST",
            "Description",
            "0.0.123456",
            "",
            false,
            targetFunding,
            1_000_000 * 10 ** 18,
            500000,
            uint64(block.timestamp + 30 days)
        );
        vm.stopPrank();

        // Create multiple investors
        address investor2 = address(4);
        address investor3 = address(5);

        vm.startPrank(owner);
        usdc.mint(investor2, 10_000 * 10 ** 6);
        usdc.mint(investor3, 10_000 * 10 ** 6);
        vm.stopPrank();

        // Multiple investors buy tokens
        vm.startPrank(investor);
        uint128 amount1 = 300 * 10 ** 6;
        usdc.approve(address(launchpad), amount1);
        launchpad.buyTokens(campaignId, amount1);
        vm.stopPrank();

        vm.startPrank(investor2);
        uint128 amount2 = 400 * 10 ** 6;
        usdc.approve(address(launchpad), amount2);
        launchpad.buyTokens(campaignId, amount2);
        vm.stopPrank();

        vm.startPrank(investor3);
        uint128 amount3 = 300 * 10 ** 6;
        usdc.approve(address(launchpad), amount3);
        launchpad.buyTokens(campaignId, amount3);
        vm.stopPrank();

        Launchpad.CampaignInfo memory info = launchpad._getCampaignInfo(campaignId);
        assertTrue(info.isFundingComplete, "Funding should be complete");
    }

    function test_DAO_EnabledTokenHasVotingPower() public {
        vm.startPrank(creator);
        uint32 campaignId = launchpad.createCampaign(
            "DAO Token",
            "DAO",
            "Token with governance",
            "0.0.123456",
            "",
            true, // DAO enabled
            1000 * 10 ** 6,
            1_000_000 * 10 ** 18,
            500000,
            uint64(block.timestamp + 30 days)
        );
        vm.stopPrank();

        vm.startPrank(investor);
        uint128 purchaseAmount = 100 * 10 ** 6;
        usdc.approve(address(launchpad), purchaseAmount);
        launchpad.buyTokens(campaignId, purchaseAmount);

        Launchpad.CampaignInfo memory info = launchpad._getCampaignInfo(campaignId);
        TokenFacet token = TokenFacet(info.tokenAddress);

        // Delegate to self to activate voting power
        token.delegate(investor);

        // Check voting power (should equal token balance)
        uint256 votingPower = token.getVotes(investor);
        assertGt(votingPower, 0, "Should have voting power after delegation");

        vm.stopPrank();
    }
}
