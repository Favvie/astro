// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CampaignDAO
 * @dev A DAO instance for a single campaign where token holders can vote on proposals
 * @notice Each campaign gets its own DAO instance. Only holders of the campaign token can vote.
 *
 * Features:
 * - Campaign-specific governance
 * - Token-weighted voting (based on token balance)
 * - Proposal creation by token holders with title and description
 * - Time-bound voting periods
 * - Quorum and majority requirements
 * - Treasury management for campaign funds
 * - Security: ReentrancyGuard, checks-effects-interactions pattern
 *
 * NOTE: This uses simple balance-based voting. Users can vote with their current token balance.
 */
contract CampaignDAO is ReentrancyGuard {

    // ============================================
    // STATE VARIABLES
    // ============================================

    /// @notice The campaign token used for voting
    IERC20 public immutable campaignToken;

    /// @notice Campaign ID this DAO governs
    uint256 public immutable campaignId;

    /// @notice Campaign creator/owner
    address public campaignCreator;

    /// @notice Minimum tokens required to create a proposal (in token wei)
    uint256 public proposalThreshold;

    /// @notice Voting period duration in seconds (default: 3 days)
    uint256 public votingPeriod;

    /// @notice Minimum quorum percentage required (in basis points, 10000 = 100%)
    uint256 public quorumPercentage;

    /// @notice Minimum majority percentage required (in basis points, 10000 = 100%)
    uint256 public majorityPercentage;

    /// @notice Counter for proposal IDs
    uint256 public proposalCount;

    string public hederaTopicId;

    // ============================================
    // ENUMS
    // ============================================

    enum ProposalState {
        Pending,    // Proposal created, voting not started
        Active,     // Voting in progress
        Defeated,   // Voting ended, proposal failed
        Succeeded,  // Voting ended, proposal passed
        Executed    // Proposal has been executed
    }

    enum VoteType {
        Against,
        For,
        Abstain
    }

    // ============================================
    // STRUCTS
    // ============================================

    struct Proposal {
        uint256 id;
        address proposer;
        string title;           // Short title of the proposal
        string description;     // Detailed description
        uint256 startTime;
        uint256 endTime;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool executed;
    }

    // ============================================
    // MAPPINGS
    // ============================================

    /// @notice Mapping of proposal ID to Proposal
    mapping(uint256 => Proposal) public proposals;

    /// @notice Mapping of proposal ID => voter => has voted
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    /// @notice Mapping of proposal ID => voter => vote type
    mapping(uint256 => mapping(address => VoteType)) public votes;

    /// @notice Mapping of proposal ID => voter => voting power used
    mapping(uint256 => mapping(address => uint256)) public votingPowerUsed;

    // ============================================
    // EVENTS
    // ============================================

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        string description,
        uint256 startTime,
        uint256 endTime
    );

    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        VoteType voteType,
        uint256 weight
    );

    event ProposalExecuted(uint256 indexed proposalId);

    event FundsReceived(address indexed sender, uint256 amount);

    event FundsWithdrawn(address indexed recipient, uint256 amount);

    event ParametersUpdated(
        uint256 proposalThreshold,
        uint256 votingPeriod,
        uint256 quorumPercentage,
        uint256 majorityPercentage
    );

    // ============================================
    // MODIFIERS
    // ============================================

    modifier onlyCampaignCreator() {
        require(msg.sender == campaignCreator, "Only campaign creator");
        _;
    }

    // ============================================
    // CONSTRUCTOR
    // ============================================

    /**
     * @dev Initialize the campaign DAO
     * @param _campaignToken Address of the campaign token
     * @param _campaignId ID of the campaign
     * @param _campaignCreator Address of the campaign creator
     * @param _proposalThreshold Minimum tokens required to create a proposal
     * @param _votingPeriod Duration of voting period in seconds
     * @param _quorumPercentage Minimum participation percentage (in basis points)
     * @param _majorityPercentage Minimum approval percentage (in basis points)
     */
    constructor(
        address _campaignToken,
        uint256 _campaignId,
        string memory _hederaTopicId,
        address _campaignCreator,
        uint256 _proposalThreshold,
        uint256 _votingPeriod,
        uint256 _quorumPercentage,
        uint256 _majorityPercentage
    ) {
        require(_campaignToken != address(0), "Invalid token address");
        require(_campaignCreator != address(0), "Invalid creator address");
        require(_quorumPercentage <= 10000, "Quorum must be <= 100%");
        require(_majorityPercentage <= 10000, "Majority must be <= 100%");

        campaignToken = IERC20(_campaignToken);
        campaignId = _campaignId;
        campaignCreator = _campaignCreator;
        proposalThreshold = _proposalThreshold;
        votingPeriod = _votingPeriod;
        quorumPercentage = _quorumPercentage;
        majorityPercentage = _majorityPercentage;
        hederaTopicId = _hederaTopicId;
    }

    // ============================================
    // PROPOSAL CREATION
    // ============================================

    /**
     * @notice Create a new proposal
     * @param _title Short title of the proposal
     * @param _description Detailed description of the proposal
     * @return proposalId The ID of the created proposal
     */
    function createProposal(
        string memory _title,
        string memory _description
    ) external returns (uint256) {
        // Check if proposer has minimum required tokens
        require(
            campaignToken.balanceOf(msg.sender) >= proposalThreshold,
            "Insufficient tokens to create proposal"
        );

        require(bytes(_title).length > 0, "Empty title");
        require(bytes(_description).length > 0, "Empty description");

        // Increment proposal counter
        proposalCount++;
        uint256 proposalId = proposalCount;

        // Calculate voting period
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + votingPeriod;

        // Create proposal
        proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: msg.sender,
            title: _title,
            description: _description,
            startTime: startTime,
            endTime: endTime,
            forVotes: 0,
            againstVotes: 0,
            abstainVotes: 0,
            executed: false
        });

        emit ProposalCreated(
            proposalId,
            msg.sender,
            _title,
            _description,
            startTime,
            endTime
        );

        return proposalId;
    }

    // ============================================
    // VOTING
    // ============================================

    /**
     * @notice Cast a vote on a proposal
     * @param _proposalId ID of the proposal to vote on
     * @param _voteType Type of vote (Against, For, Abstain)
     */
    function castVote(uint256 _proposalId, VoteType _voteType) external {
        Proposal storage proposal = proposals[_proposalId];

        require(proposal.id != 0, "Proposal does not exist");
        require(block.timestamp >= proposal.startTime, "Voting not started");
        require(block.timestamp <= proposal.endTime, "Voting ended");
        require(!hasVoted[_proposalId][msg.sender], "Already voted");

        // Get voting weight (current token balance)
        uint256 weight = campaignToken.balanceOf(msg.sender);
        require(weight > 0, "No tokens to vote");

        // Record vote
        hasVoted[_proposalId][msg.sender] = true;
        votes[_proposalId][msg.sender] = _voteType;
        votingPowerUsed[_proposalId][msg.sender] = weight;

        // Update vote counts
        if (_voteType == VoteType.For) {
            proposal.forVotes += weight;
        } else if (_voteType == VoteType.Against) {
            proposal.againstVotes += weight;
        } else {
            proposal.abstainVotes += weight;
        }

        emit VoteCast(_proposalId, msg.sender, _voteType, weight);
    }

    // ============================================
    // PROPOSAL EXECUTION
    // ============================================

    /**
     * @notice Execute a proposal that has passed
     * @param _proposalId ID of the proposal to execute
     */
    function executeProposal(uint256 _proposalId) external nonReentrant {
        Proposal storage proposal = proposals[_proposalId];

        require(proposal.id != 0, "Proposal does not exist");
        require(block.timestamp > proposal.endTime, "Voting still active");
        require(!proposal.executed, "Proposal already executed");

        ProposalState state = getProposalState(_proposalId);
        require(state == ProposalState.Succeeded, "Proposal did not pass");

        // Mark as executed
        proposal.executed = true;

        emit ProposalExecuted(_proposalId);
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    /**
     * @notice Get the current state of a proposal
     * @param _proposalId ID of the proposal
     * @return Current state of the proposal
     */
    function getProposalState(uint256 _proposalId) public view returns (ProposalState) {
        Proposal storage proposal = proposals[_proposalId];

        require(proposal.id != 0, "Proposal does not exist");

        if (proposal.executed) {
            return ProposalState.Executed;
        }

        if (block.timestamp <= proposal.endTime) {
            return ProposalState.Active;
        }

        // Check if proposal passed
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;

        // Check quorum (minimum participation) using current total supply
        uint256 currentSupply = campaignToken.totalSupply();
        bool quorumReached = (totalVotes * 10000) >= (currentSupply * quorumPercentage);

        // Check majority (minimum approval)
        uint256 totalDecisiveVotes = proposal.forVotes + proposal.againstVotes;
        bool majorityReached = totalDecisiveVotes == 0 ? false :
            (proposal.forVotes * 10000) >= (totalDecisiveVotes * majorityPercentage);

        if (quorumReached && majorityReached) {
            return ProposalState.Succeeded;
        }

        return ProposalState.Defeated;
    }

    /**
     * @notice Get detailed information about a proposal
     * @param _proposalId ID of the proposal
     * @return proposal The proposal struct
     */
    function getProposal(uint256 _proposalId) external view returns (Proposal memory) {
        require(proposals[_proposalId].id != 0, "Proposal does not exist");
        return proposals[_proposalId];
    }

    /**
     * @notice Check if an address has voted on a proposal
     * @param _proposalId ID of the proposal
     * @param _voter Address to check
     * @return Whether the address has voted
     */
    function hasAddressVoted(uint256 _proposalId, address _voter) external view returns (bool) {
        return hasVoted[_proposalId][_voter];
    }

    /**
     * @notice Get the vote type for an address on a proposal
     * @param _proposalId ID of the proposal
     * @param _voter Address to check
     * @return The vote type (only valid if address has voted)
     */
    function getVote(uint256 _proposalId, address _voter) external view returns (VoteType) {
        require(hasVoted[_proposalId][_voter], "Address has not voted");
        return votes[_proposalId][_voter];
    }

    /**
     * @notice Get current voting power of an address (token balance)
     * @param _voter Address to check
     * @return Current token balance
     */
    function getVotingPower(address _voter) external view returns (uint256) {
        return campaignToken.balanceOf(_voter);
    }

    // ============================================
    // TREASURY FUNCTIONS
    // ============================================

    /**
     * @notice Receive ETH into the DAO treasury
     */
    receive() external payable {
        emit FundsReceived(msg.sender, msg.value);
    }

    /**
     * @notice Fallback function to receive ETH
     */
    fallback() external payable {
        emit FundsReceived(msg.sender, msg.value);
    }

    /**
     * @notice Get the treasury balance
     * @return Current ETH balance of the DAO
     */
    function getTreasuryBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Emergency withdraw function (only campaign creator)
     * @dev This should be used sparingly and governed by proposals in production
     * @param _recipient Address to send funds to
     * @param _amount Amount to withdraw
     */
    function emergencyWithdraw(address payable _recipient, uint256 _amount)
        external
        onlyCampaignCreator
        nonReentrant
    {
        require(_recipient != address(0), "Invalid recipient");
        require(_amount <= address(this).balance, "Insufficient balance");

        (bool success, ) = _recipient.call{value: _amount}("");
        require(success, "Withdrawal failed");

        emit FundsWithdrawn(_recipient, _amount);
    }

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================

    /**
     * @notice Update DAO parameters (only campaign creator initially)
     * @dev In production, this should be governed by proposals
     * @param _proposalThreshold New proposal threshold
     * @param _votingPeriod New voting period
     * @param _quorumPercentage New quorum percentage
     * @param _majorityPercentage New majority percentage
     */
    function updateParameters(
        uint256 _proposalThreshold,
        uint256 _votingPeriod,
        uint256 _quorumPercentage,
        uint256 _majorityPercentage
    ) external onlyCampaignCreator {
        require(_quorumPercentage <= 10000, "Quorum must be <= 100%");
        require(_majorityPercentage <= 10000, "Majority must be <= 100%");

        proposalThreshold = _proposalThreshold;
        votingPeriod = _votingPeriod;
        quorumPercentage = _quorumPercentage;
        majorityPercentage = _majorityPercentage;

        emit ParametersUpdated(
            _proposalThreshold,
            _votingPeriod,
            _quorumPercentage,
            _majorityPercentage
        );
    }

    /**
     * @notice Transfer campaign creator role (only current creator)
     * @param _newCreator Address of the new creator
     */
    function transferCreator(address _newCreator) external onlyCampaignCreator {
        require(_newCreator != address(0), "Invalid address");
        campaignCreator = _newCreator;
    }
}
