import { ethers } from "hardhat";
import { parseEther } from "ethers";

/**
 * Example script showing how to interact with Campaign DAOs
 * Demonstrates:
 * 1. Creating a DAO for a campaign
 * 2. Token holder creating proposals
 * 3. Voting on proposals
 * 4. Executing passed proposals
 */

async function main() {
  console.log("\n🚀 Campaign DAO Interaction Examples\n");

  // Get signers
  const [deployer, tokenHolder1, tokenHolder2, tokenHolder3] = await ethers.getSigners();

  console.log("👥 Participants:");
  console.log("   Campaign Creator:", deployer.address);
  console.log("   Token Holder 1:", tokenHolder1.address);
  console.log("   Token Holder 2:", tokenHolder2.address);
  console.log("   Token Holder 3:", tokenHolder3.address);

  // Get deployed contracts
  const daoFactory = await ethers.getContract("CampaignDAOFactory");
  console.log("\n📝 DAO Factory Address:", await daoFactory.getAddress());

  // ============================================
  // SCENARIO: New Campaign Creates Its DAO
  // ============================================

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("SCENARIO: Creating a New Campaign with DAO");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // Deploy a new campaign token
  console.log("\n🪙 Step 1: Creating Campaign Token...");
  const TokenFactory = await ethers.getContractFactory("TokenFacet");
  const campaignToken = await TokenFactory.deploy("Gaming Platform Token", "GAME", deployer.address);
  await campaignToken.waitForDeployment();
  console.log("✅ Campaign Token deployed:", await campaignToken.getAddress());

  // Mint and distribute tokens
  const totalSupply = parseEther("10000000"); // 10 million tokens
  await campaignToken.mint(deployer.address, totalSupply);
  console.log("✅ Minted", ethers.formatEther(totalSupply), "tokens");

  // Distribute to investors
  await campaignToken.transfer(tokenHolder1.address, parseEther("1000000")); // 10%
  await campaignToken.transfer(tokenHolder2.address, parseEther("500000")); // 5%
  await campaignToken.transfer(tokenHolder3.address, parseEther("300000")); // 3%
  console.log("✅ Distributed tokens to investors");

  // IMPORTANT: Delegate voting power (required for voting)
  console.log("\n🗳️  Delegating voting power...");
  await campaignToken.connect(deployer).delegate(deployer.address);
  await campaignToken.connect(tokenHolder1).delegate(tokenHolder1.address);
  await campaignToken.connect(tokenHolder2).delegate(tokenHolder2.address);
  await campaignToken.connect(tokenHolder3).delegate(tokenHolder3.address);
  console.log("✅ All token holders delegated to themselves");

  console.log("\n💰 Token Balances:");
  console.log("   Creator:", ethers.formatEther(await campaignToken.balanceOf(deployer.address)));
  console.log("   Holder 1:", ethers.formatEther(await campaignToken.balanceOf(tokenHolder1.address)));
  console.log("   Holder 2:", ethers.formatEther(await campaignToken.balanceOf(tokenHolder2.address)));
  console.log("   Holder 3:", ethers.formatEther(await campaignToken.balanceOf(tokenHolder3.address)));

  // Create DAO for this campaign (DAO is enabled)
  console.log("\n🏛️  Step 2: Creating Campaign DAO...");
  const campaignId = 42; // Example campaign ID
  const isDAOEnabled = true; // Campaign creator opted in to DAO governance

  const createDaoTx = await daoFactory.createCampaignDAO(
    await campaignToken.getAddress(),
    campaignId,
    deployer.address,
    isDAOEnabled, // Must be true to create DAO
  );
  await createDaoTx.wait();

  const daoAddress = await daoFactory.getDAOByCampaign(campaignId);
  console.log("✅ DAO Created at:", daoAddress);

  // Get DAO contract instance
  const dao = await ethers.getContractAt("CampaignDAO", daoAddress);

  console.log("\n📊 DAO Configuration:");
  console.log("   Campaign ID:", await dao.campaignId());
  console.log("   Proposal Threshold:", ethers.formatEther(await dao.proposalThreshold()), "tokens");
  console.log("   Voting Period:", Number(await dao.votingPeriod()) / (24 * 60 * 60), "days");
  console.log("   Quorum:", Number(await dao.quorumPercentage()) / 100, "%");
  console.log("   Majority:", Number(await dao.majorityPercentage()) / 100, "%");

  // Fund the DAO treasury
  console.log("\n💵 Step 3: Funding DAO Treasury...");
  const fundingAmount = parseEther("10"); // 10 ETH
  await deployer.sendTransaction({
    to: daoAddress,
    value: fundingAmount,
  });
  console.log("✅ Treasury funded with", ethers.formatEther(fundingAmount), "ETH");
  console.log("   Treasury Balance:", ethers.formatEther(await dao.getTreasuryBalance()), "ETH");

  // ============================================
  // STEP 1: CREATE A PROPOSAL
  // ============================================

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("STEP 1: Creating a Governance Proposal");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const proposalTitle = "Marketing Campaign Funding";
  const proposalDescription =
    "Allocate 2 ETH from the DAO treasury to fund a marketing campaign to promote our gaming platform on social media and gaming forums. This will help increase awareness and attract more users to our platform.";
  const recipient = tokenHolder3.address;
  const transferAmount = parseEther("2");

  console.log("\n📋 Proposal Details:");
  console.log("   Title:", proposalTitle);
  console.log("   Description:", proposalDescription);
  console.log("   Recipient:", recipient);
  console.log("   Amount:", ethers.formatEther(transferAmount), "ETH");

  // Token holder 1 creates the proposal
  const createProposalTx = await dao.connect(tokenHolder1).createProposal(
    proposalTitle,
    proposalDescription,
    recipient, // target address for transfer
    transferAmount, // amount to transfer
    "0x", // empty calldata for simple transfer
  );
  await createProposalTx.wait();

  const proposalId = 1;
  console.log("\n✅ Proposal Created! ID:", proposalId);

  // Get proposal details
  const proposal = await dao.getProposal(proposalId);
  console.log("\n📊 Proposal Information:");
  console.log("   ID:", proposal.id.toString());
  console.log("   Proposer:", proposal.proposer);
  console.log("   Title:", proposal.title);
  console.log("   Description:", proposal.description);
  console.log("   Start Time:", new Date(Number(proposal.startTime) * 1000).toLocaleString());
  console.log("   End Time:", new Date(Number(proposal.endTime) * 1000).toLocaleString());
  console.log("   Snapshot Supply:", ethers.formatEther(proposal.snapshotSupply), "tokens");

  // ============================================
  // STEP 2: VOTE ON THE PROPOSAL
  // ============================================

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("STEP 2: Voting on Proposal");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // VoteType enum: 0 = Against, 1 = For, 2 = Abstain
  const VoteType = {
    Against: 0,
    For: 1,
    Abstain: 2,
  };

  console.log("\n🗳️  Casting votes...");

  // Token holder 1 votes FOR (1M tokens)
  await dao.connect(tokenHolder1).castVote(proposalId, VoteType.For);
  console.log("✅ Holder 1 voted FOR (1M tokens)");

  // Token holder 2 votes FOR (500K tokens)
  await dao.connect(tokenHolder2).castVote(proposalId, VoteType.For);
  console.log("✅ Holder 2 voted FOR (500K tokens)");

  // Token holder 3 votes AGAINST (300K tokens)
  await dao.connect(tokenHolder3).castVote(proposalId, VoteType.Against);
  console.log("✅ Holder 3 voted AGAINST (300K tokens)");

  // Get updated proposal
  const proposalAfterVoting = await dao.getProposal(proposalId);
  console.log("\n📊 Voting Results:");
  console.log("   For:", ethers.formatEther(proposalAfterVoting.forVotes), "tokens");
  console.log("   Against:", ethers.formatEther(proposalAfterVoting.againstVotes), "tokens");
  console.log("   Abstain:", ethers.formatEther(proposalAfterVoting.abstainVotes), "tokens");

  const totalVotes = proposalAfterVoting.forVotes + proposalAfterVoting.againstVotes + proposalAfterVoting.abstainVotes;
  const participation = (Number(totalVotes) * 100) / Number(proposalAfterVoting.snapshotSupply);
  console.log("   Participation:", participation.toFixed(2), "%");

  // ============================================
  // STEP 3: WAIT AND EXECUTE
  // ============================================

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("STEP 3: Waiting for Voting Period to End");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // Increase time by 3 days + 1 second
  console.log("\nℹ️  Advancing blockchain time by 3 days...");
  await ethers.provider.send("evm_increaseTime", [3 * 24 * 60 * 60 + 1]);
  await ethers.provider.send("evm_mine", []);
  console.log("✅ Time advanced");

  const finalState = await dao.getProposalState(proposalId);
  console.log("\n📊 Final Proposal State:", finalState);
  // State: 0=Pending, 1=Active, 2=Defeated, 3=Succeeded, 4=Executed

  if (finalState === 3n) {
    // Succeeded
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("STEP 4: Executing Proposal");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const treasuryBefore = await ethers.provider.getBalance(daoAddress);
    const recipientBefore = await ethers.provider.getBalance(recipient);

    console.log("\n💰 Balances Before Execution:");
    console.log("   DAO Treasury:", ethers.formatEther(treasuryBefore), "ETH");
    console.log("   Recipient:", ethers.formatEther(recipientBefore), "ETH");

    // Execute the proposal
    await dao.executeProposal(proposalId);
    console.log("\n✅ Proposal Executed!");

    const treasuryAfter = await ethers.provider.getBalance(daoAddress);
    const recipientAfter = await ethers.provider.getBalance(recipient);

    console.log("\n💰 Balances After Execution:");
    console.log("   DAO Treasury:", ethers.formatEther(treasuryAfter), "ETH");
    console.log("   Recipient:", ethers.formatEther(recipientAfter), "ETH");
    console.log("   Transferred:", ethers.formatEther(recipientAfter - recipientBefore), "ETH");
  } else {
    console.log("\n❌ Proposal did not pass");
  }

  // ============================================
  // EXAMPLE 2: PROPOSAL WITH FUNCTION CALL
  // ============================================

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("BONUS: Creating Proposal to Update DAO Parameters");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // Encode function call to update parameters
  const newProposalThreshold = parseEther("200"); // Increase to 200 tokens
  const newVotingPeriod = 5 * 24 * 60 * 60; // 5 days
  const newQuorum = 1500; // 15%
  const newMajority = 6000; // 60%

  const updateParamsCalldata = dao.interface.encodeFunctionData("updateParameters", [
    newProposalThreshold,
    newVotingPeriod,
    newQuorum,
    newMajority,
  ]);

  const paramUpdateTitle = "Update DAO Governance Parameters";
  const paramUpdateDescription =
    "Increase the proposal threshold to 200 tokens to prevent spam proposals, extend voting period to 5 days for more participation time, and raise quorum to 15% and majority to 60% for more decisive governance decisions.";

  const createProposal2Tx = await dao.connect(tokenHolder1).createProposal(
    paramUpdateTitle,
    paramUpdateDescription,
    daoAddress, // target is the DAO itself
    0, // no ETH transfer
    updateParamsCalldata,
  );
  await createProposal2Tx.wait();

  console.log("✅ Parameter update proposal created! (Proposal ID: 2)");
  console.log("ℹ️  Token holders can now vote on this proposal to change DAO governance parameters");

  // ============================================
  // SUMMARY
  // ============================================

  console.log("\n🎉 Campaign DAO Interaction Complete!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n📚 What we demonstrated:");
  console.log("1. ✅ Created a campaign token");
  console.log("2. ✅ Created a DAO for the campaign");
  console.log("3. ✅ Funded the DAO treasury");
  console.log("4. ✅ Created a treasury funding proposal");
  console.log("5. ✅ Token holders voted on the proposal");
  console.log("6. ✅ Executed the passed proposal");
  console.log("7. ✅ Created a governance parameter update proposal");
  console.log("\n💡 Key Takeaways:");
  console.log("   - Each campaign has its own independent DAO");
  console.log("   - Only campaign token holders can vote");
  console.log("   - Voting power is proportional to token holdings");
  console.log("   - Proposals require quorum and majority to pass");
  console.log("   - DAOs can manage campaign treasuries and parameters");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
