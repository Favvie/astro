// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.20;

// import {Test} from "forge-std/Test.sol";
// import {CampaignDAO} from "./CampaignDAO.sol";
// import {TokenFacet} from "./Token.sol";
// import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// /**
//  * @title CampaignDAOTest
//  * @dev Comprehensive test suite for CampaignDAO contract
//  */
// contract CampaignDAOTest is Test {
//     CampaignDAO public dao;
//     TokenFacet public token;

//     address public owner = address(1);
//     address public campaignCreator = address(2);
//     address public voter1 = address(3);
//     address public voter2 = address(4);
//     address public voter3 = address(5);

//     uint256 public constant CAMPAIGN_ID = 1;
//     uint256 public constant INITIAL_SUPPLY = 1_000_000 * 10**18;
//     uint256 public constant PROPOSAL_THRESHOLD = 1000 * 10**18;
//     uint256 public constant VOTING_PERIOD = 3 days;
//     uint256 public constant QUORUM_PERCENTAGE = 2500; // 25%
//     uint256 public constant MAJORITY_PERCENTAGE = 5000; // 50%

//     // Events
//     event ProposalCreated(
//         uint256 indexed proposalId,
//         address indexed proposer,
//         string title,
//         string description,
//         uint256 startTime,
//         uint256 endTime
//     );

//     event VoteCast(
//         uint256 indexed proposalId,
//         address indexed voter,
//         CampaignDAO.VoteType voteType,
//         uint256 weight
//     );

//     event ProposalExecuted(uint256 indexed proposalId);

//     event FundsReceived(address indexed sender, uint256 amount);

//     event FundsWithdrawn(address indexed recipient, uint256 amount);

//     event ParametersUpdated(
//         uint256 proposalThreshold,
//         uint256 votingPeriod,
//         uint256 quorumPercentage,
//         uint256 majorityPercentage
//     );

//     function setUp() public {
//         vm.startPrank(owner);

//         // Deploy token (mock launchpad as owner)
//         token = new TokenFacet("Campaign Token", "CAMP", owner);

//         // Mint tokens to voters
//         token.mint(voter1, 300_000 * 10**18); // 30%
//         token.mint(voter2, 200_000 * 10**18); // 20%
//         token.mint(voter3, 100_000 * 10**18); // 10%
//         token.mint(campaignCreator, 50_000 * 10**18); // 5%

//         vm.stopPrank();

//         // Deploy DAO
//         vm.startPrank(campaignCreator);
//         dao = new CampaignDAO(
//             address(token),
//             CAMPAIGN_ID,
//             campaignCreator,
//             PROPOSAL_THRESHOLD,
//             VOTING_PERIOD,
//             QUORUM_PERCENTAGE,
//             MAJORITY_PERCENTAGE
//         );
//         vm.stopPrank();
//     }

//     // ============================================
//     // DEPLOYMENT TESTS
//     // ============================================

//     function test_Deployment_Success() public view {
//         assertEq(address(dao.campaignToken()), address(token), "Token address mismatch");
//         assertEq(dao.campaignId(), CAMPAIGN_ID, "Campaign ID mismatch");
//         assertEq(dao.campaignCreator(), campaignCreator, "Creator mismatch");
//         assertEq(dao.proposalThreshold(), PROPOSAL_THRESHOLD, "Proposal threshold mismatch");
//         assertEq(dao.votingPeriod(), VOTING_PERIOD, "Voting period mismatch");
//         assertEq(dao.quorumPercentage(), QUORUM_PERCENTAGE, "Quorum percentage mismatch");
//         assertEq(dao.majorityPercentage(), MAJORITY_PERCENTAGE, "Majority percentage mismatch");
//         assertEq(dao.proposalCount(), 0, "Initial proposal count should be zero");
//     }

//     function test_Deployment_InvalidTokenAddress() public {
//         vm.expectRevert("Invalid token address");
//         new CampaignDAO(
//             address(0),
//             CAMPAIGN_ID,
//             campaignCreator,
//             PROPOSAL_THRESHOLD,
//             VOTING_PERIOD,
//             QUORUM_PERCENTAGE,
//             MAJORITY_PERCENTAGE
//         );
//     }

//     function test_Deployment_InvalidCreatorAddress() public {
//         vm.expectRevert("Invalid creator address");
//         new CampaignDAO(
//             address(token),
//             CAMPAIGN_ID,
//             address(0),
//             PROPOSAL_THRESHOLD,
//             VOTING_PERIOD,
//             QUORUM_PERCENTAGE,
//             MAJORITY_PERCENTAGE
//         );
//     }

