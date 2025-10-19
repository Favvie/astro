# Campaign DAO - Complete Guide

> **A comprehensive Decentralized Autonomous Organization (DAO) system where each campaign gets its own DAO with snapshot-based voting.**

---

## 📋 Table of Contents

### Part 1: Overview & Getting Started
- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Smart Contract Details](#smart-contract-details)
- [Security Features](#security-features)

### Part 2: Deployment & Usage
- [Deployment](#deployment)
- [Usage Examples](#usage-examples)
- [Testing](#testing)
- [Common Use Cases](#common-use-cases)

### Part 3: Integration Guide
- [Quick Start](#quick-start-integration)
- [Step-by-Step Integration](#step-by-step-integration)
- [Token Delegation (Required!)](#token-delegation-required)
- [Frontend Integration](#frontend-integration)
- [Database Schema](#database-schema-update)
- [API Endpoints](#example-api-endpoints)
- [Troubleshooting](#troubleshooting-1)

### Part 4: Voting System Explained
- [Snapshot-Based Voting](#snapshot-based-voting)
- [Double Voting Prevention](#double-voting-prevention)
- [Token-Weighted Voting](#token-weighted-voting-explained)
- [What is Delegation?](#what-is-token-delegation)
- [Integration Guide](#integration-guide-1)
- [Common Questions](#common-questions)
- [Security Benefits](#security-benefits)

---

# Part 1: Overview & Getting Started

## Overview

This DAO system consists of three main smart contracts:

1. **CampaignDAO.sol** - Individual DAO instance for each campaign
2. **CampaignDAOFactory.sol** - Factory contract to create and track DAOs
3. **TokenFacet.sol** - Campaign ERC-20 token (already part of your launchpad)

### Key Concept

**Each campaign = One DAO + One token**
- When a campaign is created, a DAO is also created
- Only holders of that campaign's token can participate in that DAO
- Each DAO has independent governance and treasury

## Overview

This DAO system consists of three main smart contracts:

1. **CampaignDAO.sol** - Individual DAO instance for each campaign
2. **CampaignDAOFactory.sol** - Factory contract to create and track DAOs
3. **TokenFacet.sol** - Campaign ERC-20 token (already part of your launchpad)

### Key Concept

**Each campaign = One DAO + One token**
- When a campaign is created, a DAO is also created
- Only holders of that campaign's token can participate in that DAO
- Each DAO has independent governance and treasury

## Features

### Per-Campaign Governance
- **Isolated DAOs**: Each campaign has its own independent DAO
- **Token-Based Voting**: Only campaign token holders can vote
- **Campaign-Specific Proposals**: Govern campaign funds, parameters, and decisions
- **Factory Pattern**: Efficiently create DAOs for new campaigns

### Campaign Token (TokenFacet)
- ERC-20 compliant tokens (already in your system)
- Each campaign has its own token
- Token holders = DAO voters
- Burnable tokens

### DAO Governance
- **Proposal Creation**: Token holders can create proposals with execution logic
- **Voting System**: Proportional voting based on token holdings
- **Time-bound Voting**: Configurable voting periods (default: 3 days)
- **Quorum & Majority**: Require minimum participation and approval percentages
- **Proposal Execution**: Automatic execution of approved proposals
- **Treasury Management**: Each DAO manages its own campaign treasury

## Architecture

```
┌──────────────────────┐
│ CampaignDAOFactory   │ ◄─── Deploy once
│  - Creates DAOs      │
│  - Tracks all DAOs   │
└──────────┬───────────┘
           │
           │ creates
           ▼
┌──────────────────────┐     ┌──────────────────────┐
│   Campaign #1        │     │   Campaign #2        │
├──────────────────────┤     ├──────────────────────┤
│ TokenFacet (Token A) │     │ TokenFacet (Token B) │
│        +             │     │        +             │
│  CampaignDAO (DAO A) │     │  CampaignDAO (DAO B) │
│   - Proposals        │     │   - Proposals        │
│   - Voting           │     │   - Voting           │
│   - Treasury         │     │   - Treasury         │
└──────────────────────┘     └──────────────────────┘

Token A holders → Vote in DAO A only
Token B holders → Vote in DAO B only
```

**Flow:**
1. Campaign created → Token deployed (TokenFacet)
2. **If** campaign has `isDAOEnabled = true`:
   - Call `CampaignDAOFactory.createCampaignDAO()` with token address
   - DAO instance created for that campaign
   - Token holders can now govern their campaign
3. **If** `isDAOEnabled = false`:
   - No DAO is created
   - Campaign operates without governance

## Smart Contract Details

### CampaignDAOFactory.sol

**Purpose:** Creates and tracks DAO instances for campaigns

**Key Functions:**
```solidity
// Create a DAO for a campaign (uses default parameters)
function createCampaignDAO(
    address _campaignToken,
    uint256 _campaignId,
    address _campaignCreator,
    bool _isDAOEnabled  // Must be true
) external returns (address)

// Create a DAO with custom parameters
function createCampaignDAOWithCustomParams(
    address _campaignToken,
    uint256 _campaignId,
    address _campaignCreator,
    bool _isDAOEnabled,  // Must be true
    uint256 _proposalThreshold,
    uint256 _votingPeriod,
    uint256 _quorumPercentage,
    uint256 _majorityPercentage
) external returns (address)

// Get DAO address for a campaign
function getDAOByCampaign(uint256 _campaignId) external view returns (address)

// Get DAO address for a token
function getDAOByToken(address _tokenAddress) external view returns (address)

// Get all DAOs
function getAllDAOs() external view returns (address[] memory)
```

### CampaignDAO.sol

**Purpose:** Individual DAO instance for a single campaign

**Key Functions:**
```solidity
// Create a new proposal
function createProposal(
    string memory _description,
    address _target,
    uint256 _value,
    bytes memory _callData
) external returns (uint256)

// Vote on a proposal (0=Against, 1=For, 2=Abstain)
function castVote(uint256 _proposalId, VoteType _voteType) external

// Execute a passed proposal
function executeProposal(uint256 _proposalId) external

// Get proposal state
function getProposalState(uint256 _proposalId) public view returns (ProposalState)

// Get proposal details
function getProposal(uint256 _proposalId) external view returns (Proposal memory)

// Get voting power of an address
function getVotingPower(address _voter) external view returns (uint256)

// Get treasury balance
function getTreasuryBalance() external view returns (uint256)
```

## Security Features

### Built-in Protection
1. **ReentrancyGuard**: Prevents reentrancy attacks on execution
2. **Checks-Effects-Interactions**: Proper ordering in state-changing functions
3. **Current Balance Voting**: Uses token balance at vote time
4. **Time-locks**: Voting periods prevent immediate execution
5. **Access Control**: Campaign creator functions for sensitive operations
6. **Isolated Governance**: Each campaign DAO is independent

### Security Best Practices
- **Snapshot-Based Voting**: Uses ERC20Votes to prevent vote buying and double counting
- **Delegation Required**: Users must delegate tokens to activate voting power
- **Historical Queries**: Can verify voting power at any past time
- Proposals are marked as executed before external calls
- State updates happen before value transfers
- Comprehensive input validation
- Events for all critical state changes

### Voting Mechanism
- **Snapshot Voting**: Voting power is locked at proposal creation time
- **No Vote Buying**: Can't buy tokens after proposal starts to influence vote
- **No Double Counting**: Transferring tokens after voting doesn't help
- **Delegation Required**: Token holders must call `token.delegate(address)` before voting

📖 **For detailed explanation**, see [VOTING_SYSTEM_EXPLAINED.md](VOTING_SYSTEM_EXPLAINED.md)

## Deployment

### Prerequisites
```bash
# Install dependencies
yarn install

# Compile contracts
yarn compile
```

### Deploy the DAO Factory
```bash
# Deploy to local network
yarn deploy --tags CampaignDAO

# Deploy to specific network
yarn deploy --network sepolia --tags CampaignDAO
```

### Deployment Configuration

The deployment script (`deploy/02_deploy_campaign_dao.ts`) deploys the factory with these default parameters:

| Parameter | Default Value | Description |
|-----------|---------------|-------------|
| Proposal Threshold | 100 tokens | Min tokens to create proposal |
| Voting Period | 3 days | Duration of voting |
| Quorum | 10% | Min participation required |
| Majority | 50% | Min approval percentage |

**Note:** These are default values. You can customize parameters per campaign when creating a DAO.

## Usage Examples

### 1. Deploy and Setup

```bash
# Deploy DAO Factory
yarn deploy --tags CampaignDAO

# This will:
# - Deploy CampaignDAOFactory
# - Create example campaign DAO
# - Fund example treasury
```

### 2. Interact with Campaign DAOs

Run the interaction script to see a complete workflow:

```bash
npx hardhat run scripts/campaignDaoInteraction.ts --network localhost
```

### 3. Integration with Your Launchpad

#### When Creating a Campaign

After deploying a campaign token, create its DAO:

```javascript
// In your campaign creation flow
const daoFactory = await ethers.getContract("CampaignDAOFactory");

// Create DAO for the campaign
const createDaoTx = await daoFactory.createCampaignDAO(
  campaignTokenAddress,  // The TokenFacet address
  campaignId,            // Your campaign ID
  campaignCreator        // Campaign creator address
);
await createDaoTx.wait();

// Get the DAO address
const daoAddress = await daoFactory.getDAOByCampaign(campaignId);
console.log("DAO created at:", daoAddress);
```

#### Custom DAO Parameters (Optional)

```javascript
// Create DAO with custom governance parameters
const daoAddress = await daoFactory.createCampaignDAOWithCustomParams(
  campaignTokenAddress,
  campaignId,
  campaignCreator,
  ethers.parseEther("500"),  // 500 token threshold
  5 * 24 * 60 * 60,          // 5 day voting period
  1500,                      // 15% quorum
  6000                       // 60% majority
);
```

#### Token Holders Create Proposals

```javascript
// Get the campaign DAO instance
const campaignDAO = await ethers.getContractAt("CampaignDAO", daoAddress);

// Token holder creates a proposal
const proposalTx = await campaignDAO.connect(tokenHolder).createProposal(
  "Marketing Campaign Funding",              // title
  "Transfer 2 ETH from treasury to fund marketing on social media", // description
  recipientAddress,                          // target
  ethers.parseEther("2"),                   // value (2 ETH)
  "0x"                                      // calldata (empty for simple transfer)
);
await proposalTx.wait();

console.log("Proposal created! ID: 1");
```

#### Advanced: Proposal with Function Call

```javascript
// Example: Update DAO parameters
const calldata = campaignDAO.interface.encodeFunctionData("updateParameters", [
  ethers.parseEther("200"),  // new proposal threshold
  5 * 24 * 60 * 60,          // new voting period (5 days)
  1500,                      // new quorum (15%)
  6000                       // new majority (60%)
]);

await campaignDAO.createProposal(
  "Update DAO Governance Parameters",  // title
  "Increase proposal threshold to 200 tokens and extend voting period to 5 days", // description
  daoAddress,      // target is DAO itself
  0,               // no ETH transfer
  calldata
);
```

#### Vote on Proposals

```javascript
// VoteType: 0 = Against, 1 = For, 2 = Abstain
const proposalId = 1;

// Token holders vote (voting power = token balance)
await campaignDAO.connect(tokenHolder1).castVote(proposalId, 1); // FOR
await campaignDAO.connect(tokenHolder2).castVote(proposalId, 1); // FOR
await campaignDAO.connect(tokenHolder3).castVote(proposalId, 0); // AGAINST
```

#### Check Proposal Status

```javascript
const proposal = await campaignDAO.getProposal(proposalId);
console.log("For votes:", ethers.formatEther(proposal.forVotes));
console.log("Against votes:", ethers.formatEther(proposal.againstVotes));
console.log("Abstain votes:", ethers.formatEther(proposal.abstainVotes));

const state = await campaignDAO.getProposalState(proposalId);
// States: 0=Pending, 1=Active, 2=Defeated, 3=Succeeded, 4=Executed
```

#### Execute Passed Proposals

```javascript
// Wait for voting period to end (3 days default)
// In production: wait naturally
// In testing: increase blockchain time

await ethers.provider.send("evm_increaseTime", [3 * 24 * 60 * 60 + 1]);
await ethers.provider.send("evm_mine", []);

// Execute if passed
const state = await campaignDAO.getProposalState(proposalId);
if (state === 3n) { // Succeeded
  await campaignDAO.executeProposal(proposalId);
  console.log("Proposal executed!");
}
```

## Testing

### Run Tests
```bash
# Run all tests
yarn test

# Run with gas reporting
REPORT_GAS=true yarn test

# Run specific test file
yarn test test/BasicDAO.test.ts
```

### Example Test Structure
```javascript
describe("BasicDAO", function () {
  it("Should create a proposal", async function () {
    // Test proposal creation
  });

  it("Should allow voting on proposals", async function () {
    // Test voting mechanism
  });

  it("Should execute passed proposals", async function () {
    // Test execution logic
  });
});
```

## Common Use Cases

### 1. Treasury Management
```javascript
// Proposal to transfer funds
await basicDAO.createProposal(
  "Fund marketing campaign",
  marketingWallet,
  ethers.parseEther("5"),
  "0x"
);
```

### 2. Parameter Updates
```javascript
// Proposal to change DAO parameters
const calldata = basicDAO.interface.encodeFunctionData("updateParameters", [
  newThreshold, newPeriod, newQuorum, newMajority
]);

await basicDAO.createProposal(
  "Update governance parameters",
  daoAddress,
  0,
  calldata
);
```

### 3. Token Minting
```javascript
// Proposal to mint new tokens
const calldata = governanceToken.interface.encodeFunctionData("mint", [
  recipient,
  amount
]);

await basicDAO.createProposal(
  "Mint tokens for new members",
  tokenAddress,
  0,
  calldata
);
```

### 4. Multi-step Operations
```javascript
// Create a proposal that calls multiple functions
// This requires a helper contract that executes multiple calls
const calldata = multiCallHelper.interface.encodeFunctionData("executeCalls", [
  [call1, call2, call3]
]);

await basicDAO.createProposal(
  "Execute multiple operations",
  multiCallHelperAddress,
  0,
  calldata
);
```

## Configuration Options

### Adjustable Parameters

You can customize the DAO by modifying deployment parameters:

```typescript
// In deploy/01_deploy_dao.ts

const PROPOSAL_THRESHOLD = parseEther("1000");    // Min tokens for proposal
const VOTING_PERIOD = 3 * 24 * 60 * 60;          // 3 days
const QUORUM_PERCENTAGE = 2000;                   // 20% (basis points)
const MAJORITY_PERCENTAGE = 5000;                 // 50% (basis points)
```

### Dynamic Updates

Parameters can be updated through proposals:

```javascript
await basicDAO.updateParameters(
  newProposalThreshold,
  newVotingPeriod,
  newQuorumPercentage,
  newMajorityPercentage
);
```

**Note**: In production, the `updateParameters` function should only be callable through governance proposals, not directly by owner.

## Events

### GovernanceToken Events
```solidity
event Transfer(address indexed from, address indexed to, uint256 value)
event Approval(address indexed owner, address indexed spender, uint256 value)
event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate)
event DelegateVotesChanged(address indexed delegate, uint256 previousBalance, uint256 newBalance)
```

### BasicDAO Events
```solidity
event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string description, uint256 startTime, uint256 endTime)
event VoteCast(uint256 indexed proposalId, address indexed voter, VoteType voteType, uint256 weight)
event ProposalExecuted(uint256 indexed proposalId)
event FundsReceived(address indexed sender, uint256 amount)
event FundsWithdrawn(address indexed recipient, uint256 amount)
event ParametersUpdated(uint256 proposalThreshold, uint256 votingPeriod, uint256 quorumPercentage, uint256 majorityPercentage)
```

## Gas Optimization Tips

1. **Batch Operations**: Group multiple proposals when possible
2. **Efficient Voting**: Vote earlier in the proposal lifecycle
3. **Delegation**: Delegate once, vote many times
4. **Proposal Complexity**: Simpler proposals cost less gas

## Security Considerations

### For Production Deployment

1. **Remove Owner Functions**: Transfer ownership to DAO itself
2. **Audit Smart Contracts**: Get professional security audit
3. **Timelock**: Add timelock for sensitive operations
4. **Upgrade Mechanism**: Consider proxy pattern for upgradability
5. **Emergency Pause**: Implement pause mechanism for emergencies
6. **Rate Limiting**: Add cooldown periods between proposals

### Known Limitations

1. **Owner Privileges**: Current implementation has owner functions for initial setup
2. **No Proposal Cancellation**: Proposals cannot be cancelled once created
3. **Simple Execution**: Only supports single function calls per proposal
4. **No Vote Changes**: Votes cannot be changed once cast

### Recommended Enhancements

1. **Proposal Queuing**: Add timelock between pass and execution
2. **Proposal Cancellation**: Allow proposer to cancel before execution
3. **Vote Delegation with Reason**: Add reason strings to votes
4. **Proposal Dependencies**: Link related proposals
5. **Vesting Schedules**: Integrate token vesting for members

## Troubleshooting

### Common Issues

**"Insufficient tokens to create proposal"**
- Ensure you have delegated tokens to yourself
- Check minimum threshold requirement

**"Voting not started"**
- Wait for proposal start time
- Check blockchain timestamp

**"Already voted"**
- Each address can only vote once per proposal
- Use different address if needed

**"Proposal did not pass"**
- Check if quorum was reached (20% participation)
- Verify majority requirement (50% of votes)

**"Proposal execution failed"**
- Ensure target contract exists
- Verify calldata is correct
- Check treasury has sufficient funds

## License

MIT License - See LICENSE file for details

## Resources

- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [ERC-20 Votes Extension](https://docs.openzeppelin.com/contracts/api/token/erc20#ERC20Votes)
- [Governor Contracts](https://docs.openzeppelin.com/contracts/api/governance)
- [Hardhat Documentation](https://hardhat.org/docs)

## Support

For questions and support:
- Review the interaction examples in `scripts/daoInteraction.ts`
- Check deployment script in `deploy/01_deploy_dao.ts`
- Refer to test files for additional examples

---

**Built with security and simplicity in mind. Perfect for learning DAO governance or building production-ready systems with enhancements.**
---

# Part 3: Integration Guide

Quick guide to integrate the DAO system into your existing launchpad.

## Overview

Each campaign gets its own DAO where token holders can vote on proposals. This enables decentralized governance for each campaign.

## Files Created

### Smart Contracts
- **[CampaignDAO.sol](CampaignDAO.sol)** - Individual DAO for each campaign
- **[CampaignDAOFactory.sol](CampaignDAOFactory.sol)** - Factory to create DAOs
- **[GovernanceToken.sol](GovernanceToken.sol)** - Optional standalone governance token (not needed for your use case)
- **[BasicDAO.sol](BasicDAO.sol)** - Basic DAO example (not needed for your use case)

### Deployment Scripts
- **[deploy/02_deploy_campaign_dao.ts](../deploy/02_deploy_campaign_dao.ts)** - Deploys the DAO factory

### Interaction Scripts
- **[scripts/campaignDaoInteraction.ts](../scripts/campaignDaoInteraction.ts)** - Complete usage example

### Documentation
- **[DAO_README.md](DAO_README.md)** - Comprehensive documentation

## Quick Start

### Step 1: Deploy the DAO Factory

```bash
yarn deploy --tags CampaignDAO
```

This deploys the `CampaignDAOFactory` contract which you'll use to create DAOs for your campaigns.

### Step 2: Integrate into Campaign Creation

In your campaign creation flow (likely in your main Launchpad contract or backend), add DAO creation:

```solidity
// OPTION A: Integrate directly in Solidity

import "./CampaignDAOFactory.sol";

contract YourLaunchpad {
    CampaignDAOFactory public daoFactory;

    constructor(address _daoFactory) {
        daoFactory = CampaignDAOFactory(_daoFactory);
    }

    function createCampaign(...params, bool isDAOEnabled) external {
        // Your existing campaign creation logic
        // ...

        // Create token (you already do this)
        TokenFacet token = new TokenFacet(name, symbol, address(this));

        // NEW: Create DAO only if enabled
        if (isDAOEnabled) {
            address daoAddress = daoFactory.createCampaignDAO(
                address(token),     // campaign token
                campaignId,         // your campaign ID
                msg.sender,         // campaign creator
                isDAOEnabled        // DAO enabled flag (must be true)
            );

            // Store daoAddress with your campaign data
            campaigns[campaignId].daoAddress = daoAddress;
        }

        // Continue with your logic...
    }
}
```

```javascript
// OPTION B: Or call from your backend/scripts

const daoFactory = await ethers.getContract("CampaignDAOFactory");

// After creating campaign token
// Only create DAO if campaign has isDAOEnabled = true
if (campaign.isDAOEnabled) {
  const createDaoTx = await daoFactory.createCampaignDAO(
    tokenAddress,
    campaignId,
    creatorAddress,
    campaign.isDAOEnabled  // Must be true
  );
  await createDaoTx.wait();

  const daoAddress = await daoFactory.getDAOByCampaign(campaignId);
  // Store this DAO address with your campaign data
  campaign.daoAddress = daoAddress;
}
```

### Step 3: Token Delegation (REQUIRED!)

**IMPORTANT:** Users must delegate their tokens before they can vote!

```javascript
// Check if user has delegated
const token = await ethers.getContractAt("TokenFacet", tokenAddress);
const delegatee = await token.delegates(userAddress);

if (delegatee === ethers.ZeroAddress) {
  // User hasn't delegated - show delegation UI
  console.log("⚠️ You must delegate your voting power to vote!");

  // Delegate to self (most common)
  await token.connect(user).delegate(user.address);
  console.log("✅ Voting power activated!");
}

// Now user can vote and create proposals
const votingPower = await token.getVotes(userAddress);
console.log("Your voting power:", ethers.formatEther(votingPower));
```

**Why delegation is required:**
- ERC20Votes requires explicit delegation to activate voting power
- Most users will delegate to themselves
- Can also delegate to another address (proxy voting)
- Creates checkpoints for snapshot-based voting

### Step 4: Frontend Integration

Display DAO information in your campaign UI:

```javascript
// Get campaign's DAO
const daoFactory = await ethers.getContract("CampaignDAOFactory");
const daoAddress = await daoFactory.getDAOByCampaign(campaignId);

// Get DAO contract instance
const dao = await ethers.getContractAt("CampaignDAO", daoAddress);

// Display DAO info
const proposalCount = await dao.proposalCount();
const votingPeriod = await dao.votingPeriod();
const quorum = await dao.quorumPercentage();
const treasury = await dao.getTreasuryBalance();

// Show user's voting power
const votingPower = await dao.getVotingPower(userAddress);
```

### Step 4: Enable Proposal Creation

Let token holders create proposals:

```javascript
// User creates a proposal
const dao = await ethers.getContractAt("CampaignDAO", daoAddress);

const tx = await dao.connect(userSigner).createProposal(
  "Marketing Budget Allocation",   // title
  "Allocate 5 ETH for Q1 marketing campaign across social media platforms", // description
  recipientAddress,                 // where to send funds
  ethers.parseEther("5"),          // amount
  "0x"                              // empty for simple transfer
);
await tx.wait();
```

### Step 5: Enable Voting

Let token holders vote:

```javascript
// User votes on proposal
const VoteType = { Against: 0, For: 1, Abstain: 2 };

const tx = await dao.connect(userSigner).castVote(
  proposalId,
  VoteType.For
);
await tx.wait();
```

### Step 6: Execute Proposals

After voting period ends:

```javascript
// Check if proposal passed
const state = await dao.getProposalState(proposalId);

if (state === 3) { // Succeeded
  // Anyone can execute
  await dao.executeProposal(proposalId);
}
```

## Database Schema Update

Add DAO address to your campaign schema:

```sql
-- Add to your campaigns table
ALTER TABLE campaigns ADD COLUMN dao_address VARCHAR(42);

-- Or in your MongoDB/NoSQL schema
{
  campaignId: number,
  tokenAddress: string,
  daoAddress: string,  // NEW FIELD
  // ... other fields
}
```

## Frontend Components

Create these UI components:

1. **DAO Dashboard** - Show proposals, treasury, stats
2. **Create Proposal Form** - Let token holders submit proposals
3. **Proposal List** - Display active/past proposals
4. **Vote Interface** - Let users vote For/Against/Abstain
5. **Proposal Details** - Show voting results and execution status

## Example API Endpoints

```javascript
// Get campaign DAO info
GET /api/campaigns/:id/dao
Response: {
  daoAddress: "0x...",
  proposalCount: 5,
  treasuryBalance: "10000000000000000000",
  votingPeriod: 259200,
  quorum: 1000,
  majority: 5000
}

// Get proposals for a campaign
GET /api/campaigns/:id/proposals
Response: [{
  id: 1,
  description: "...",
  state: "Active",
  forVotes: "5000000",
  againstVotes: "1000000",
  endTime: "2024-01-20T10:00:00Z"
}]

// Create proposal
POST /api/campaigns/:id/proposals
Body: {
  title: "Marketing Campaign Funding",
  description: "Allocate 2 ETH for marketing campaign...",
  target: "0x...",
  value: "1000000000000000000",
  callData: "0x"
}

// Cast vote
POST /api/proposals/:id/vote
Body: {
  voteType: 1  // 0=Against, 1=For, 2=Abstain
}
```

## Contract Addresses

After deployment, save these addresses:

```javascript
// Example deployment addresses
{
  "CampaignDAOFactory": "0x...",  // Main factory contract

  // Individual DAOs (created per campaign)
  "campaigns": {
    "1": { "dao": "0x..." },
    "2": { "dao": "0x..." },
    // ...
  }
}
```

## Testing

Run the example script to see the full flow:

```bash
npx hardhat run scripts/campaignDaoInteraction.ts --network localhost
```

## Customization Options

### Custom DAO Parameters Per Campaign

```javascript
// Create DAO with custom settings
await daoFactory.createCampaignDAOWithCustomParams(
  tokenAddress,
  campaignId,
  creator,
  ethers.parseEther("100"),  // proposal threshold
  7 * 24 * 60 * 60,          // 7 day voting period
  2000,                       // 20% quorum
  6667                        // 66.67% majority (2/3)
);
```

### Update Factory Defaults

```javascript
// Update default parameters for future DAOs
await daoFactory.updateDefaultParameters(
  ethers.parseEther("50"),   // new default threshold
  5 * 24 * 60 * 60,          // new default voting period
  1500,                      // new default quorum
  5500                       // new default majority
);
```

## Security Considerations

1. **Access Control**: Only campaign creator can update DAO parameters initially
2. **Treasury Safety**: Proposals require quorum and majority to pass
3. **Emergency Functions**: Campaign creator has emergency withdraw (use sparingly)
4. **Voting Integrity**: Each address can only vote once per proposal
5. **Execution Safety**: ReentrancyGuard protects against attacks

## Common Use Cases

### 1. Treasury Management
Campaign stakeholders vote on how to spend campaign funds.

### 2. Parameter Updates
Token holders can vote to change governance rules.

### 3. Strategic Decisions
Vote on partnerships, marketing campaigns, roadmap items.

### 4. Token Burns
Propose burning tokens from treasury for deflationary mechanics.

### 5. Rewards Distribution
Vote on distributing rewards to contributors.

## Troubleshooting

**"Insufficient tokens to create proposal"**
- User needs to hold minimum threshold tokens
- Default is 100 tokens (18 decimals)

**"Proposal does not exist"**
- Check proposal ID is correct
- proposalCount() shows total proposals created

**"Already voted"**
- Each address can only vote once per proposal
- Use different wallet to vote

**"Voting ended"**
- Voting period expired (default 3 days)
- Can still execute if passed

**"Proposal did not pass"**
- Check if quorum was reached (default 10% participation)
- Check if majority was reached (default 50% approval)

## Next Steps

1. ✅ Deploy DAO Factory
2. ✅ Integrate DAO creation into campaign flow
3. ⏳ Build frontend for proposals and voting
4. ⏳ Add DAO dashboard to campaign pages
5. ⏳ Set up event listeners for proposal updates
6. ⏳ Create admin panel for DAO management

## Support & Documentation

- Full documentation: [DAO_README.md](DAO_README.md)
- Example script: [scripts/campaignDaoInteraction.ts](../scripts/campaignDaoInteraction.ts)
- Deployment: [deploy/02_deploy_campaign_dao.ts](../deploy/02_deploy_campaign_dao.ts)

---

**Questions or issues?** Check the comprehensive [DAO_README.md](DAO_README.md) for detailed usage examples and troubleshooting.
---

# Part 4: Voting System Explained

## Overview - Snapshot-Based Voting

The Campaign DAO now uses **snapshot-based voting** powered by OpenZeppelin's ERC20Votes extension. This prevents vote manipulation, double voting, and vote buying attacks.

---

## Key Changes

### Before (Balance-Based Voting)
```solidity
// Used current balance at time of vote
uint256 weight = campaignToken.balanceOf(msg.sender);
```

**Problems:**
- ❌ Vote buying: Can buy tokens after proposal starts
- ❌ Double counting: Can vote, transfer tokens, then vote again with another wallet
- ❌ Manipulation: Token supply can change during voting

### After (Snapshot-Based Voting)
```solidity
// Uses balance at proposal creation time
uint256 weight = campaignTokenVotes.getPastVotes(msg.sender, proposal.startTime - 1);
```

**Benefits:**
- ✅ No vote buying: Tokens must be held before proposal starts
- ✅ No double counting: Transferring tokens after voting doesn't help
- ✅ Fair voting: Everyone's power is locked in at proposal creation
- ✅ Historical queries: Can check voting power at any past point

---

## How It Works

### 1. Token Delegation (Required!)

**IMPORTANT:** You must delegate your tokens before you can vote or create proposals.

```javascript
// Delegate to yourself (most common)
await token.connect(user).delegate(user.address);

// Or delegate to someone else
await token.connect(user).delegate(delegateAddress);
```

**Why delegation is required:**
- ERC20Votes tracks "voting power" separately from token balance
- Delegation activates your voting power
- You can delegate to yourself or another address
- Delegation creates a checkpoint in the blockchain history

### 2. Checkpoints System

ERC20Votes creates **checkpoints** whenever:
- Tokens are minted
- Tokens are transferred
- Delegation changes

**Checkpoint Structure:**
```solidity
struct Checkpoint {
    uint32 fromBlock;    // Block number
    uint224 votes;       // Voting power at that block
}
```

**Example:**
```javascript
// Block 100: Alice receives 1000 tokens and delegates to self
// Checkpoint created: { block: 100, votes: 1000 }

// Block 150: Alice receives 500 more tokens
// Checkpoint created: { block: 150, votes: 1500 }

// Block 200: Alice transfers 300 tokens to Bob
// Checkpoint created: { block: 200, votes: 1200 }
```

### 3. Historical Queries

You can query voting power at any past block:

```javascript
// Current voting power
const currentPower = await token.getVotes(alice.address);
console.log(currentPower); // 1200

// Voting power at block 150
const pastPower = await token.getPastVotes(alice.address, 150);
console.log(pastPower); // 1500

// Voting power at block 100
const earlierPower = await token.getPastVotes(alice.address, 100);
console.log(earlierPower); // 1000
```

---

## Double Voting Prevention

### Mechanism 1: Boolean Mapping (Per Address)

```solidity
mapping(uint256 => mapping(address => bool)) public hasVoted;

require(!hasVoted[proposalId][msg.sender], "Already voted");
hasVoted[proposalId][msg.sender] = true;
```

**Prevents:**
- Same address voting twice on same proposal

### Mechanism 2: Snapshot (Per Token)

```solidity
uint256 weight = campaignTokenVotes.getPastVotes(msg.sender, proposal.startTime - 1);
```

**Prevents:**
- Vote buying (can't buy tokens after proposal starts)
- Token transfer manipulation (transferring doesn't change past votes)
- Double counting same tokens

### Combined Protection

**Scenario 1: Alice tries to vote twice**
```javascript
// Alice votes FOR
await dao.connect(alice).castVote(1, VoteType.For);
// ✅ Success: hasVoted[1][alice] = true

// Alice tries again
await dao.connect(alice).castVote(1, VoteType.Against);
// ❌ FAILS: "Already voted"
```

**Scenario 2: Alice tries to transfer and vote again**
```javascript
// Proposal #1 created at block 1000
// Alice has 1000 tokens, delegated

// Alice votes FOR (using 1000 votes from block 1000)
await dao.connect(alice).castVote(1, VoteType.For);
// forVotes += 1000

// Alice transfers all tokens to Bob
await token.connect(alice).transfer(bob.address, parseEther("1000"));

// Bob tries to vote (he didn't have tokens at block 1000)
await dao.connect(bob).castVote(1, VoteType.For);
// ❌ FAILS: "No voting power" (getPastVotes returns 0)

// Alice can't vote again
await dao.connect(alice).castVote(1, VoteType.Against);
// ❌ FAILS: "Already voted"
```

---

## Token Weight Voting Explained

### What is Token-Weighted Voting?

**Voting Power = Delegated Token Balance**

- If Alice has 1000 tokens (delegated), her vote = 1000 votes
- If Bob has 500 tokens (delegated), his vote = 500 votes
- If Carol has 100 tokens (NOT delegated), her vote = 0 votes (can't vote!)

### Example Voting Scenario

**Setup:**
```javascript
Total Supply: 10,000 tokens
Quorum: 10% (1,000 tokens must participate)
Majority: 50% (need more FOR than AGAINST)

Token Distribution:
- Alice: 4,000 tokens (40%) - delegated
- Bob: 3,000 tokens (30%) - delegated
- Carol: 2,000 tokens (20%) - delegated
- Dave: 1,000 tokens (10%) - NOT delegated (can't vote!)
```

**Proposal #1 Created at Block 1000**
```javascript
// Proposal: "Transfer 5 ETH for marketing"
const proposal = {
  id: 1,
  startTime: block 1000,
  endTime: block 1000 + 3 days,
  snapshotSupply: 10,000 tokens
};
```

**Voting:**
```javascript
// Block 1050: Alice votes FOR
await dao.connect(alice).castVote(1, VoteType.For);
// Uses getPastVotes(alice, 1000) = 4,000
// forVotes = 4,000

// Block 1100: Bob votes FOR
await dao.connect(bob).castVote(1, VoteType.For);
// Uses getPastVotes(bob, 1000) = 3,000
// forVotes = 7,000

// Block 1150: Carol votes AGAINST
await dao.connect(carol).castVote(1, VoteType.Against);
// Uses getPastVotes(carol, 1000) = 2,000
// againstVotes = 2,000

// Dave can't vote (didn't delegate)
await dao.connect(dave).castVote(1, VoteType.For);
// ❌ FAILS: "No voting power" (getVotes returns 0)
```

**Results After Voting Period:**
```javascript
Total Votes: 7,000 + 2,000 = 9,000 tokens
Participation: 9,000 / 10,000 = 90% ✅ (above 10% quorum)

Decisive Votes: 7,000 + 2,000 = 9,000
FOR Percentage: 7,000 / 9,000 = 77.78% ✅ (above 50% majority)

Result: SUCCEEDED ✅
```

---

## Integration Guide

### Step 1: Token Holders Must Delegate

**In your frontend:**
```javascript
// Check if user has delegated
const delegatee = await token.delegates(userAddress);

if (delegatee === ethers.ZeroAddress) {
  // User hasn't delegated - show delegation UI
  alert("You must delegate your voting power before voting!");

  // Delegate to self
  await token.connect(user).delegate(user.address);
}
```

**In your campaign creation flow:**
```javascript
// After distributing tokens to investors
for (const investor of investors) {
  await token.transfer(investor.address, investor.amount);

  // Optionally auto-delegate for them (if they approve)
  // await token.connect(investor).delegate(investor.address);
}
```

### Step 2: Display Voting Power

```javascript
// Show current voting power
const votingPower = await dao.getVotingPower(userAddress);
console.log("Your voting power:", ethers.formatEther(votingPower));

// Show token balance vs voting power
const tokenBalance = await token.balanceOf(userAddress);
const votingPower = await token.getVotes(userAddress);

if (votingPower === 0 && tokenBalance > 0) {
  console.log("⚠️ You have tokens but no voting power. Please delegate!");
}
```

### Step 3: Check Delegation Status

```javascript
// Get who user has delegated to
const delegatee = await token.delegates(userAddress);

if (delegatee === userAddress) {
  console.log("✅ Delegated to self");
} else if (delegatee === ethers.ZeroAddress) {
  console.log("❌ Not delegated");
} else {
  console.log("✅ Delegated to:", delegatee);
}
```

### Step 4: Proposal Creation Check

```javascript
// Check if user can create proposal
const votingPower = await dao.getVotingPower(userAddress);
const threshold = await dao.proposalThreshold();

if (votingPower >= threshold) {
  // Show "Create Proposal" button
} else {
  // Show message: "Need X more tokens to create proposal"
  const needed = threshold - votingPower;
  console.log(`Need ${ethers.formatEther(needed)} more voting power`);
}
```

---

## Common Questions

### Q: Why can't I vote even though I have tokens?

**A:** You need to delegate your tokens first!

```javascript
// Delegate to yourself
await token.delegate(yourAddress);
```

### Q: Can I change my delegation?

**A:** Yes! You can change delegation at any time.

```javascript
// Delegate to someone else
await token.delegate(newDelegatee);

// Delegate back to yourself
await token.delegate(yourAddress);
```

**Note:** Changing delegation creates a new checkpoint. Past proposals still use your old voting power.

### Q: What happens if I delegate to someone else?

**A:** Your voting power transfers to them.

```javascript
// Alice has 1000 tokens
await token.connect(alice).delegate(bob.address);

// Now Bob has Alice's voting power
const bobPower = await token.getVotes(bob.address);
// bobPower = Bob's tokens + Alice's tokens

// Alice has no voting power
const alicePower = await token.getVotes(alice.address);
// alicePower = 0
```

### Q: Can I vote if I buy tokens after a proposal starts?

**A:** No! Your voting power is snapshot at proposal creation.

```javascript
// Proposal created at block 1000
// You have 0 tokens

// You buy 1000 tokens at block 1050
await token.transfer(you, parseEther("1000"));
await token.delegate(you);

// Try to vote
await dao.castVote(1, VoteType.For);
// ❌ FAILS: "No voting power"
// (getPastVotes at block 1000 returns 0)
```

### Q: What if I transfer my tokens after voting?

**A:** Your vote still counts! Transferring tokens doesn't change past votes.

```javascript
// You voted with 1000 tokens
await dao.castVote(1, VoteType.For);
// forVotes += 1000

// Transfer all tokens away
await token.transfer(someoneElse, parseEther("1000"));

// Your vote still counts as 1000
// (snapshot was taken at proposal start)
```

---

## Security Benefits

### 1. No Vote Buying
- Can't buy tokens after proposal starts to influence vote
- Must hold tokens before proposal creation

### 2. No Double Counting
- Transferring tokens doesn't let you vote twice
- Each token counted once per proposal

### 3. Sybil Resistance
- Creating multiple wallets doesn't help
- Voting power tied to token holdings at snapshot time

### 4. Fair Governance
- Everyone locked in at same time
- No last-minute manipulation

### 5. Historical Auditing
- Can verify voting power at any past time
- Transparent and verifiable

---

## API Reference

### Token (ERC20Votes) Functions

```solidity
// Delegate voting power
function delegate(address delegatee) external

// Get current voting power
function getVotes(address account) external view returns (uint256)

// Get voting power at past block
function getPastVotes(address account, uint256 blockNumber) external view returns (uint256)

// Get who you've delegated to
function delegates(address account) external view returns (address)

// Get total supply at past block
function getPastTotalSupply(uint256 blockNumber) external view returns (uint256)
```

### DAO Functions

```solidity
// Get current voting power (must be delegated)
function getVotingPower(address _voter) external view returns (uint256)

// Get past voting power
function getPastVotingPower(address _voter, uint256 _timestamp) external view returns (uint256)

// Create proposal (requires delegated voting power)
function createProposal(...) external returns (uint256)

// Vote on proposal (uses snapshot power)
function castVote(uint256 _proposalId, VoteType _voteType) external
```

---

## Summary

### What Changed
✅ TokenFacet now extends ERC20Votes
✅ CampaignDAO uses getPastVotes for snapshot voting
✅ Delegation required before voting
✅ Historical voting power queries available

### Benefits
✅ No vote buying or manipulation
✅ No double counting
✅ Fair and transparent governance
✅ Standard DAO implementation

### Requirements
⚠️ **Users must delegate tokens before voting**
⚠️ Delegation can be to self or others
⚠️ Checkpoints are created on transfers/delegation
⚠️ Past voting power is immutable

### Best Practices
1. Auto-delegate when distributing tokens (with user consent)
2. Show delegation status in UI
3. Explain delegation to users clearly
4. Display both token balance and voting power
5. Warn users if they can't vote due to no delegation

---

**The system is now production-ready with industry-standard snapshot-based voting!** 🎉
