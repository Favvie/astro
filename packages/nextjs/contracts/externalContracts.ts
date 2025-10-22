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
            { internalType: "string", name: "_name", type: "string" },
            { internalType: "string", name: "_symbol", type: "string" },
            { internalType: "string", name: "_description", type: "string" },
            { internalType: "string", name: "_iconFileid", type: "string" },
            { internalType: "string", name: "_whitepaperFileid", type: "string" },
            { internalType: "uint128", name: "_targetFunding", type: "uint128" },
            { internalType: "uint128", name: "_totalSupply", type: "uint128" },
            { internalType: "uint32", name: "_reserveRatio", type: "uint32" },
            { internalType: "uint64", name: "_deadline", type: "uint64" },
          ],
          name: "createCampaign",
          outputs: [{ internalType: "uint32", name: "campaignId", type: "uint32" }],
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
      ],
    },
    LaunchpadV2: {
      address: "0x5F9A7Db4c568421a65E4cb6D1ef1457546156531",
      abi: [
        {
          inputs: [{ internalType: "address", name: "user", type: "address" }],
          name: "getUserParticipatedCampaignsWithInvestmentCheck",
          outputs: [
            {
              components: [
                { internalType: "uint256", name: "id", type: "uint256" },
                { internalType: "address", name: "creator", type: "address" },
                { internalType: "uint128", name: "targetAmount", type: "uint128" },
                { internalType: "uint128", name: "amountRaised", type: "uint128" },
                { internalType: "uint256", name: "tokensSold", type: "uint256" },
                { internalType: "uint256", name: "totalSupply", type: "uint256" },
                { internalType: "uint256", name: "tokensForSale", type: "uint256" },
                { internalType: "uint256", name: "creatorAllocation", type: "uint256" },
                { internalType: "uint256", name: "liquidityAllocation", type: "uint256" },
                { internalType: "uint256", name: "platformFeeTokens", type: "uint256" },
                { internalType: "uint64", name: "deadline", type: "uint64" },
                { internalType: "address", name: "tokenAddress", type: "address" },
                { internalType: "bool", name: "isActive", type: "bool" },
                { internalType: "bool", name: "isFundingComplete", type: "bool" },
                { internalType: "bool", name: "isCancelled", type: "bool" },
                { internalType: "string", name: "name", type: "string" },
                { internalType: "string", name: "symbol", type: "string" },
                { internalType: "string", name: "description", type: "string" },
                { internalType: "uint32", name: "reserveRatio", type: "uint32" },
                { internalType: "uint256", name: "blockNumberCreated", type: "uint256" },
                { internalType: "bool", name: "isPromoted", type: "bool" },
                { internalType: "address", name: "uniswapPair", type: "address" },
              ],
              internalType: "struct Campaign[]",
              name: "",
              type: "tuple[]",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [{ internalType: "address", name: "creator", type: "address" }],
          name: "getCampaignsByCreator",
          outputs: [
            {
              components: [
                { internalType: "uint256", name: "id", type: "uint256" },
                { internalType: "address", name: "creator", type: "address" },
                { internalType: "uint128", name: "targetAmount", type: "uint128" },
                { internalType: "uint128", name: "amountRaised", type: "uint128" },
                { internalType: "uint256", name: "tokensSold", type: "uint256" },
                { internalType: "uint256", name: "totalSupply", type: "uint256" },
                { internalType: "uint256", name: "tokensForSale", type: "uint256" },
                { internalType: "uint256", name: "creatorAllocation", type: "uint256" },
                { internalType: "uint256", name: "liquidityAllocation", type: "uint256" },
                { internalType: "uint256", name: "platformFeeTokens", type: "uint256" },
                { internalType: "uint64", name: "deadline", type: "uint64" },
                { internalType: "address", name: "tokenAddress", type: "address" },
                { internalType: "bool", name: "isActive", type: "bool" },
                { internalType: "bool", name: "isFundingComplete", type: "bool" },
                { internalType: "bool", name: "isCancelled", type: "bool" },
                { internalType: "string", name: "name", type: "string" },
                { internalType: "string", name: "symbol", type: "string" },
                { internalType: "string", name: "description", type: "string" },
                { internalType: "uint32", name: "reserveRatio", type: "uint32" },
                { internalType: "uint256", name: "blockNumberCreated", type: "uint256" },
                { internalType: "bool", name: "isPromoted", type: "bool" },
                { internalType: "address", name: "uniswapPair", type: "address" },
              ],
              internalType: "struct Campaign[]",
              name: "",
              type: "tuple[]",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [{ internalType: "address", name: "user", type: "address" }],
          name: "getUserTotalInvestment",
          outputs: [
            { internalType: "uint128", name: "totalAmount", type: "uint128" },
            { internalType: "uint32[]", name: "campaignIds", type: "uint32[]" },
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
  },
} as const;

export default externalContracts satisfies GenericContractsDeclaration;