//     function test_Deployment_InvalidQuorumPercentage() public {
//         vm.expectRevert("Quorum must be <= 100%");
//         new CampaignDAO(
//             address(token),
//             CAMPAIGN_ID,
//             campaignCreator,
//             PROPOSAL_THRESHOLD,
//             VOTING_PERIOD,
//             10001, // > 100%
//             MAJORITY_PERCENTAGE
//         );
//     }

//     function test_Deployment_InvalidMajorityPercentage() public {
//         vm.expectRevert("Majority must be <= 100%");
//         new CampaignDAO(
//             address(token),
//             CAMPAIGN_ID,
//             campaignCreator,
//             PROPOSAL_THRESHOLD,
//             VOTING_PERIOD,
//             QUORUM_PERCENTAGE,
//             10001 // > 100%
//         );
//     }

//     // ============================================
//     // PROPOSAL CREATION TESTS
//     // ============================================

//     function test_CreateProposal_Success() public {
//         // Delegate voting power to self
//         vm.prank(voter1);
//         token.delegate(voter1);

//         // Wait for delegation to take effect
//         vm.roll(block.number + 1);

//         vm.startPrank(voter1);

//         string memory title = "Test Proposal";
//         string memory description = "This is a test proposal";

//         vm.expectEmit(true, true, false, false);
//         emit ProposalCreated(1, voter1, title, description, block.timestamp, block.timestamp + VOTING_PERIOD);

//         uint256 proposalId = dao.createProposal(
//             title,
//             description,
//             address(0),
//             0,
//             ""
//         );

//         assertEq(proposalId, 1, "First proposal ID should be 1");
//         assertEq(dao.proposalCount(), 1, "Proposal count should be 1");

//         CampaignDAO.Proposal memory proposal = dao.getProposal(proposalId);
//         assertEq(proposal.id, proposalId, "Proposal ID mismatch");
//         assertEq(proposal.proposer, voter1, "Proposer mismatch");
//         assertEq(proposal.title, title, "Title mismatch");
//         assertEq(proposal.description, description, "Description mismatch");
//         assertEq(proposal.startTime, block.timestamp, "Start time mismatch");
//         assertEq(proposal.endTime, block.timestamp + VOTING_PERIOD, "End time mismatch");
//         assertEq(proposal.forVotes, 0, "For votes should be zero");
//         assertEq(proposal.againstVotes, 0, "Against votes should be zero");
//         assertEq(proposal.abstainVotes, 0, "Abstain votes should be zero");
//         assertFalse(proposal.executed, "Proposal should not be executed");

//         vm.stopPrank();
//     }

//     function test_CreateProposal_WithCalldata() public {
//         vm.prank(voter1);
//         token.delegate(voter1);
//         vm.roll(block.number + 1);

//         vm.startPrank(voter1);

//         // Create proposal with execution target and calldata
//         address target = address(0x123);
//         uint256 value = 1 ether;
//         bytes memory callData = abi.encodeWithSignature("execute()");

//         uint256 proposalId = dao.createProposal(
//             "Execute Function",
//             "Proposal to execute a function",
//             target,
//             value,
//             callData
//         );

//         CampaignDAO.Proposal memory proposal = dao.getProposal(proposalId);
//         assertEq(proposal.target, target, "Target mismatch");
//         assertEq(proposal.value, value, "Value mismatch");
//         assertEq(proposal.callData, callData, "Call data mismatch");

//         vm.stopPrank();
//     }

//     function test_CreateProposal_InsufficientVotingPower() public {
//         // voter1 has not delegated, so has 0 voting power
//         vm.startPrank(voter1);

//         vm.expectRevert("Insufficient voting power to create proposal");
//         dao.createProposal(
//             "Test Proposal",
//             "Description",
//             address(0),
//             0,
//             ""
//         );

//         vm.stopPrank();
//     }

//     function test_CreateProposal_EmptyTitle() public {
//         vm.prank(voter1);
//         token.delegate(voter1);
//         vm.roll(block.number + 1);

//         vm.startPrank(voter1);

//         vm.expectRevert("Empty title");
//         dao.createProposal(
//             "",
//             "Description",
//             address(0),
//             0,
//             ""
//         );

//         vm.stopPrank();
//     }

//     function test_CreateProposal_EmptyDescription() public {
//         vm.prank(voter1);
//         token.delegate(voter1);
//         vm.roll(block.number + 1);

//         vm.startPrank(voter1);

//         vm.expectRevert("Empty description");
//         dao.createProposal(
//             "Title",
//             "",
//             address(0),
//             0,
//             ""
//         );

//         vm.stopPrank();
//     }

//     function test_CreateProposal_MultipleProposals() public {
//         vm.prank(voter1);
//         token.delegate(voter1);
//         vm.roll(block.number + 1);

//         vm.startPrank(voter1);

