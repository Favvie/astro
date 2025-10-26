# Astro - Decentralized Campaign Fundraising & DAO Platform

A full-stack decentralized application (DApp) for campaign-based fundraising with integrated DAO governance on the Hedera blockchain. Built with modern Web3 technologies and optimized for seamless user experience.

## Overview

Astro is a comprehensive platform that enables users to:
- **Create Token-Based Campaigns**: Launch fundraising campaigns with custom governance tokens
- **Trade via Bonding Curves**: Dynamic pricing model ensures fair token distribution
- **Participate in DAO Governance**: Vote on proposals within per-campaign DAOs
- **Track Campaign Activity**: Real-time event indexing and transaction history

## Key Features

✨ **Campaign Management**
- Create and manage fundraising campaigns
- Token creation with automatic governance setup
- Progress tracking and fundraising analytics

🗳️ **DAO Governance**
- Per-campaign autonomous organizations
- Token-weighted voting system
- Proposal creation and execution
- 3-day voting periods with configurable thresholds

💱 **Bonding Curve Trading**
- Bancor-based dynamic pricing
- Automatic token pricing based on supply
- Seamless USDC integration

📊 **Event Indexing & Analytics**
- Real-time event monitoring via Envio
- GraphQL API for data queries
- Transaction history and activity tracking

🔗 **Hedera Blockchain Integration**
- Built on Hedera Testnet for efficiency
- Off-chain voting support via Hedera Topics
- File management through Hedera File Service

## Smart Contract Addresses (Hedera Testnet)

| Contract | Address |
|----------|---------|
| **LaunchpadV2** (Primary) | `0x928889FCfECEEE99eCd0D16176140D4714035D67` |
| Launchpad (v1) | `0xCEadd06AE587CaD6eF922F91F18f26EB42180Bbb` |
| CampaignDAOFactory | `0xb93719930F8f7a81ceF2B7D2B0717A5189993619` |
| USDC (Test Token) | `0x82254d0f8C5091E79a5433f87ca7354a88FB1292` |
| Faucet | `0x4964FE2EACAB0202Ae0953d80e33c09d0CA4DbeD` |
| AstrodexRouter | `0x14FCa1B39e7eBdBF34519004307a86548eCE08D0` |
| AstrodexFactory | `0x061a4E295612b5a60E3A05eF883f74654bb2749D` |

**Network Details:**
- Network: Hedera Testnet
- Chain ID: 296
- RPC: https://testnet.hashio.io/api

## Project Structure

```
astro/
├── packages/
│   ├── hardhat/                          # Smart contracts & deployment
│   │   ├── contracts/
│   │   │   ├── Launchpad.sol             # Core fundraising contract
│   │   │   ├── LaunchpadV2.sol           # Enhanced version with events
│   │   │   ├── CampaignDAO.sol           # Governance for campaigns
│   │   │   ├── CampaignDAOFactory.sol    # DAO creation factory
│   │   │   ├── Token.sol                 # Campaign token (ERC20)
│   │   │   ├── USDC.sol                  # Test USDC token
│   │   │   ├── Faucet.sol                # Token distribution faucet
│   │   │   └── libraries/                # Core math & Uniswap interfaces
│   │   ├── scripts/
│   │   │   ├── deployLaunchpadV2.ts      # Main deployment script
│   │   │   ├── deployCampaignDAOFactory.ts
│   │   │   └── ...                       # Other utility scripts
│   │   ├── hardhat.config.ts
│   │   └── package.json
│   │
│   ├── nextjs/                           # Frontend application
│   │   ├── app/
│   │   │   ├── page.tsx                  # Landing page
│   │   │   ├── dashboard/                # Main dashboard
│   │   │   │   ├── explore/              # Campaign explorer
│   │   │   │   └── campaign/[id]/        # Campaign details
│   │   │   │       └── _components/
│   │   │   │           └── _tabs/        # Overview, Activity, DAO tabs
│   │   │   ├── blockexplorer/            # Block explorer interface
│   │   │   ├── debug/                    # Contract debugging tools
│   │   │   └── api/                      # Backend API routes
│   │   ├── components/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── HeroContent.tsx
│   │   │   ├── dashboard-content.tsx
│   │   │   ├── create-campaign-drawer.tsx
│   │   │   └── ...                       # UI components
│   │   ├── hooks/
│   │   │   ├── envioDataQueries/         # GraphQL data hooks
│   │   │   │   ├── useAllCampaigns.ts
│   │   │   │   ├── useCampaignsByCreator.ts
│   │   │   │   ├── useSwapEventsByCampaign.ts
│   │   │   │   └── useLiquidityEventsByCampaign.ts
│   │   │   └── scaffold-eth/             # Web3 integration hooks
│   │   ├── scaffold.config.ts            # Configuration
│   │   └── package.json
│   │
│   └── envio/                            # Event indexing & GraphQL API
│       ├── config.yaml                   # Contract configuration
│       ├── src/
│       │   ├── EventHandlers.ts          # Event processing logic
│       │   └── schema.graphql            # GraphQL schema
│       ├── pnpm-lock.yaml
│       └── package.json
│
├── package.json                          # Root workspace config
├── tsconfig.json                         # Root TypeScript config
└── README.md                             # This file
```

