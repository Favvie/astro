import { GenericContractsDeclaration } from "~~/utils/scaffold-eth/contract";

/**
 * @example
 * const externalContracts = {
 *   1: {
 *     DAI: {
 *       address: "0x...",
 *       abi: [...],
 *     },
 *   },
 * } as const;
 */
const externalContracts = {
  296: {
    Launchpad: {
      address: "0xCEadd06AE587CaD6eF922F91F18f26EB42180Bbb",
      abi: [
        {
          inputs: [
            {
              internalType: "address",
              name: "_contractOwner",
              type: "address",
            },
            {
              internalType: "address",
              name: "_usdcToken",
              type: "address",
            },
            {
              internalType: "address",
              name: "_uniswapRouter",
              type: "address",
            },
            {
              internalType: "address",
              name: "_uniswapFactory",
              type: "address",
            },
            {
              internalType: "uint128",
              name: "_promotionFee",
              type: "uint128",
            },
          ],
          stateMutability: "nonpayable",
          type: "constructor",
        },
        {
          inputs: [],
          name: "InactiveCampaign",
          type: "error",
        },
        {
          inputs: [],
          name: "InsufficientBalance",
          type: "error",
        },
        {
          inputs: [],
          name: "InvalidInput",
          type: "error",
        },
        {
          inputs: [],
          name: "ReentrancyGuardReentrantCall",
          type: "error",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "token",
              type: "address",
            },
          ],
          name: "SafeERC20FailedOperation",
          type: "error",
        },
        {
          inputs: [],
          name: "Unauthorized",
          type: "error",
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: true,
              internalType: "uint256",
              name: "campaignId",
              type: "uint256",
            },
            {
              indexed: true,
              internalType: "address",
              name: "creator",
              type: "address",
            },
          ],
          name: "CampaignCancelled",
          type: "event",
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: true,
              internalType: "uint256",
              name: "campaignId",
              type: "uint256",
            },
            {
              indexed: true,
              internalType: "address",
              name: "creator",
              type: "address",
            },
            {
              indexed: false,
              internalType: "string",
              name: "name",
              type: "string",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "targetFunding",
              type: "uint256",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "totalSupply",
              type: "uint256",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "deadline",
              type: "uint256",
            },
          ],
          name: "CampaignCreated",
          type: "event",
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: true,
              internalType: "uint256",
              name: "campaignId",
              type: "uint256",
            },
          ],
          name: "CampaignPromoted",
          type: "event",
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: true,
              internalType: "uint256",
              name: "campaignId",
              type: "uint256",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "totalFunding",
              type: "uint256",
            },
          ],
          name: "FundingCompleted",
          type: "event",
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: true,
              internalType: "uint256",
              name: "campaignId",
              type: "uint256",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "usdcAmount",
              type: "uint256",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "tokensAmount",
              type: "uint256",
            },
          ],
          name: "LiquidityAdded",
          type: "event",
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: true,
              internalType: "uint256",
              name: "campaignId",
              type: "uint256",
            },
            {
              indexed: true,
              internalType: "address",
              name: "user",
              type: "address",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "amount",
              type: "uint256",
            },
          ],
          name: "OgPointsAwarded",
          type: "event",
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: false,
              internalType: "uint256",
              name: "newFee",
              type: "uint256",
            },
          ],
          name: "PlatformFeeUpdated",
          type: "event",
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: true,
              internalType: "uint256",
              name: "campaignId",
              type: "uint256",
            },
            {
              indexed: true,
              internalType: "address",
              name: "investor",
              type: "address",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "amount",
              type: "uint256",
            },
          ],
          name: "RefundClaimed",
          type: "event",
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: true,
              internalType: "uint256",
              name: "campaignId",
              type: "uint256",
            },
            {
              indexed: true,
              internalType: "address",
              name: "buyer",
              type: "address",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "usdcAmount",
              type: "uint256",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "tokensReceived",
              type: "uint256",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "timestamp",
              type: "uint256",
            },
          ],
          name: "TokensPurchased",
          type: "event",
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: true,
              internalType: "uint256",
              name: "campaignId",
              type: "uint256",
            },
            {
              indexed: true,
              internalType: "address",
              name: "user",
              type: "address",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "amount",
              type: "uint256",
            },
          ],
          name: "UserParticipatedInCampaign",
          type: "event",
        },
        {
          inputs: [],
          name: "BASIS_POINTS",
          outputs: [
            {
              internalType: "uint16",
              name: "",
              type: "uint16",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "CREATOR_ALLOCATION_PCT",
          outputs: [
            {
              internalType: "uint16",
              name: "",
              type: "uint16",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "LIQUIDITY_ALLOCATION_PCT",
          outputs: [
            {
              internalType: "uint16",
              name: "",
              type: "uint16",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "MAX_DEADLINE",
          outputs: [
            {
              internalType: "uint64",
              name: "",
              type: "uint64",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "MAX_RESERVE_RATIO",
          outputs: [
            {
              internalType: "uint32",
              name: "",
              type: "uint32",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "MAX_TOTAL_SUPPLY",
          outputs: [
            {
              internalType: "uint128",
              name: "",
              type: "uint128",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "MIN_DEADLINE",
          outputs: [
            {
              internalType: "uint64",
              name: "",
              type: "uint64",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "MIN_TOTAL_SUPPLY",
          outputs: [
            {
              internalType: "uint128",
              name: "",
              type: "uint128",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "OG_POINTS_ALLOCATION",
          outputs: [
            {
              internalType: "uint16",
              name: "",
              type: "uint16",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "TOKENS_FOR_SALE_PCT",
          outputs: [
            {
              internalType: "uint16",
              name: "",
              type: "uint16",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "uint32",
              name: "_campaignId",
              type: "uint32",
            },
          ],
          name: "_getCampaignInfo",
          outputs: [
            {
              components: [
                {
                  internalType: "uint32",
                  name: "id",
                  type: "uint32",
                },
                {
                  internalType: "address",
                  name: "creator",
                  type: "address",
                },
                {
                  internalType: "uint128",
                  name: "targetAmount",
                  type: "uint128",
                },
                {
                  internalType: "uint128",
                  name: "amountRaised",
                  type: "uint128",
                },
                {
                  internalType: "uint128",
                  name: "tokensSold",
                  type: "uint128",
                },
                {
                  internalType: "uint128",
                  name: "totalSupply",
                  type: "uint128",
                },
                {
                  internalType: "uint128",
                  name: "tokensForSale",
                  type: "uint128",
                },
                {
                  internalType: "uint128",
                  name: "creatorAllocation",
                  type: "uint128",
                },
                {
                  internalType: "uint128",
                  name: "liquidityAllocation",
                  type: "uint128",
                },
                {
                  internalType: "uint128",
                  name: "platformFeeTokens",
                  type: "uint128",
                },
                {
                  internalType: "uint64",
                  name: "deadline",
                  type: "uint64",
                },
                {
                  internalType: "address",
                  name: "tokenAddress",
                  type: "address",
                },
                {
                  internalType: "bool",
                  name: "isActive",
                  type: "bool",
                },
                {
                  internalType: "bool",
                  name: "isFundingComplete",
                  type: "bool",
                },
                {
                  internalType: "bool",
                  name: "isCancelled",
                  type: "bool",
                },
                {
                  internalType: "string",
                  name: "name",
                  type: "string",
                },
                {
                  internalType: "string",
                  name: "symbol",
                  type: "string",
                },
                {
                  internalType: "string",
                  name: "description",
                  type: "string",
                },
                {
                  internalType: "uint32",
                  name: "reserveRatio",
                  type: "uint32",
                },
                {
                  internalType: "uint32",
                  name: "blockNumberCreated",
                  type: "uint32",
                },
                {
                  internalType: "uint128",
                  name: "promotionalOgPoints",
                  type: "uint128",
                },
                {
                  internalType: "bool",
                  name: "isPromoted",
                  type: "bool",
                },
                {
                  internalType: "address",
                  name: "uniswapPair",
                  type: "address",
                },
                {
                  internalType: "string",
                  name: "iconFileid",
                  type: "string",
                },
                {
                  internalType: "string",
                  name: "whitepaperFileid",
                  type: "string",
                },
              ],
              internalType: "struct Launchpad.CampaignInfo",
              name: "",
              type: "tuple",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "uint32",
              name: "_campaignId",
              type: "uint32",
            },
            {
              internalType: "uint128",
              name: "_usdcAmount",
              type: "uint128",
            },
          ],
          name: "buyTokens",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          inputs: [],
          name: "campaignCount",
          outputs: [
            {
              internalType: "uint32",
              name: "",
              type: "uint32",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          name: "campaigns",
          outputs: [
            {
              internalType: "address",
              name: "creator",
              type: "address",
            },
            {
              internalType: "contract IERC20",
              name: "token",
              type: "address",
            },
            {
              internalType: "address",
              name: "uniswapPair",
              type: "address",
            },
            {
              internalType: "uint128",
              name: "targetAmount",
              type: "uint128",
            },
            {
              internalType: "uint128",
              name: "amountRaised",
              type: "uint128",
            },
            {
              internalType: "uint64",
              name: "deadline",
              type: "uint64",
            },
            {
              internalType: "uint32",
              name: "reserveRatio",
              type: "uint32",
            },
            {
              internalType: "uint32",
              name: "blockNumberCreated",
              type: "uint32",
            },
            {
              internalType: "bool",
              name: "isActive",
              type: "bool",
            },
            {
              internalType: "bool",
              name: "isFundingComplete",
              type: "bool",
            },
            {
              internalType: "bool",
              name: "isCancelled",
              type: "bool",
            },
            {
              internalType: "bool",
              name: "isPromoted",
              type: "bool",
            },
            {
              internalType: "uint128",
              name: "tokensSold",
              type: "uint128",
            },
            {
              internalType: "uint128",
              name: "totalSupply",
              type: "uint128",
            },
            {
              internalType: "uint128",
              name: "tokensForSale",
              type: "uint128",
            },
            {
              internalType: "uint128",
              name: "creatorAllocation",
              type: "uint128",
            },
            {
              internalType: "uint128",
              name: "liquidityAllocation",
              type: "uint128",
            },
            {
              internalType: "uint128",
              name: "platformFeeTokens",
              type: "uint128",
            },
            {
              internalType: "uint128",
              name: "promotionalOgPoints",
              type: "uint128",
            },
            {
              internalType: "uint32",
              name: "id",
              type: "uint32",
            },
            {
              internalType: "string",
              name: "name",
              type: "string",
            },
            {
              internalType: "string",
              name: "symbol",
              type: "string",
            },
            {
              internalType: "string",
              name: "description",
              type: "string",
            },
            {
              internalType: "string",
              name: "iconFileid",
              type: "string",
            },
            {
              internalType: "string",
              name: "whitepaperFileid",
              type: "string",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "uint32",
              name: "_campaignId",
              type: "uint32",
            },
          ],
          name: "cancelCampaign",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "uint32",
              name: "_campaignId",
              type: "uint32",
            },
          ],
          name: "claimRefund",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "string",
              name: "_name",
              type: "string",
            },
            {
              internalType: "string",
              name: "_symbol",
              type: "string",
            },
            {
              internalType: "string",
              name: "_description",
              type: "string",
            },
            {
              internalType: "string",
              name: "_iconFileid",
              type: "string",
            },
            {
              internalType: "string",
              name: "_whitepaperFileid",
              type: "string",
            },
            {
              internalType: "uint128",
              name: "_targetFunding",
              type: "uint128",
            },
            {
              internalType: "uint128",
              name: "_totalSupply",
              type: "uint128",
            },
            {
              internalType: "uint32",
              name: "_reserveRatio",
              type: "uint32",
            },
            {
              internalType: "uint64",
              name: "_deadline",
              type: "uint64",
            },
          ],
          name: "createCampaign",
          outputs: [
            {
              internalType: "uint32",
              name: "campaignId",
              type: "uint32",
            },
          ],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "",
              type: "address",
            },
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          name: "creatorCampaigns",
          outputs: [
            {
              internalType: "uint32",
              name: "",
              type: "uint32",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "uint32",
              name: "_campaignId",
              type: "uint32",
            },
            {
              internalType: "address",
              name: "_user",
              type: "address",
            },
          ],
          name: "getUserInvestment",
          outputs: [
            {
              internalType: "uint128",
              name: "",
              type: "uint128",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "",
              type: "address",
            },
          ],
          name: "ogPoints",
          outputs: [
            {
              internalType: "uint128",
              name: "",
              type: "uint128",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "platformFeePercentage",
          outputs: [
            {
              internalType: "uint16",
              name: "",
              type: "uint16",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "uint32",
              name: "_campaignId",
              type: "uint32",
            },
          ],
          name: "promoteCampaign",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          inputs: [],
          name: "promotionFee",
          outputs: [
            {
              internalType: "uint128",
              name: "",
              type: "uint128",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "totalPlatformFees",
          outputs: [
            {
              internalType: "uint128",
              name: "",
              type: "uint128",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "uniswapFactory",
          outputs: [
            {
              internalType: "contract IUniswapV2Factory",
              name: "",
              type: "address",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "uniswapRouter",
          outputs: [
            {
              internalType: "contract IUniswapV2Router",
              name: "",
              type: "address",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "usdcToken",
          outputs: [
            {
              internalType: "contract IERC20",
              name: "",
              type: "address",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "",
              type: "address",
            },
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          name: "userParticipatedCampaigns",
          outputs: [
            {
              internalType: "uint32",
              name: "",
              type: "uint32",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "",
              type: "address",
            },
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          name: "userParticipation",
          outputs: [
            {
              internalType: "bool",
              name: "",
              type: "bool",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          stateMutability: "payable",
          type: "receive",
        },
      ],
    },
    LaunchpadV2: {
      address: "0x5F9A7Db4c568421a65E4cb6D1ef1457546156531",
      abi: [
        {
          inputs: [
            {
              internalType: "address",
              name: "_parentContract",
              type: "address",
            },
            {
              internalType: "address",
              name: "_usdcToken",
              type: "address",
            },
            {
              internalType: "address",
              name: "_uniswapRouter",
              type: "address",
            },
            {
              internalType: "address",
              name: "_uniswapFactory",
              type: "address",
            },
          ],
          stateMutability: "nonpayable",
          type: "constructor",
        },
        {
          inputs: [],
          name: "AddressZeroDetected",
          type: "error",
        },
        {
          inputs: [],
          name: "CampaignDoesNotExist",
          type: "error",
        },
        {
          inputs: [],
          name: "CampaignInactive",
          type: "error",
        },
        {
          inputs: [],
          name: "DeadlineExpired",
          type: "error",
        },
        {
          inputs: [],
          name: "DeadlineTooShort",
          type: "error",
        },
        {
          inputs: [],
          name: "FundingAlreadyCompleted",
          type: "error",
        },
        {
          inputs: [],
          name: "FundingNotMet",
          type: "error",
        },
        {
          inputs: [],
          name: "InsufficientFunds",
          type: "error",
        },
        {
          inputs: [],
          name: "InvalidInput",
          type: "error",
        },
        {
          inputs: [],
          name: "InvalidInput",
          type: "error",
        },
        {
          inputs: [],
          name: "InvalidParameters",
          type: "error",
        },
        {
          inputs: [],
          name: "InvalidSupply",
          type: "error",
        },
        {
          inputs: [],
          name: "NotCampaignOwner",
          type: "error",
        },
        {
          inputs: [],
          name: "NotEnoughTokens",
          type: "error",
        },
        {
          inputs: [],
          name: "ReentrancyGuardReentrantCall",
          type: "error",
        },
        {
          inputs: [],
          name: "ReserveRatioOutOfBounds",
          type: "error",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "token",
              type: "address",
            },
          ],
          name: "SafeERC20FailedOperation",
          type: "error",
        },
        {
          inputs: [],
          name: "Unauthorized",
          type: "error",
        },
        {
          inputs: [],
          name: "UserCannotClaimRefund",
          type: "error",
        },
        {
          inputs: [],
          name: "ZeroValueNotAllowed",
          type: "error",
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: true,
              internalType: "uint256",
              name: "campaignId",
              type: "uint256",
            },
            {
              indexed: true,
              internalType: "address",
              name: "creator",
              type: "address",
            },
          ],
          name: "CampaignCancelled",
          type: "event",
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: true,
              internalType: "uint256",
              name: "campaignId",
              type: "uint256",
            },
            {
              indexed: true,
              internalType: "address",
              name: "investor",
              type: "address",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "amount",
              type: "uint256",
            },
          ],
          name: "RefundClaimed",
          type: "event",
        },
        {
          inputs: [
            {
              internalType: "uint32",
              name: "_campaignId",
              type: "uint32",
            },
            {
              internalType: "uint256",
              name: "_tokenAmount",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "_usdcAmount",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "_minTokenLiquidity",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "_minUsdcLiquidity",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "_deadline",
              type: "uint256",
            },
          ],
          name: "addLiquidityToPool",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "uint32",
              name: "_offset",
              type: "uint32",
            },
            {
              internalType: "uint32",
              name: "_limit",
              type: "uint32",
            },
          ],
          name: "getAllCampaignsPaginated",
          outputs: [
            {
              components: [
                {
                  internalType: "uint256",
                  name: "id",
                  type: "uint256",
                },
                {
                  internalType: "address",
                  name: "creator",
                  type: "address",
                },
                {
                  internalType: "uint256",
                  name: "targetAmount",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "amountRaised",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "tokensSold",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "totalSupply",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "tokensForSale",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "creatorAllocation",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "liquidityAllocation",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "platformFeeTokens",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "deadline",
                  type: "uint256",
                },
                {
                  internalType: "address",
                  name: "tokenAddress",
                  type: "address",
                },
                {
                  internalType: "bool",
                  name: "isActive",
                  type: "bool",
                },
                {
                  internalType: "bool",
                  name: "isFundingComplete",
                  type: "bool",
                },
                {
                  internalType: "bool",
                  name: "isCancelled",
                  type: "bool",
                },
                {
                  internalType: "string",
                  name: "name",
                  type: "string",
                },
                {
                  internalType: "string",
                  name: "symbol",
                  type: "string",
                },
                {
                  internalType: "string",
                  name: "description",
                  type: "string",
                },
                {
                  internalType: "uint32",
                  name: "reserveRatio",
                  type: "uint32",
                },
                {
                  internalType: "uint256",
                  name: "blockNumberCreated",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "promotionalOgPoints",
                  type: "uint256",
                },
                {
                  internalType: "bool",
                  name: "isPromoted",
                  type: "bool",
                },
                {
                  internalType: "address",
                  name: "uniswapPair",
                  type: "address",
                },
              ],
              internalType: "struct CampaignInfo[]",
              name: "campaignsLocal",
              type: "tuple[]",
            },
            {
              internalType: "uint32",
              name: "total",
              type: "uint32",
            },
            {
              internalType: "bool",
              name: "hasMore",
              type: "bool",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "_creator",
              type: "address",
            },
          ],
          name: "getCampaignsByCreator",
          outputs: [
            {
              components: [
                {
                  internalType: "uint256",
                  name: "id",
                  type: "uint256",
                },
                {
                  internalType: "address",
                  name: "creator",
                  type: "address",
                },
                {
                  internalType: "uint256",
                  name: "targetAmount",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "amountRaised",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "tokensSold",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "totalSupply",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "tokensForSale",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "creatorAllocation",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "liquidityAllocation",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "platformFeeTokens",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "deadline",
                  type: "uint256",
                },
                {
                  internalType: "address",
                  name: "tokenAddress",
                  type: "address",
                },
                {
                  internalType: "bool",
                  name: "isActive",
                  type: "bool",
                },
                {
                  internalType: "bool",
                  name: "isFundingComplete",
                  type: "bool",
                },
                {
                  internalType: "bool",
                  name: "isCancelled",
                  type: "bool",
                },
                {
                  internalType: "string",
                  name: "name",
                  type: "string",
                },
                {
                  internalType: "string",
                  name: "symbol",
                  type: "string",
                },
                {
                  internalType: "string",
                  name: "description",
                  type: "string",
                },
                {
                  internalType: "uint32",
                  name: "reserveRatio",
                  type: "uint32",
                },
                {
                  internalType: "uint256",
                  name: "blockNumberCreated",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "promotionalOgPoints",
                  type: "uint256",
                },
                {
                  internalType: "bool",
                  name: "isPromoted",
                  type: "bool",
                },
                {
                  internalType: "address",
                  name: "uniswapPair",
                  type: "address",
                },
              ],
              internalType: "struct CampaignInfo[]",
              name: "",
              type: "tuple[]",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "getSummaryStats",
          outputs: [
            {
              internalType: "uint256",
              name: "totalCampaigns",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "activeCampaigns",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "completedCampaigns",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "cancelledCampaigns",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "expiredCampaigns",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "totalFundingRaised",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "uint32",
              name: "_campaignId",
              type: "uint32",
            },
            {
              internalType: "uint256",
              name: "_tokenAmountIn",
              type: "uint256",
            },
          ],
          name: "getSwapAmountOut",
          outputs: [
            {
              internalType: "uint256",
              name: "expectedUsdcOut",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "uint32",
              name: "_campaignId",
              type: "uint32",
            },
            {
              internalType: "uint256",
              name: "_usdcAmountIn",
              type: "uint256",
            },
          ],
          name: "getTokenAmountOut",
          outputs: [
            {
              internalType: "uint256",
              name: "expectedTokenOut",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "_user",
              type: "address",
            },
          ],
          name: "getUserParticipatedCampaignsWithInvestmentCheck",
          outputs: [
            {
              components: [
                {
                  internalType: "uint256",
                  name: "id",
                  type: "uint256",
                },
                {
                  internalType: "address",
                  name: "creator",
                  type: "address",
                },
                {
                  internalType: "uint256",
                  name: "targetAmount",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "amountRaised",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "tokensSold",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "totalSupply",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "tokensForSale",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "creatorAllocation",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "liquidityAllocation",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "platformFeeTokens",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "deadline",
                  type: "uint256",
                },
                {
                  internalType: "address",
                  name: "tokenAddress",
                  type: "address",
                },
                {
                  internalType: "bool",
                  name: "isActive",
                  type: "bool",
                },
                {
                  internalType: "bool",
                  name: "isFundingComplete",
                  type: "bool",
                },
                {
                  internalType: "bool",
                  name: "isCancelled",
                  type: "bool",
                },
                {
                  internalType: "string",
                  name: "name",
                  type: "string",
                },
                {
                  internalType: "string",
                  name: "symbol",
                  type: "string",
                },
                {
                  internalType: "string",
                  name: "description",
                  type: "string",
                },
                {
                  internalType: "uint32",
                  name: "reserveRatio",
                  type: "uint32",
                },
                {
                  internalType: "uint256",
                  name: "blockNumberCreated",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "promotionalOgPoints",
                  type: "uint256",
                },
                {
                  internalType: "bool",
                  name: "isPromoted",
                  type: "bool",
                },
                {
                  internalType: "address",
                  name: "uniswapPair",
                  type: "address",
                },
              ],
              internalType: "struct CampaignInfo[]",
              name: "",
              type: "tuple[]",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "_user",
              type: "address",
            },
          ],
          name: "getUserTotalInvestment",
          outputs: [
            {
              internalType: "uint256",
              name: "totalInvestment",
              type: "uint256",
            },
            {
              internalType: "uint32",
              name: "campaignsParticipated",
              type: "uint32",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "uint32",
              name: "_campaignId",
              type: "uint32",
            },
            {
              internalType: "uint256",
              name: "_usdcAmount",
              type: "uint256",
            },
          ],
          name: "previewPurchase",
          outputs: [
            {
              internalType: "uint256",
              name: "tokensReceived",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "uint32",
              name: "_campaignId",
              type: "uint32",
            },
            {
              internalType: "uint256",
              name: "_tokenAmount",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "_minUsdcOut",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "_deadline",
              type: "uint256",
            },
          ],
          name: "swapTokenForUsdc",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "uint32",
              name: "_campaignId",
              type: "uint32",
            },
            {
              internalType: "uint256",
              name: "_usdcAmount",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "_minTokenOut",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "_deadline",
              type: "uint256",
            },
          ],
          name: "swapUsdcForToken",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          inputs: [],
          name: "uniswapFactory",
          outputs: [
            {
              internalType: "contract IUniswapV2Factory",
              name: "",
              type: "address",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "uniswapRouter",
          outputs: [
            {
              internalType: "contract IUniswapV2Router",
              name: "",
              type: "address",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "usdcToken",
          outputs: [
            {
              internalType: "contract IERC20",
              name: "",
              type: "address",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
      ],
    },
    Faucet: {
      address: "0x4964FE2EACAB0202Ae0953d80e33c09d0CA4DbeD",

      abi: [
        {
          inputs: [
            {
              internalType: "address",
              name: "_usdcTokenAddress",
              type: "address",
            },
          ],
          stateMutability: "nonpayable",
          type: "constructor",
        },
        {
          inputs: [
            {
              internalType: "uint256",
              name: "timeRemaining",
              type: "uint256",
            },
          ],
          name: "ClaimTooSoon",
          type: "error",
        },
        {
          inputs: [
            {
              internalType: "uint256",
              name: "faucetBalance",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "requestedAmount",
              type: "uint256",
            },
          ],
          name: "InsufficientFaucetBalance",
          type: "error",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "token",
              type: "address",
            },
          ],
          name: "SafeERC20FailedOperation",
          type: "error",
        },
        {
          inputs: [],
          name: "ZeroAddress",
          type: "error",
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: true,
              internalType: "address",
              name: "user",
              type: "address",
            },
          ],
          name: "TokensClaimed",
          type: "event",
        },
        {
          inputs: [],
          name: "CLAIM_INTERVAL",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "_to",
              type: "address",
            },
          ],
          name: "drip",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "_user",
              type: "address",
            },
          ],
          name: "getNextClaimTime",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "",
              type: "address",
            },
          ],
          name: "lastClaimTime",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "usdcClaimAmount",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "usdcToken",
          outputs: [
            {
              internalType: "contract IERC20",
              name: "",
              type: "address",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "_to",
              type: "address",
            },
            {
              internalType: "address",
              name: "_token",
              type: "address",
            },
          ],
          name: "withdrawRemainingTokens",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
      ],
    },
    USDC: {
      address: "0x82254d0f8C5091E79a5433f87ca7354a88FB1292",
      abi: [
        {
          inputs: [],
          stateMutability: "nonpayable",
          type: "constructor",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "spender",
              type: "address",
            },
            {
              internalType: "uint256",
              name: "allowance",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "needed",
              type: "uint256",
            },
          ],
          name: "ERC20InsufficientAllowance",
          type: "error",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "sender",
              type: "address",
            },
            {
              internalType: "uint256",
              name: "balance",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "needed",
              type: "uint256",
            },
          ],
          name: "ERC20InsufficientBalance",
          type: "error",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "approver",
              type: "address",
            },
          ],
          name: "ERC20InvalidApprover",
          type: "error",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "receiver",
              type: "address",
            },
          ],
          name: "ERC20InvalidReceiver",
          type: "error",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "sender",
              type: "address",
            },
          ],
          name: "ERC20InvalidSender",
          type: "error",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "spender",
              type: "address",
            },
          ],
          name: "ERC20InvalidSpender",
          type: "error",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "owner",
              type: "address",
            },
          ],
          name: "OwnableInvalidOwner",
          type: "error",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "account",
              type: "address",
            },
          ],
          name: "OwnableUnauthorizedAccount",
          type: "error",
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: true,
              internalType: "address",
              name: "owner",
              type: "address",
            },
            {
              indexed: true,
              internalType: "address",
              name: "spender",
              type: "address",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "value",
              type: "uint256",
            },
          ],
          name: "Approval",
          type: "event",
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: true,
              internalType: "address",
              name: "previousOwner",
              type: "address",
            },
            {
              indexed: true,
              internalType: "address",
              name: "newOwner",
              type: "address",
            },
          ],
          name: "OwnershipTransferred",
          type: "event",
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: true,
              internalType: "address",
              name: "from",
              type: "address",
            },
            {
              indexed: true,
              internalType: "address",
              name: "to",
              type: "address",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "value",
              type: "uint256",
            },
          ],
          name: "Transfer",
          type: "event",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "owner",
              type: "address",
            },
            {
              internalType: "address",
              name: "spender",
              type: "address",
            },
          ],
          name: "allowance",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "spender",
              type: "address",
            },
            {
              internalType: "uint256",
              name: "value",
              type: "uint256",
            },
          ],
          name: "approve",
          outputs: [
            {
              internalType: "bool",
              name: "",
              type: "bool",
            },
          ],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "account",
              type: "address",
            },
          ],
          name: "balanceOf",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "decimals",
          outputs: [
            {
              internalType: "uint8",
              name: "",
              type: "uint8",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "to",
              type: "address",
            },
            {
              internalType: "uint256",
              name: "amount",
              type: "uint256",
            },
          ],
          name: "mint",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          inputs: [],
          name: "name",
          outputs: [
            {
              internalType: "string",
              name: "",
              type: "string",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "owner",
          outputs: [
            {
              internalType: "address",
              name: "",
              type: "address",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "renounceOwnership",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          inputs: [],
          name: "symbol",
          outputs: [
            {
              internalType: "string",
              name: "",
              type: "string",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "totalSupply",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "to",
              type: "address",
            },
            {
              internalType: "uint256",
              name: "value",
              type: "uint256",
            },
          ],
          name: "transfer",
          outputs: [
            {
              internalType: "bool",
              name: "",
              type: "bool",
            },
          ],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "from",
              type: "address",
            },
            {
              internalType: "address",
              name: "to",
              type: "address",
            },
            {
              internalType: "uint256",
              name: "value",
              type: "uint256",
            },
          ],
          name: "transferFrom",
          outputs: [
            {
              internalType: "bool",
              name: "",
              type: "bool",
            },
          ],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "newOwner",
              type: "address",
            },
          ],
          name: "transferOwnership",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
      ],
    },
    CampaignDAOFactory: {
      address: "0xb93719930F8f7a81ceF2B7D2B0717A5189993619",
      abi: [
        {
          inputs: [],
          stateMutability: "nonpayable",
          type: "constructor",
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: true,
              internalType: "uint256",
              name: "campaignId",
              type: "uint256",
            },
            {
              indexed: true,
              internalType: "address",
              name: "campaignToken",
              type: "address",
            },
            {
              indexed: true,
              internalType: "address",
              name: "daoAddress",
              type: "address",
            },
            {
              indexed: false,
              internalType: "address",
              name: "creator",
              type: "address",
            },
          ],
          name: "CampaignDAOCreated",
          type: "event",
        },
        {
          inputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          name: "allDAOs",
          outputs: [
            {
              internalType: "address",
              name: "",
              type: "address",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          name: "campaignDAOs",
          outputs: [
            {
              internalType: "address",
              name: "",
              type: "address",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "_campaignToken",
              type: "address",
            },
            {
              internalType: "uint256",
              name: "_campaignId",
              type: "uint256",
            },
            {
              internalType: "string",
              name: "_hederaTopicId",
              type: "string",
            },
            {
              internalType: "address",
              name: "_campaignCreator",
              type: "address",
            },
            {
              internalType: "bool",
              name: "_isDAOEnabled",
              type: "bool",
            },
          ],
          name: "createCampaignDAO",
          outputs: [
            {
              internalType: "address",
              name: "",
              type: "address",
            },
          ],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "_campaignToken",
              type: "address",
            },
            {
              internalType: "uint256",
              name: "_campaignId",
              type: "uint256",
            },
            {
              internalType: "string",
              name: "_hederaTopicId",
              type: "string",
            },
            {
              internalType: "address",
              name: "_campaignCreator",
              type: "address",
            },
            {
              internalType: "bool",
              name: "_isDAOEnabled",
              type: "bool",
            },
            {
              internalType: "uint256",
              name: "_proposalThreshold",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "_votingPeriod",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "_quorumPercentage",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "_majorityPercentage",
              type: "uint256",
            },
          ],
          name: "createCampaignDAOWithCustomParams",
          outputs: [
            {
              internalType: "address",
              name: "",
              type: "address",
            },
          ],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "uint256",
              name: "_campaignId",
              type: "uint256",
            },
          ],
          name: "daoExists",
          outputs: [
            {
              internalType: "bool",
              name: "",
              type: "bool",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "defaultParameters",
          outputs: [
            {
              internalType: "uint256",
              name: "proposalThreshold",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "votingPeriod",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "quorumPercentage",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "majorityPercentage",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "getAllDAOs",
          outputs: [
            {
              internalType: "address[]",
              name: "",
              type: "address[]",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "uint256",
              name: "_campaignId",
              type: "uint256",
            },
          ],
          name: "getDAOByCampaign",
          outputs: [
            {
              internalType: "address",
              name: "",
              type: "address",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "_tokenAddress",
              type: "address",
            },
          ],
          name: "getDAOByToken",
          outputs: [
            {
              internalType: "address",
              name: "",
              type: "address",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "getTotalDAOs",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          name: "hederaTopicIds",
          outputs: [
            {
              internalType: "string",
              name: "",
              type: "string",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "",
              type: "address",
            },
          ],
          name: "tokenToDAO",
          outputs: [
            {
              internalType: "address",
              name: "",
              type: "address",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "uint256",
              name: "_proposalThreshold",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "_votingPeriod",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "_quorumPercentage",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "_majorityPercentage",
              type: "uint256",
            },
          ],
          name: "updateDefaultParameters",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
      ],
    },
  },
} as const;

export default externalContracts satisfies GenericContractsDeclaration;