//         uint256 proposalId1 = dao.createProposal("Proposal 1", "Description 1", address(0), 0, "");
//         uint256 proposalId2 = dao.createProposal("Proposal 2", "Description 2", address(0), 0, "");
//         uint256 proposalId3 = dao.createProposal("Proposal 3", "Description 3", address(0), 0, "");

//         assertEq(proposalId1, 1, "First proposal ID should be 1");
//         assertEq(proposalId2, 2, "Second proposal ID should be 2");
//         assertEq(proposalId3, 3, "Third proposal ID should be 3");
//         assertEq(dao.proposalCount(), 3, "Proposal count should be 3");

//         vm.stopPrank();
//     }

//     // ============================================
//     // VOTING TESTS
//     // ============================================

//     function test_CastVote_VoteFor_Success() public {
//         // Setup: Delegate voting power for both voters first
//         vm.prank(voter1);
//         token.delegate(voter1);
//         vm.prank(voter2);
//         token.delegate(voter2);

//         // Wait for delegation to be recorded
//         vm.roll(block.number + 1);
//         vm.warp(block.timestamp + 1);

//         // Create proposal after delegation
//         vm.prank(voter1);
//         uint256 proposalId = dao.createProposal("Test", "Description", address(0), 0, "");

//         // Vote
//         vm.startPrank(voter2);

//         uint256 expectedWeight = token.balanceOf(voter2);

//         vm.expectEmit(true, true, false, true);
//         emit VoteCast(proposalId, voter2, CampaignDAO.VoteType.For, expectedWeight);

//         dao.castVote(proposalId, CampaignDAO.VoteType.For);

//         // Verify vote recorded
//         assertTrue(dao.hasAddressVoted(proposalId, voter2), "Should be marked as voted");
//         assertEq(uint256(dao.getVote(proposalId, voter2)), uint256(CampaignDAO.VoteType.For), "Vote type mismatch");

//         CampaignDAO.Proposal memory proposal = dao.getProposal(proposalId);
//         assertEq(proposal.forVotes, expectedWeight, "For votes should match voting weight");
//         assertEq(proposal.againstVotes, 0, "Against votes should be zero");
//         assertEq(proposal.abstainVotes, 0, "Abstain votes should be zero");

//         vm.stopPrank();
//     }

//     function test_CastVote_VoteAgainst_Success() public {
//         vm.prank(voter1);
//         token.delegate(voter1);
//         vm.prank(voter2);
//         token.delegate(voter2);

//         vm.roll(block.number + 1);
//         vm.warp(block.timestamp + 1);

//         vm.prank(voter1);
//         uint256 proposalId = dao.createProposal("Test", "Description", address(0), 0, "");

//         vm.startPrank(voter2);

//         dao.castVote(proposalId, CampaignDAO.VoteType.Against);

//         CampaignDAO.Proposal memory proposal = dao.getProposal(proposalId);
//         assertEq(proposal.againstVotes, token.balanceOf(voter2), "Against votes should match weight");
//         assertEq(proposal.forVotes, 0, "For votes should be zero");

//         vm.stopPrank();
//     }

//     function test_CastVote_Abstain_Success() public {
//         vm.prank(voter1);
//         token.delegate(voter1);
//         vm.prank(voter2);
//         token.delegate(voter2);

//         vm.roll(block.number + 1);
//         vm.warp(block.timestamp + 1);

//         vm.prank(voter1);
//         uint256 proposalId = dao.createProposal("Test", "Description", address(0), 0, "");

//         vm.startPrank(voter2);

//         dao.castVote(proposalId, CampaignDAO.VoteType.Abstain);

//         CampaignDAO.Proposal memory proposal = dao.getProposal(proposalId);
//         assertEq(proposal.abstainVotes, token.balanceOf(voter2), "Abstain votes should match weight");
//         assertEq(proposal.forVotes, 0, "For votes should be zero");
//         assertEq(proposal.againstVotes, 0, "Against votes should be zero");

//         vm.stopPrank();
//     }

//     function test_CastVote_MultipleVoters() public {
//         // Delegate for all voters first
//         vm.prank(voter1);
//         token.delegate(voter1);
//         vm.prank(voter2);
//         token.delegate(voter2);
//         vm.prank(voter3);
//         token.delegate(voter3);

//         vm.roll(block.number + 1);
//         vm.warp(block.timestamp + 1);

//         vm.prank(voter1);
//         uint256 proposalId = dao.createProposal("Test", "Description", address(0), 0, "");

//         // voter1 votes for
//         vm.prank(voter1);
//         dao.castVote(proposalId, CampaignDAO.VoteType.For);

//         // voter2 votes against
//         vm.prank(voter2);
//         dao.castVote(proposalId, CampaignDAO.VoteType.Against);

