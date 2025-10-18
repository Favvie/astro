// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Launchpad} from "./Launchpad.sol";
import {TokenFacet} from "./Token.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Mock USDC Token
contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {
        _mint(msg.sender, 1_000_000 * 10 ** 18);
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

    uint128 public constant PROMOTION_FEE = 100 * 10 ** 18;

    // Events - redeclare for testing
    event CampaignCreated(uint256 indexed campaignId, address indexed creator, string name, uint256 targetFunding, uint256 totalSupply, uint256 deadline, string tokenFileId);

    function setUp() public {
        // Deploy mock contracts
        vm.startPrank(owner);
        usdc = new MockUSDC();
        router = new MockUniswapV2Router();
        factory = new MockUniswapV2Factory();

        // Deploy Launchpad
        launchpad = new Launchpad();
        launchpad.initialize(owner, address(usdc), address(router), address(factory), PROMOTION_FEE);

        // Distribute USDC to test accounts
        usdc.mint(creator, 10_000 * 10 ** 18);
        usdc.mint(investor, 10_000 * 10 ** 18);
        vm.stopPrank();
    }

    function test_CreateCampaign_Success() public {
        vm.startPrank(creator);

        string memory name = "Test Token";
        string memory symbol = "TEST";
        string memory description = "A test token for the launchpad";
        string memory tokenFileId = "0.0.123456";
        uint128 targetFunding = 1000 * 10 ** 18;
        uint128 totalSupply = 1_000_000 * 10 ** 18;
        uint32 reserveRatio = 500000; // 50%
        uint64 deadline = uint64(block.timestamp + 30 days);

        // Expect the CampaignCreated event
        vm.expectEmit(true, true, false, true);
        emit CampaignCreated(1, creator, name, targetFunding, totalSupply, deadline, tokenFileId);

        uint32 campaignId = launchpad.createCampaign(
            name,
            symbol,
            description,
            tokenFileId,
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
        assertEq(info.targetAmount, targetFunding, "Target amount mismatch");
        assertEq(info.totalSupply, totalSupply, "Total supply mismatch");
        assertEq(info.reserveRatio, reserveRatio, "Reserve ratio mismatch");
        assertEq(info.deadline, deadline, "Deadline mismatch");
        assertTrue(info.isActive, "Campaign should be active");
        assertFalse(info.isFundingComplete, "Campaign should not be funded yet");
        assertFalse(info.isCancelled, "Campaign should not be cancelled");
        assertFalse(info.isPromoted, "Campaign should not be promoted");

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
        uint128 targetFunding = 5000 * 10 ** 18;
        uint128 totalSupply = 10_000_000 * 10 ** 18;
        uint32 reserveRatio = 300000; // 30%
        uint64 deadline = uint64(block.timestamp + 60 days);

        uint32 campaignId = launchpad.createCampaign(
            "Hedera Token",
            "HBAR",
            "Token with Hedera File Service image",
            tokenFileId,
            targetFunding,
            totalSupply,
            reserveRatio,
            deadline
        );

        Launchpad.CampaignInfo memory info = launchpad._getCampaignInfo(campaignId);
        assertEq(info.tokenFileId, tokenFileId, "Token file ID should match Hedera file ID");

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
            1000 * 10 ** 18,
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
            1000 * 10 ** 18,
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
            1000 * 10 ** 18,
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
            1000 * 10 ** 18,
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
            1000 * 10 ** 18,
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
            1000 * 10 ** 18,
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
            1000 * 10 ** 18,
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
            2000 * 10 ** 18,
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

        vm.stopPrank();
    }

    function test_CreateCampaign_TokenDeployment() public {
        vm.startPrank(creator);

        uint32 campaignId = launchpad.createCampaign(
            "Test Token",
            "TEST",
            "A test token",
            "0.0.123456",
            1000 * 10 ** 18,
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
}