## Installation & Setup

### Prerequisites

- **Node.js**: >= 20.18.3
- **Yarn**: >= 3.2.3
- **pnpm**: For Envio package (install via `npm install -g pnpm`)
- **Git**
- **Docker** (optional, for advanced Envio usage)

### Step 1: Clone and Install

```bash
cd /Users/favourabangwu/Documents/astro
yarn install
```

This installs dependencies for all packages (hardhat, nextjs, envio).

### Step 2: Configure Environment Variables

#### For Frontend (`packages/nextjs/.env.local`)

```env
# Hedera Configuration
NEXT_PUBLIC_HEDERA_NETWORK=testnet
NEXT_PUBLIC_HEDERA_ACCOUNT_ID=0.0.6873064

# Hedera Operator (for file uploads)
HEDERA_OPERATOR_KEY=<your_hedera_operator_key>
HEDERA_OPERATOR_ID=<your_hedera_operator_id>

# Optional: Wallet Connect & Alchemy
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=<your_wallet_connect_id>
NEXT_PUBLIC_ALCHEMY_API_KEY=<your_alchemy_key>
```

#### For Smart Contracts (`packages/hardhat/.env`)

```env
# Optional: Etherscan verification
ETHERSCAN_V2_API_KEY=<your_etherscan_key>

# Deployment key (generated by deployment scripts)
DEPLOYER_PRIVATE_KEY_ENCRYPTED=<encrypted_key>
```

## Running the Project

### Option 1: Local Development (Recommended for Testing)

Open **3 terminal windows** and run in order:

**Terminal 1 - Start Local Blockchain:**
```bash
yarn chain
```
Starts a local Hardhat node at `http://localhost:8545` compatible with Hedera contract ABI.

**Terminal 2 - Deploy Smart Contracts:**
```bash
yarn deploy
```
Deploys all contracts to the local network and saves addresses.

**Terminal 3 - Start Frontend:**
```bash
yarn start
```
Launches Next.js dev server at `http://localhost:3000`.

**Access the App:**
- Frontend: http://localhost:3000
- Block Explorer: http://localhost:3000/blockexplorer
- Debug Page: http://localhost:3000/debug

### Option 2: Connect to Hedera Testnet (Recommended for Live Testing)

No need to run `yarn chain` and `yarn deploy`. The app is pre-configured to connect to Hedera Testnet with existing contracts.

```bash
cd packages/nextjs
yarn dev
```

The frontend will automatically connect to:
- Network: Hedera Testnet
- RPC: https://testnet.hashio.io/api
- Deployed contracts (see addresses above)

### Option 3: Enable Event Indexing (Optional)

For real-time event tracking and GraphQL API:

**Terminal 4 - Start Envio Indexer:**
```bash
cd packages/envio
pnpm dev
```

Access GraphQL playground: http://localhost:8080

**Available GraphQL Queries:**
```graphql
{
  Launchpad_CampaignCreated {
    id
    campaignId
    creator
    tokenName
    targetAmount
  }
  LaunchpadV2_SwapEvent {
    id
    campaignId
    user
    tokenAmount
    usdcAmount
  }
}
```

## Key Workflows

### Creating a Campaign

1. Navigate to Dashboard → Create Campaign
2. Fill in campaign details (name, symbol, target amount, deadline)
3. Set reserve ratio for bonding curve pricing
4. Submit transaction
5. Campaign DAO automatically created
6. Campaign appears in Explorer

### Purchasing Tokens

1. Browse campaigns in Explorer
2. Select a campaign
3. Enter desired USDC amount
4. Confirm purchase
5. Receive tokens at bonding curve price
6. Token balance updates automatically

### DAO Voting

1. Navigate to campaign detail page
2. Go to DAO tab
3. View existing proposals
4. Create new proposal (if holding campaign tokens)
5. Vote with your tokens
6. See live voting results

### Claiming Test USDC

1. Navigate to Dashboard
2. Click Faucet button
3. Claim 30 USDC (24-hour interval per wallet)
4. Use for campaign purchases

## Smart Contract Details

### LaunchpadV2.sol (Primary Fundraising Contract)

**Key Functions:**
```solidity
// Create a new campaign
createCampaign(
  string name,
  string symbol,
  uint128 targetAmount,
  uint64 deadline,
  uint32 reserveRatio
) → campaignId

// Purchase tokens
purchaseTokens(
  uint256 campaignId,
  uint128 usdcAmount
) → tokenAmount

// Add liquidity to exchange
addLiquidity(uint256 campaignId) → liquidity

// Claim refund if campaign fails
claimRefund(uint256 campaignId) → refundAmount

// Complete campaign after deadline
completeFunding(uint256 campaignId)
```

**Events Emitted:**
- `CampaignCreated(campaignId, creator, tokenName)`
- `TokensPurchased(campaignId, user, amount)`
- `SwapEvent(campaignId, user, tokenAmount, usdcAmount)`
- `LiquidityEvent(campaignId, liquidity)`
- `FundingCompleted(campaignId)`
- `RefundClaimed(campaignId, user, amount)`