//         // voter3 abstains
//         vm.prank(voter3);
//         dao.castVote(proposalId, CampaignDAO.VoteType.Abstain);

//         CampaignDAO.Proposal memory proposal = dao.getProposal(proposalId);
//         assertEq(proposal.forVotes, token.balanceOf(voter1), "For votes mismatch");
//         assertEq(proposal.againstVotes, token.balanceOf(voter2), "Against votes mismatch");
//         assertEq(proposal.abstainVotes, token.balanceOf(voter3), "Abstain votes mismatch");
//     }

//     function test_CastVote_NonExistentProposal() public {
//         vm.prank(voter1);
//         token.delegate(voter1);
//         vm.roll(block.number + 1);

//         vm.startPrank(voter1);

//         vm.expectRevert("Proposal does not exist");
//         dao.castVote(999, CampaignDAO.VoteType.For);

//         vm.stopPrank();
//     }

//     function test_CastVote_AlreadyVoted() public {
//         vm.prank(voter1);
//         token.delegate(voter1);
//         vm.prank(voter2);
//         token.delegate(voter2);

//         vm.roll(block.number + 1);
//         vm.warp(block.timestamp + 1);

//         vm.prank(voter1);
//         uint256 proposalId = dao.createProposal("Test", "Description", address(0), 0, "");

//         vm.startPrank(voter2);

//         dao.castVote(proposalId, CampaignDAO.VoteType.For);

//         vm.expectRevert("Already voted");
//         dao.castVote(proposalId, CampaignDAO.VoteType.Against);

//         vm.stopPrank();
//     }

//     function test_CastVote_AfterVotingEnded() public {
//         vm.prank(voter1);
//         token.delegate(voter1);
//         vm.roll(block.number + 1);

//         vm.prank(voter1);
//         uint256 proposalId = dao.createProposal("Test", "Description", address(0), 0, "");

//         vm.prank(voter2);
//         token.delegate(voter2);
//         vm.roll(block.number + 1);

//         // Fast forward past voting period
//         vm.warp(block.timestamp + VOTING_PERIOD + 1);

//         vm.startPrank(voter2);

//         vm.expectRevert("Voting ended");
//         dao.castVote(proposalId, CampaignDAO.VoteType.For);

//         vm.stopPrank();
//     }

//     function test_CastVote_NoVotingPower() public {
//         vm.prank(voter1);
//         token.delegate(voter1);
//         vm.roll(block.number + 1);

//         vm.prank(voter1);
//         uint256 proposalId = dao.createProposal("Test", "Description", address(0), 0, "");

//         // Non-token holder tries to vote
//         address nonHolder = address(0x999);
//         vm.startPrank(nonHolder);

//         vm.expectRevert("No voting power");
//         dao.castVote(proposalId, CampaignDAO.VoteType.For);

//         vm.stopPrank();
//     }

//     // ============================================
//     // PROPOSAL STATE TESTS
//     // ============================================

//     function test_ProposalState_Active() public {
//         vm.prank(voter1);
//         token.delegate(voter1);
//         vm.roll(block.number + 1);

//         vm.prank(voter1);
//         uint256 proposalId = dao.createProposal("Test", "Description", address(0), 0, "");

//         CampaignDAO.ProposalState state = dao.getProposalState(proposalId);
//         assertEq(uint256(state), uint256(CampaignDAO.ProposalState.Active), "Should be active");
//     }

//     function test_ProposalState_Succeeded_QuorumAndMajorityMet() public {
//         vm.prank(voter1);
//         token.delegate(voter1);
//         vm.prank(voter2);
//         token.delegate(voter2);

//         vm.roll(block.number + 1);
//         vm.warp(block.timestamp + 1);

//         vm.prank(voter1);
//         uint256 proposalId = dao.createProposal("Test", "Description", address(0), 0, "");

//         // voter1 (30%) and voter2 (20%) vote for = 50% total
//         // This exceeds quorum (25%) and majority (50% of decisive votes)
//         vm.prank(voter1);
//         dao.castVote(proposalId, CampaignDAO.VoteType.For);

//         vm.prank(voter2);
//         dao.castVote(proposalId, CampaignDAO.VoteType.For);

//         // Fast forward past voting period
//         vm.warp(block.timestamp + VOTING_PERIOD + 1);

//         CampaignDAO.ProposalState state = dao.getProposalState(proposalId);
//         assertEq(uint256(state), uint256(CampaignDAO.ProposalState.Succeeded), "Should be succeeded");
//     }

//     function test_ProposalState_Defeated_QuorumNotMet() public {
//         vm.prank(voter1);
//         token.delegate(voter1);
//         vm.prank(voter3);
//         token.delegate(voter3);

