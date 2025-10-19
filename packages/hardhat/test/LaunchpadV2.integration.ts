import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

/**
 * LaunchpadV2 Integration Tests
 *
 * These tests focus on real integration with the Launchpad contract.
 * Unit tests for error cases and mock interactions are in LaunchpadV2.t.sol
 */
describe("LaunchpadV2 - Integration Tests", function () {
  let launchpadV2: any;
  let parentLaunchpad: any;
  let usdc: any;
  let uniswapRouter: any;
  let uniswapFactory: any;

  let owner: any;
  let creator: any;
  let investor1: any;
  let investor2: any;
  let investor3: any;

  const CAMPAIGN_NAME = "Test Token";
  const CAMPAIGN_SYMBOL = "TEST";
  const CAMPAIGN_DESCRIPTION = "Test campaign for LaunchpadV2";
  const TOKEN_FILE_ID = "0.0.123456";
  const TARGET_FUNDING = ethers.parseUnits("10000", 6);
  const TOTAL_SUPPLY = ethers.parseEther("1000000");
  const RESERVE_RATIO = 500000;
  const PROMOTION_FEE = ethers.parseUnits("100", 6);

  beforeEach(async function () {
    [owner, creator, investor1, investor2, investor3] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();

    // Mint USDC to test accounts
    await usdc.mint(owner.address, ethers.parseUnits("1000000", 6));
    await usdc.mint(creator.address, ethers.parseUnits("100000", 6));
    await usdc.mint(investor1.address, ethers.parseUnits("100000", 6));
    await usdc.mint(investor2.address, ethers.parseUnits("100000", 6));
    await usdc.mint(investor3.address, ethers.parseUnits("100000", 6));

    // Deploy Uniswap mocks
    const UniswapFactory = await ethers.getContractFactory("MockUniswapV2Factory");
    uniswapFactory = await UniswapFactory.deploy();
    await uniswapFactory.waitForDeployment();

    const UniswapRouter = await ethers.getContractFactory("MockUniswapV2Router");
    uniswapRouter = await UniswapRouter.deploy(await uniswapFactory.getAddress());
    await uniswapRouter.waitForDeployment();

    // Set USDC address in router for bidirectional swaps
    await uniswapRouter.setUSDC(await usdc.getAddress());

    // Deploy Parent Launchpad
    const Launchpad = await ethers.getContractFactory("Launchpad");
    parentLaunchpad = await Launchpad.deploy();
    await parentLaunchpad.waitForDeployment();

    await parentLaunchpad.initialize(
      owner.address,
      await usdc.getAddress(),
      await uniswapRouter.getAddress(),
      await uniswapFactory.getAddress(),
      PROMOTION_FEE,
    );

    // Deploy LaunchpadV2
    const LaunchpadV2 = await ethers.getContractFactory("LaunchpadV2");
    launchpadV2 = await LaunchpadV2.deploy(
      await parentLaunchpad.getAddress(),
      await usdc.getAddress(),
      await uniswapRouter.getAddress(),
      await uniswapFactory.getAddress(),
    );
    await launchpadV2.waitForDeployment();
  });

  describe("Campaign Creation and Funding Integration", function () {
    let campaignId: bigint;

    beforeEach(async function () {
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60);

      const tx = await parentLaunchpad
        .connect(creator)
        .createCampaign(
          CAMPAIGN_NAME,
          CAMPAIGN_SYMBOL,
          CAMPAIGN_DESCRIPTION,
          TOKEN_FILE_ID,
          "",
          false,
          TARGET_FUNDING,
          TOTAL_SUPPLY,
          RESERVE_RATIO,
          deadline,
        );
      await tx.wait();

      campaignId = await parentLaunchpad.campaignCount();
    });

    it("Should query campaign info through LaunchpadV2 after creation", async function () {
      const campaignInfo = await parentLaunchpad._getCampaignInfo(campaignId);

      expect(campaignInfo.creator).to.equal(creator.address);
      expect(campaignInfo.name).to.equal(CAMPAIGN_NAME);
      expect(campaignInfo.symbol).to.equal(CAMPAIGN_SYMBOL);
      expect(campaignInfo.targetAmount).to.equal(TARGET_FUNDING);
      expect(campaignInfo.isActive).to.equal(true);
    });

    it("Should track investor participation after token purchases", async function () {
      const investAmount = ethers.parseUnits("1000", 6);

      await usdc.connect(investor1).approve(await parentLaunchpad.getAddress(), investAmount);
      await parentLaunchpad.connect(investor1).buyTokens(campaignId, investAmount);

      const participatedCampaigns = await launchpadV2.getUserParticipatedCampaignsWithInvestmentCheck(
        investor1.address,
      );

      expect(participatedCampaigns.length).to.equal(1);
      expect(participatedCampaigns[0].id).to.equal(campaignId);
    });

    it("Should update summary stats as campaign funding progresses", async function () {
      // Initial stats
      let stats = await launchpadV2.getSummaryStats();
      const initialTotalCampaigns = stats.totalCampaigns;
      const initialActiveCampaigns = stats.activeCampaigns;

      // Fund partially
      const halfFunding = TARGET_FUNDING / 2n;
      await usdc.connect(investor1).approve(await parentLaunchpad.getAddress(), halfFunding);
      await parentLaunchpad.connect(investor1).buyTokens(campaignId, halfFunding);

      stats = await launchpadV2.getSummaryStats();
      expect(stats.totalCampaigns).to.equal(initialTotalCampaigns);
      expect(stats.activeCampaigns).to.equal(initialActiveCampaigns);
      expect(stats.totalFundingRaised).to.be.gt(0);

      // Complete funding
      await usdc.connect(investor2).approve(await parentLaunchpad.getAddress(), halfFunding);
      await parentLaunchpad.connect(investor2).buyTokens(campaignId, halfFunding);

      stats = await launchpadV2.getSummaryStats();
      expect(stats.completedCampaigns).to.equal(1);
      expect(stats.totalFundingRaised).to.equal(TARGET_FUNDING);
    });

    it("Should correctly preview purchase with real bonding curve from active campaign", async function () {
      const investAmount = ethers.parseUnits("1000", 6);

      // Preview before any purchases
      const expectedTokens1 = await launchpadV2.previewPurchase(campaignId, investAmount);
      expect(expectedTokens1).to.be.gt(0);

      // Make a purchase
      await usdc.connect(investor1).approve(await parentLaunchpad.getAddress(), investAmount);
      await parentLaunchpad.connect(investor1).buyTokens(campaignId, investAmount);

      // Preview should give different result due to bonding curve
      const expectedTokens2 = await launchpadV2.previewPurchase(campaignId, investAmount);
      expect(expectedTokens2).to.be.lt(expectedTokens1); // Price increases along curve
    });

    it("Should return 0 for preview purchase after campaign completes", async function () {
      // Complete funding
      await usdc.connect(investor1).approve(await parentLaunchpad.getAddress(), TARGET_FUNDING);
      await parentLaunchpad.connect(investor1).buyTokens(campaignId, TARGET_FUNDING);

      const campaignInfo = await parentLaunchpad._getCampaignInfo(campaignId);
      expect(campaignInfo.isFundingComplete).to.equal(true);

      // Preview should return 0 for completed campaign
      const tokensExpected = await launchpadV2.previewPurchase(campaignId, ethers.parseUnits("1000", 6));
      expect(tokensExpected).to.equal(0);
    });
  });

  describe("Multi-Campaign State Management", function () {
    beforeEach(async function () {
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60);

      // Create 3 campaigns by different creators
      await parentLaunchpad
        .connect(creator)
        .createCampaign(
          "Token1",
          "TK1",
          "First campaign",
          TOKEN_FILE_ID,
          "",
          false,
          TARGET_FUNDING,
          TOTAL_SUPPLY,
          RESERVE_RATIO,
          deadline,
        );

      await parentLaunchpad
        .connect(investor1)
        .createCampaign(
          "Token2",
          "TK2",
          "Second campaign",
          TOKEN_FILE_ID,
          "",
          false,
          TARGET_FUNDING,
          TOTAL_SUPPLY,
          RESERVE_RATIO,
          deadline,
        );

      await parentLaunchpad
        .connect(creator)
        .createCampaign(
          "Token3",
          "TK3",
          "Third campaign",
          TOKEN_FILE_ID,
          "",
          false,
          TARGET_FUNDING,
          TOTAL_SUPPLY,
          RESERVE_RATIO,
          deadline,
        );
    });

    it("Should filter campaigns by creator correctly", async function () {
      const creatorCampaigns = await launchpadV2.getCampaignsByCreator(creator.address);
      const investor1Campaigns = await launchpadV2.getCampaignsByCreator(investor1.address);

      expect(creatorCampaigns.length).to.equal(2);
      expect(investor1Campaigns.length).to.equal(1);
      expect(creatorCampaigns[0].creator).to.equal(creator.address);
      expect(creatorCampaigns[1].creator).to.equal(creator.address);
      expect(investor1Campaigns[0].creator).to.equal(investor1.address);
    });

    it("Should track user participation across multiple campaigns", async function () {
      const investAmount = ethers.parseUnits("1000", 6);

      // Investor2 invests in campaigns 1 and 2
      await usdc.connect(investor2).approve(await parentLaunchpad.getAddress(), investAmount * 2n);
      await parentLaunchpad.connect(investor2).buyTokens(1, investAmount);
      await parentLaunchpad.connect(investor2).buyTokens(2, investAmount);

      const participatedCampaigns = await launchpadV2.getUserParticipatedCampaignsWithInvestmentCheck(
        investor2.address,
      );

      expect(participatedCampaigns.length).to.equal(2);
      expect(participatedCampaigns[0].id).to.equal(1);
      expect(participatedCampaigns[1].id).to.equal(2);
    });

    it("Should handle pagination correctly with real campaign data", async function () {
      // Get first page
      const [page1, total1, hasMore1] = await launchpadV2.getAllCampaignsPaginated(0, 2);
      expect(page1.length).to.equal(2);
      expect(total1).to.equal(3);
      expect(hasMore1).to.equal(true);
      expect(page1[0].id).to.equal(1);
      expect(page1[1].id).to.equal(2);

      // Get second page
      const [page2, total2, hasMore2] = await launchpadV2.getAllCampaignsPaginated(2, 2);
      expect(page2.length).to.equal(1);
      expect(total2).to.equal(3);
      expect(hasMore2).to.equal(false);
      expect(page2[0].id).to.equal(3);

      // Verify page 1 and page 2 don't overlap
      const page1Ids = page1.map((c: any) => c.id);
      const page2Ids = page2.map((c: any) => c.id);
      const overlap = page1Ids.filter((id: any) => page2Ids.includes(id));
      expect(overlap.length).to.equal(0);
    });

    it("Should categorize campaigns by state correctly", async function () {
      // Fund campaign 1 completely
      await usdc.connect(investor1).approve(await parentLaunchpad.getAddress(), TARGET_FUNDING);
      await parentLaunchpad.connect(investor1).buyTokens(1, TARGET_FUNDING);

      // Fund campaign 2 partially
      await usdc.connect(investor2).approve(await parentLaunchpad.getAddress(), TARGET_FUNDING / 2n);
      await parentLaunchpad.connect(investor2).buyTokens(2, TARGET_FUNDING / 2n);

      // Campaign 3 remains unfunded

      const stats = await launchpadV2.getSummaryStats();
      expect(stats.totalCampaigns).to.equal(3);
      expect(stats.completedCampaigns).to.equal(1);
      expect(stats.activeCampaigns).to.be.gte(2);
    });
  });

  describe("User Investment Tracking Integration", function () {
    beforeEach(async function () {
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60);

      // Create 3 campaigns
      for (let i = 0; i < 3; i++) {
        await parentLaunchpad
          .connect(creator)
          .createCampaign(
            `Token${i}`,
            `TK${i}`,
            `Campaign ${i}`,
            TOKEN_FILE_ID,
            "",
            false,
            TARGET_FUNDING,
            TOTAL_SUPPLY,
            RESERVE_RATIO,
            deadline,
          );
      }
    });

    it("Should track user investments across all campaigns", async function () {
      const investAmount = ethers.parseUnits("1000", 6);

      // Investor1 invests different amounts in 3 campaigns
      await usdc.connect(investor1).approve(await parentLaunchpad.getAddress(), investAmount * 6n);
      await parentLaunchpad.connect(investor1).buyTokens(1, investAmount);
      await parentLaunchpad.connect(investor1).buyTokens(2, investAmount * 2n);
      await parentLaunchpad.connect(investor1).buyTokens(3, investAmount * 3n);

      // Get participated campaigns
      const participatedCampaigns = await launchpadV2.getUserParticipatedCampaignsWithInvestmentCheck(
        investor1.address,
      );

      // Manually calculate total investment using getUserInvestment for each campaign
      let totalInvestment = 0n;
      for (const campaign of participatedCampaigns) {
        const investment = await parentLaunchpad.getUserInvestment(campaign.id, investor1.address);
        totalInvestment += investment;
      }

      expect(participatedCampaigns.length).to.equal(3);
      expect(totalInvestment).to.equal(investAmount * 6n);
    });

    it("Should return zero investments for users with no participation", async function () {
      const participatedCampaigns = await launchpadV2.getUserParticipatedCampaignsWithInvestmentCheck(
        investor3.address,
      );

      expect(participatedCampaigns.length).to.equal(0);
    });

    it("Should track partial investments separately per campaign", async function () {
      const investAmount = ethers.parseUnits("500", 6);

      // Investor2 invests in campaigns 1 and 3 only
      await usdc.connect(investor2).approve(await parentLaunchpad.getAddress(), investAmount * 2n);
      await parentLaunchpad.connect(investor2).buyTokens(1, investAmount);
      await parentLaunchpad.connect(investor2).buyTokens(3, investAmount);

      const participatedCampaigns = await launchpadV2.getUserParticipatedCampaignsWithInvestmentCheck(
        investor2.address,
      );

      // Verify individual campaign investments
      const investment1 = await parentLaunchpad.getUserInvestment(1, investor2.address);
      const investment3 = await parentLaunchpad.getUserInvestment(3, investor2.address);

      expect(participatedCampaigns.length).to.equal(2);
      expect(investment1).to.equal(investAmount);
      expect(investment3).to.equal(investAmount);
    });
  });

  describe("Complete Campaign Lifecycle Flow", function () {
    it("Should handle end-to-end campaign journey with LaunchpadV2 queries", async function () {
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60);

      // 1. Create campaign
      const tx = await parentLaunchpad
        .connect(creator)
        .createCampaign(
          CAMPAIGN_NAME,
          CAMPAIGN_SYMBOL,
          CAMPAIGN_DESCRIPTION,
          TOKEN_FILE_ID,
          "",
          false,
          TARGET_FUNDING,
          TOTAL_SUPPLY,
          RESERVE_RATIO,
          deadline,
        );
      await tx.wait();

      const campaignId = await parentLaunchpad.campaignCount();

      // 2. Preview purchase shows correct calculation
      const investAmount = ethers.parseUnits("1000", 6);
      const expectedTokens = await launchpadV2.previewPurchase(campaignId, investAmount);
      expect(expectedTokens).to.be.gt(0);

      // 3. Multiple investors purchase tokens
      await usdc.connect(investor1).approve(await parentLaunchpad.getAddress(), investAmount);
      await parentLaunchpad.connect(investor1).buyTokens(campaignId, investAmount);

      await usdc.connect(investor2).approve(await parentLaunchpad.getAddress(), investAmount);
      await parentLaunchpad.connect(investor2).buyTokens(campaignId, investAmount);

      // 4. Verify participation tracking
      const investor1Campaigns = await launchpadV2.getUserParticipatedCampaignsWithInvestmentCheck(investor1.address);
      const investor2Campaigns = await launchpadV2.getUserParticipatedCampaignsWithInvestmentCheck(investor2.address);
      expect(investor1Campaigns.length).to.equal(1);
      expect(investor2Campaigns.length).to.equal(1);

      // 5. Check intermediate stats
      let stats = await launchpadV2.getSummaryStats();
      expect(stats.totalCampaigns).to.equal(1);
      expect(stats.activeCampaigns).to.equal(1);
      expect(stats.completedCampaigns).to.equal(0);

      // 6. Complete funding
      const remaining = TARGET_FUNDING - investAmount - investAmount;
      await usdc.connect(investor3).approve(await parentLaunchpad.getAddress(), remaining);
      await parentLaunchpad.connect(investor3).buyTokens(campaignId, remaining);

      // 7. Verify completion state
      const campaignInfo = await parentLaunchpad._getCampaignInfo(campaignId);
      expect(campaignInfo.isFundingComplete).to.equal(true);
      expect(campaignInfo.uniswapPair).to.not.equal(ethers.ZeroAddress);

      // 8. Verify final stats
      stats = await launchpadV2.getSummaryStats();
      expect(stats.totalCampaigns).to.equal(1);
      expect(stats.completedCampaigns).to.equal(1);
      expect(stats.totalFundingRaised).to.equal(TARGET_FUNDING);

      // 9. Verify creator's campaigns
      const creatorCampaigns = await launchpadV2.getCampaignsByCreator(creator.address);
      expect(creatorCampaigns.length).to.equal(1);
      expect(creatorCampaigns[0].id).to.equal(campaignId);
      expect(creatorCampaigns[0].isFundingComplete).to.equal(true);

      // 10. Verify all 3 investors are tracked
      const investor3Campaigns = await launchpadV2.getUserParticipatedCampaignsWithInvestmentCheck(investor3.address);
      expect(investor3Campaigns.length).to.equal(1);

      // 11. Verify total investments using getUserInvestment
      const inv1Total = await parentLaunchpad.getUserInvestment(campaignId, investor1.address);
      const inv2Total = await parentLaunchpad.getUserInvestment(campaignId, investor2.address);
      const inv3Total = await parentLaunchpad.getUserInvestment(campaignId, investor3.address);

      expect(inv1Total).to.equal(investAmount);
      expect(inv2Total).to.equal(investAmount);
      expect(inv3Total).to.equal(remaining);
      expect(inv1Total + inv2Total + inv3Total).to.equal(TARGET_FUNDING);
    });

    it("Should handle multiple concurrent campaigns with mixed states", async function () {
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60);

      // Create 5 campaigns
      for (let i = 0; i < 5; i++) {
        await parentLaunchpad
          .connect(creator)
          .createCampaign(
            `Token${i}`,
            `TK${i}`,
            `Campaign ${i}`,
            TOKEN_FILE_ID,
            "",
            false,
            TARGET_FUNDING,
            TOTAL_SUPPLY,
            RESERVE_RATIO,
            deadline,
          );
      }

      // Fund campaigns to different levels
      await usdc.connect(investor1).approve(await parentLaunchpad.getAddress(), TARGET_FUNDING * 5n);
      await parentLaunchpad.connect(investor1).buyTokens(1, TARGET_FUNDING); // Completed
      await parentLaunchpad.connect(investor1).buyTokens(2, TARGET_FUNDING); // Completed
      await parentLaunchpad.connect(investor1).buyTokens(3, TARGET_FUNDING / 2n); // Active
      await parentLaunchpad.connect(investor1).buyTokens(4, TARGET_FUNDING / 4n); // Active
      // Campaign 5 unfunded

      const stats = await launchpadV2.getSummaryStats();
      expect(stats.totalCampaigns).to.equal(5);
      expect(stats.completedCampaigns).to.equal(2);
      expect(stats.activeCampaigns).to.be.gte(3);

      // Verify pagination works across all states
      const [page1] = await launchpadV2.getAllCampaignsPaginated(0, 3);
      const [page2] = await launchpadV2.getAllCampaignsPaginated(3, 3);
      expect(page1.length).to.equal(3);
      expect(page2.length).to.equal(2);

      // Verify investor participation
      const participatedCampaigns = await launchpadV2.getUserParticipatedCampaignsWithInvestmentCheck(
        investor1.address,
      );
      expect(participatedCampaigns.length).to.equal(4); // Invested in 4 out of 5
    });
  });
});