### CampaignDAO.sol (Governance)

**Key Functions:**
```solidity
// Create proposal
createProposal(string title, string description) → proposalId

// Vote on proposal
vote(uint256 proposalId, uint8 voteType, uint128 votingPower)

// Execute passed proposal
executeProposal(uint256 proposalId)
```

**Proposal States:**
- Pending
- Active (voting period)
- Defeated
- Succeeded
- Executed

**Voting Rules:**
- Duration: 3 days (21,600 blocks)
- Quorum: 10% of token supply
- Majority: 50% of votes
- Vote Types: For, Against, Abstain

## Development Scripts

### Smart Contract Commands

```bash
# Compile contracts
yarn hardhat:compile

# Run tests
yarn hardhat:test

# Deploy to Hedera Testnet
yarn hardhat:run scripts/deployLaunchpadV2.ts --network testnet

# Verify on Etherscan (if supported)
yarn hardhat:verify
```

### Frontend Commands

```bash
# Development server
yarn start  # or: cd packages/nextjs && yarn dev

# Production build
yarn build  # or: yarn build:nextjs

# Type checking
yarn type-check

# Format code
yarn format
```

### Envio Indexing Commands

```bash
cd packages/envio

# Development with hot reload
pnpm dev

# Generate types from schema
pnpm codegen

# Start production indexer
pnpm start

# Run tests
pnpm mocha
```

## Technologies Used

### Blockchain
- **Hedera**: Primary blockchain network
- **Solidity 0.8.28**: Smart contract language
- **OpenZeppelin Contracts v5.4**: Secure standards

### Frontend
- **Next.js 15**: React framework
- **React 19**: UI library
- **TypeScript 5.8**: Type safety
- **Tailwind CSS 4.1**: Styling
- **DaisyUI 5**: Component library
- **Wagmi 2.16**: Web3 hooks
- **Viem 2.34**: Ethereum client
- **RainbowKit 2.2**: Wallet connection
- **Framer Motion**: Animations
- **Zustand**: State management

### Backend/Indexing
- **Envio**: Event indexing
- **GraphQL**: Data querying
- **Hedera SDK 2.75**: Hedera integration

### Development
- **Hardhat**: Smart contract development
- **TypeChain**: ABI type generation
- **Yarn Workspaces**: Monorepo management

## API Endpoints

### GraphQL Endpoints

**Local Development:**
- `http://localhost:8080` (Envio indexer)

**Testnet:**
- Check Envio dashboard for live endpoints

### Sample GraphQL Query

```graphql
query GetCampaigns {
  Launchpad_CampaignCreated(limit: 10) {
    id
    campaignId
    creator
    tokenName
    tokenSymbol
    targetAmount
    deadline
  }
}

query GetCampaignActivity {
  LaunchpadV2_SwapEvent(
    where: { campaignId: { _eq: "1" } }
    limit: 20
  ) {
    id
    campaignId
    user
    tokenAmount
    usdcAmount
    blockNumber
    transactionHash
  }
}
```

## Troubleshooting

### Port Already in Use

If port 3000 or 8545 is already in use:

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Environment Variables Not Loading

1. Ensure `.env.local` is in correct directory
2. Restart development server after changes
3. Check Next.js docs for env loading order

### Contract Deployment Issues

1. Ensure you have sufficient gas/HBAR
2. Check Hedera network status
3. Verify contract addresses in deployed_addresses.md

### GraphQL Queries Returning Empty

1. Ensure Envio is running: `pnpm dev` in envio folder
2. Check contract addresses in config.yaml match deployed contracts
3. Verify events are being emitted (check transaction receipts)

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -m "Add feature"`
3. Push to branch: `git push origin feature/your-feature`
4. Open a Pull Request

## Project Status

### Recent Updates
- ✅ LaunchpadV2 enhancement with improved event tracking
- ✅ CampaignDAOFactory for automated governance setup
- ✅ Envio indexing configuration for 4 smart contracts
- ✅ Frontend dashboard with campaign management
- ✅ DAO governance UI with voting interface
- ⏳ Enhanced liquidity management features (in progress)

### Next Steps
- Performance optimization for large campaign lists
- Advanced proposal features
- Additional governance mechanisms
- Mobile-responsive improvements
- Mainnet deployment preparation

## License

This project is part of the Scaffold-ETH 2 initiative.

## Support & Documentation

For detailed technical documentation, refer to:
- Smart Contract Documentation: See contract comments
- Frontend Architecture: See [packages/nextjs/README.md](packages/nextjs/README.md)
- Envio Setup: See [packages/envio/README.md](packages/envio/README.md)

## Quick Links

- **Frontend**: http://localhost:3000
- **Block Explorer**: http://localhost:3000/blockexplorer
- **GraphQL API**: http://localhost:8080
- **Hedera Testnet Faucet**: https://testnet.hedera.com/faucet
- **Hedera Explorer**: https://testnet.hashscan.io

---

**Built with love for decentralized fundraising and governance**