//         vm.roll(block.number + 1);
//         vm.warp(block.timestamp + 1);

//         vm.prank(voter1);
//         uint256 proposalId = dao.createProposal("Test", "Description", address(0), 0, "");

//         // Only voter3 (10%) votes - below quorum (25%)
//         vm.prank(voter3);
//         dao.castVote(proposalId, CampaignDAO.VoteType.For);

//         // Fast forward past voting period
//         vm.warp(block.timestamp + VOTING_PERIOD + 1);

//         CampaignDAO.ProposalState state = dao.getProposalState(proposalId);
//         assertEq(uint256(state), uint256(CampaignDAO.ProposalState.Defeated), "Should be defeated");
//     }

//     function test_ProposalState_Defeated_MajorityNotMet() public {
//         vm.prank(voter1);
//         token.delegate(voter1);
//         vm.prank(voter2);
//         token.delegate(voter2);
//         vm.prank(voter3);
//         token.delegate(voter3);

//         vm.roll(block.number + 1);
//         vm.warp(block.timestamp + 1);

//         vm.prank(voter1);
//         uint256 proposalId = dao.createProposal("Test", "Description", address(0), 0, "");

//         // voter2 (20%) votes for, voter1 (30%) and voter3 (10%) vote against
//         // Quorum met (60%), but majority not met (20% for vs 40% against = 33.3% < 50%)
//         vm.prank(voter2);
//         dao.castVote(proposalId, CampaignDAO.VoteType.For);

//         vm.prank(voter1);
//         dao.castVote(proposalId, CampaignDAO.VoteType.Against);

//         vm.prank(voter3);
//         dao.castVote(proposalId, CampaignDAO.VoteType.Against);

//         // Fast forward past voting period
//         vm.warp(block.timestamp + VOTING_PERIOD + 1);

//         CampaignDAO.ProposalState state = dao.getProposalState(proposalId);
//         assertEq(uint256(state), uint256(CampaignDAO.ProposalState.Defeated), "Should be defeated");
//     }

//     function test_ProposalState_Executed() public {
//         vm.prank(voter1);
//         token.delegate(voter1);
//         vm.prank(voter2);
//         token.delegate(voter2);

//         vm.roll(block.number + 1);
//         vm.warp(block.timestamp + 1);

//         vm.prank(voter1);
//         uint256 proposalId = dao.createProposal("Test", "Description", address(0), 0, "");

//         // Make proposal succeed
//         vm.prank(voter1);
//         dao.castVote(proposalId, CampaignDAO.VoteType.For);

//         vm.prank(voter2);
//         dao.castVote(proposalId, CampaignDAO.VoteType.For);

//         // Fast forward and execute
//         vm.warp(block.timestamp + VOTING_PERIOD + 1);

//         dao.executeProposal(proposalId);

//         CampaignDAO.ProposalState state = dao.getProposalState(proposalId);
//         assertEq(uint256(state), uint256(CampaignDAO.ProposalState.Executed), "Should be executed");
//     }

//     // ============================================
//     // PROPOSAL EXECUTION TESTS
//     // ============================================

//     function test_ExecuteProposal_Success_SimpleTransfer() public {
//         // Fund the DAO
//         vm.deal(address(dao), 10 ether);

//         vm.prank(voter1);
//         token.delegate(voter1);
//         vm.prank(voter2);
//         token.delegate(voter2);

//         vm.roll(block.number + 1);
//         vm.warp(block.timestamp + 1);

//         // Create proposal to send 1 ETH
//         vm.prank(voter1);
//         uint256 proposalId = dao.createProposal(
//             "Send ETH",
//             "Send 1 ETH to proposer",
//             address(0),
//             1 ether,
//             ""
//         );

//         // Vote to pass
//         vm.prank(voter1);
//         dao.castVote(proposalId, CampaignDAO.VoteType.For);

//         vm.prank(voter2);
//         dao.castVote(proposalId, CampaignDAO.VoteType.For);

//         // Fast forward past voting period
//         vm.warp(block.timestamp + VOTING_PERIOD + 1);

//         uint256 balanceBefore = voter1.balance;

//         vm.expectEmit(true, false, false, false);
//         emit ProposalExecuted(proposalId);

//         dao.executeProposal(proposalId);

//         uint256 balanceAfter = voter1.balance;
//         assertEq(balanceAfter, balanceBefore + 1 ether, "Should receive 1 ETH");
//     }

//     function test_ExecuteProposal_VotingStillActive() public {
//         vm.prank(voter1);
//         token.delegate(voter1);

//         vm.roll(block.number + 1);
//         vm.warp(block.timestamp + 1);

//         vm.prank(voter1);
//         uint256 proposalId = dao.createProposal("Test", "Description", address(0), 0, "");

//         vm.prank(voter1);
//         dao.castVote(proposalId, CampaignDAO.VoteType.For);

//         vm.expectRevert("Voting still active");
//         dao.executeProposal(proposalId);
//     }

//     function test_ExecuteProposal_ProposalDidNotPass() public {
//         vm.prank(voter1);
//         token.delegate(voter1);
//         vm.prank(voter2);
//         token.delegate(voter2);

//         vm.roll(block.number + 1);
//         vm.warp(block.timestamp + 1);

//         vm.prank(voter1);
//         uint256 proposalId = dao.createProposal("Test", "Description", address(0), 0, "");

//         // Vote against
//         vm.prank(voter1);
//         dao.castVote(proposalId, CampaignDAO.VoteType.Against);

//         vm.prank(voter2);
//         dao.castVote(proposalId, CampaignDAO.VoteType.Against);

//         // Fast forward past voting period
//         vm.warp(block.timestamp + VOTING_PERIOD + 1);

//         vm.expectRevert("Proposal did not pass");
//         dao.executeProposal(proposalId);
//     }

//     function test_ExecuteProposal_AlreadyExecuted() public {
//         vm.prank(voter1);
//         token.delegate(voter1);
//         vm.prank(voter2);
//         token.delegate(voter2);

//         vm.roll(block.number + 1);
//         vm.warp(block.timestamp + 1);

//         vm.prank(voter1);
//         uint256 proposalId = dao.createProposal("Test", "Description", address(0), 0, "");

//         vm.prank(voter1);
//         dao.castVote(proposalId, CampaignDAO.VoteType.For);

//         vm.prank(voter2);
//         dao.castVote(proposalId, CampaignDAO.VoteType.For);

//         vm.warp(block.timestamp + VOTING_PERIOD + 1);

//         dao.executeProposal(proposalId);

//         vm.expectRevert("Proposal already executed");
//         dao.executeProposal(proposalId);
//     }

//     function test_ExecuteProposal_NonExistentProposal() public {
//         vm.expectRevert("Proposal does not exist");
//         dao.executeProposal(999);
//     }

//     // ============================================
//     // TREASURY TESTS
//     // ============================================

//     function test_Treasury_ReceiveETH() public {
//         uint256 amount = 5 ether;

//         vm.expectEmit(true, false, false, true);
//         emit FundsReceived(address(this), amount);

//         (bool success,) = address(dao).call{value: amount}("");
//         assertTrue(success, "Should receive ETH");

//         assertEq(dao.getTreasuryBalance(), amount, "Treasury balance should match");
//     }

//     function test_Treasury_GetBalance() public {
//         vm.deal(address(dao), 10 ether);

//         uint256 balance = dao.getTreasuryBalance();
//         assertEq(balance, 10 ether, "Should return correct balance");
//     }

//     function test_Treasury_EmergencyWithdraw_Success() public {
//         // Fund DAO
//         vm.deal(address(dao), 10 ether);

//         address payable recipient = payable(address(0x123));
//         uint256 amount = 5 ether;

//         vm.startPrank(campaignCreator);

//         uint256 balanceBefore = recipient.balance;

//         vm.expectEmit(true, false, false, true);
//         emit FundsWithdrawn(recipient, amount);

//         dao.emergencyWithdraw(recipient, amount);

//         uint256 balanceAfter = recipient.balance;
//         assertEq(balanceAfter, balanceBefore + amount, "Recipient should receive funds");
//         assertEq(dao.getTreasuryBalance(), 5 ether, "Remaining balance should be correct");

//         vm.stopPrank();
//     }

//     function test_Treasury_EmergencyWithdraw_OnlyCreator() public {
//         vm.deal(address(dao), 10 ether);

//         vm.startPrank(voter1);

//         vm.expectRevert("Only campaign creator");
//         dao.emergencyWithdraw(payable(voter1), 1 ether);

//         vm.stopPrank();
//     }

//     function test_Treasury_EmergencyWithdraw_InvalidRecipient() public {
//         vm.deal(address(dao), 10 ether);

//         vm.startPrank(campaignCreator);

//         vm.expectRevert("Invalid recipient");
//         dao.emergencyWithdraw(payable(address(0)), 1 ether);

//         vm.stopPrank();
//     }

//     function test_Treasury_EmergencyWithdraw_InsufficientBalance() public {
//         vm.deal(address(dao), 1 ether);

//         vm.startPrank(campaignCreator);

//         vm.expectRevert("Insufficient balance");
//         dao.emergencyWithdraw(payable(voter1), 10 ether);

//         vm.stopPrank();
//     }

//     // ============================================
//     // ADMIN/PARAMETER UPDATE TESTS
//     // ============================================

//     function test_UpdateParameters_Success() public {
//         uint256 newThreshold = 2000 * 10**18;
//         uint256 newVotingPeriod = 5 days;
//         uint256 newQuorum = 3000; // 30%
//         uint256 newMajority = 6000; // 60%

//         vm.startPrank(campaignCreator);

//         vm.expectEmit(false, false, false, true);
//         emit ParametersUpdated(newThreshold, newVotingPeriod, newQuorum, newMajority);

//         dao.updateParameters(newThreshold, newVotingPeriod, newQuorum, newMajority);

//         assertEq(dao.proposalThreshold(), newThreshold, "Threshold should be updated");
//         assertEq(dao.votingPeriod(), newVotingPeriod, "Voting period should be updated");
//         assertEq(dao.quorumPercentage(), newQuorum, "Quorum should be updated");
//         assertEq(dao.majorityPercentage(), newMajority, "Majority should be updated");

//         vm.stopPrank();
//     }

//     function test_UpdateParameters_OnlyCreator() public {
//         vm.startPrank(voter1);

//         vm.expectRevert("Only campaign creator");
//         dao.updateParameters(1000 * 10**18, 3 days, 2500, 5000);

//         vm.stopPrank();
//     }

//     function test_UpdateParameters_InvalidQuorum() public {
//         vm.startPrank(campaignCreator);

//         vm.expectRevert("Quorum must be <= 100%");
//         dao.updateParameters(1000 * 10**18, 3 days, 10001, 5000);

//         vm.stopPrank();
//     }

//     function test_UpdateParameters_InvalidMajority() public {
//         vm.startPrank(campaignCreator);

//         vm.expectRevert("Majority must be <= 100%");
//         dao.updateParameters(1000 * 10**18, 3 days, 2500, 10001);

//         vm.stopPrank();
//     }

//     function test_TransferCreator_Success() public {
//         address newCreator = address(0x789);

//         vm.startPrank(campaignCreator);

//         dao.transferCreator(newCreator);

//         assertEq(dao.campaignCreator(), newCreator, "Creator should be updated");

//         vm.stopPrank();
//     }

//     function test_TransferCreator_OnlyCreator() public {
//         vm.startPrank(voter1);

//         vm.expectRevert("Only campaign creator");
//         dao.transferCreator(voter1);

//         vm.stopPrank();
//     }

//     function test_TransferCreator_InvalidAddress() public {
//         vm.startPrank(campaignCreator);

//         vm.expectRevert("Invalid address");
//         dao.transferCreator(address(0));

//         vm.stopPrank();
//     }

//     // ============================================
//     // VIEW FUNCTION TESTS
//     // ============================================

//     function test_GetVotingPower() public {
//         vm.prank(voter1);
//         token.delegate(voter1);
//         vm.roll(block.number + 1);

//         uint256 votingPower = dao.getVotingPower(voter1);
//         assertEq(votingPower, token.balanceOf(voter1), "Voting power should match balance");
//     }

//     function test_GetVotingPower_NotDelegated() public view {
//         // voter1 has not delegated
//         uint256 votingPower = dao.getVotingPower(voter1);
//         assertEq(votingPower, 0, "Voting power should be zero without delegation");
//     }

//     function test_GetPastVotingPower() public {
//         vm.prank(voter1);
//         token.delegate(voter1);
//         vm.roll(block.number + 1);
//         vm.warp(block.timestamp + 1);

//         uint256 timestamp = block.timestamp - 1;

//         // Move forward in time
//         vm.warp(block.timestamp + 1 days);
//         vm.roll(block.number + 100);

//         uint256 pastVotingPower = dao.getPastVotingPower(voter1, timestamp);
//         assertEq(pastVotingPower, token.balanceOf(voter1), "Past voting power should match balance");
//     }

//     function test_HasAddressVoted() public {
//         vm.prank(voter1);
//         token.delegate(voter1);

//         vm.roll(block.number + 1);
//         vm.warp(block.timestamp + 1);

//         vm.prank(voter1);
//         uint256 proposalId = dao.createProposal("Test", "Description", address(0), 0, "");

//         assertFalse(dao.hasAddressVoted(proposalId, voter1), "Should not have voted yet");

//         vm.prank(voter1);
//         dao.castVote(proposalId, CampaignDAO.VoteType.For);

//         assertTrue(dao.hasAddressVoted(proposalId, voter1), "Should have voted");
//     }

//     function test_GetVote() public {
//         vm.prank(voter1);
//         token.delegate(voter1);

//         vm.roll(block.number + 1);
//         vm.warp(block.timestamp + 1);

//         vm.prank(voter1);
//         uint256 proposalId = dao.createProposal("Test", "Description", address(0), 0, "");

//         vm.prank(voter1);
//         dao.castVote(proposalId, CampaignDAO.VoteType.For);

//         CampaignDAO.VoteType voteType = dao.getVote(proposalId, voter1);
//         assertEq(uint256(voteType), uint256(CampaignDAO.VoteType.For), "Vote type should match");
//     }

//     function test_GetVote_NotVoted() public {
//         vm.prank(voter1);
//         token.delegate(voter1);
//         vm.roll(block.number + 1);

//         vm.prank(voter1);
//         uint256 proposalId = dao.createProposal("Test", "Description", address(0), 0, "");

//         vm.expectRevert("Address has not voted");
//         dao.getVote(proposalId, voter2);
//     }

//     // ============================================
//     // INTEGRATION TESTS
//     // ============================================

//     function test_Integration_CompleteProposalLifecycle() public {
//         // Fund the DAO
//         vm.deal(address(dao), 10 ether);

//         // 1. Delegate voting power
//         vm.prank(voter1);
//         token.delegate(voter1);
//         vm.prank(voter2);
//         token.delegate(voter2);
//         vm.prank(voter3);
//         token.delegate(voter3);

//         vm.roll(block.number + 1);
//         vm.warp(block.timestamp + 1);

//         // 2. Create proposal
//         vm.prank(voter1);
//         uint256 proposalId = dao.createProposal(
//             "Treasury Allocation",
//             "Allocate 1 ETH for development",
//             address(0),
//             1 ether,
//             ""
//         );

//         assertEq(uint256(dao.getProposalState(proposalId)), uint256(CampaignDAO.ProposalState.Active));

//         // 3. Cast votes
//         vm.prank(voter1); // 30% for
//         dao.castVote(proposalId, CampaignDAO.VoteType.For);

//         vm.prank(voter2); // 20% for
//         dao.castVote(proposalId, CampaignDAO.VoteType.For);

//         vm.prank(voter3); // 10% against
//         dao.castVote(proposalId, CampaignDAO.VoteType.Against);

//         // Still active during voting period
//         assertEq(uint256(dao.getProposalState(proposalId)), uint256(CampaignDAO.ProposalState.Active));

//         // 4. Wait for voting to end
//         vm.warp(block.timestamp + VOTING_PERIOD + 1);

//         // Check state is succeeded
//         assertEq(uint256(dao.getProposalState(proposalId)), uint256(CampaignDAO.ProposalState.Succeeded));

//         // 5. Execute proposal
//         uint256 proposerBalanceBefore = voter1.balance;
//         dao.executeProposal(proposalId);
//         uint256 proposerBalanceAfter = voter1.balance;

//         assertEq(proposerBalanceAfter, proposerBalanceBefore + 1 ether, "Proposer should receive ETH");
//         assertEq(uint256(dao.getProposalState(proposalId)), uint256(CampaignDAO.ProposalState.Executed));

//         CampaignDAO.Proposal memory proposal = dao.getProposal(proposalId);
//         assertTrue(proposal.executed, "Proposal should be marked as executed");
//     }

//     function test_Integration_MultipleProposalsConcurrent() public {
//         vm.prank(voter1);
//         token.delegate(voter1);

//         vm.roll(block.number + 1);
//         vm.warp(block.timestamp + 1);

//         // Create multiple proposals
//         vm.startPrank(voter1);
//         uint256 proposalId1 = dao.createProposal("Proposal 1", "Description 1", address(0), 0, "");
//         uint256 proposalId2 = dao.createProposal("Proposal 2", "Description 2", address(0), 0, "");
//         uint256 proposalId3 = dao.createProposal("Proposal 3", "Description 3", address(0), 0, "");

//         // Vote on all proposals
//         dao.castVote(proposalId1, CampaignDAO.VoteType.For);
//         dao.castVote(proposalId2, CampaignDAO.VoteType.Against);
//         dao.castVote(proposalId3, CampaignDAO.VoteType.Abstain);
//         vm.stopPrank();

//         // Verify all votes recorded correctly
//         assertTrue(dao.hasAddressVoted(proposalId1, voter1));
//         assertTrue(dao.hasAddressVoted(proposalId2, voter1));
//         assertTrue(dao.hasAddressVoted(proposalId3, voter1));

//         assertEq(uint256(dao.getVote(proposalId1, voter1)), uint256(CampaignDAO.VoteType.For));
//         assertEq(uint256(dao.getVote(proposalId2, voter1)), uint256(CampaignDAO.VoteType.Against));
//         assertEq(uint256(dao.getVote(proposalId3, voter1)), uint256(CampaignDAO.VoteType.Abstain));
//     }

//     // Helper function to receive ETH
//     receive() external payable {}
// }
