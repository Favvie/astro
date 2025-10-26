// hooks/useCampaignsByCreatorWithDetails.ts
import { useMemo } from "react";
import { useScaffoldReadContract } from "../scaffold-eth";
import { useCampaignsByCreator } from "./useCampaignsByCreator";
import { ICampaign } from "~~/types/interface";

/**
 * Combined hook that fetches campaigns from both Envio (for real-time event detection)
 * and the contract (for full campaign details).
 *
 * Envio provides: Real-time event indexing - campaigns appear immediately when created
 * Contract provides: Full campaign details (amounts, status, tokens, etc.)
 */
export const useCampaignsByCreatorWithDetails = (creatorAddress: string | undefined) => {
  // Fetch from Envio (triggers polling every 10 seconds to detect new campaigns)
  const { data: envioCampaignsData, isLoading: isLoadingEnvio } = useCampaignsByCreator(creatorAddress);
  const envioCampaignIds = envioCampaignsData?.Launchpad_CampaignCreated?.map(c => Number(c.campaignId)) || [];

  // Fetch full campaign details from contract
  const { data: rawCampaignsByCreator, isLoading: isLoadingContract } = useScaffoldReadContract({
    contractName: "LaunchpadV2",
    functionName: "getCampaignsByCreator",
    args: [creatorAddress as `0x${string}`],
  });

  // Combine and transform data
  const campaignsByCreator = useMemo((): ICampaign[] => {
    if (!rawCampaignsByCreator) return [];

    return rawCampaignsByCreator?.map(
      (c: any): ICampaign => ({
        id: Number(c.id),
        creator: c.creator,
        targetAmount: Number(c.targetAmount / 10n ** 6n),
        amountRaised: Number(c.amountRaised / 10n ** 6n),
        tokensSold: Number(c.tokensSold / 10n ** 18n),
        totalSupply: Number(c.totalSupply / 10n ** 18n),
        tokensForSale: Number(c.tokensForSale / 10n ** 18n),
        creatorAllocation: Number(c.creatorAllocation / 10n ** 18n),
        liquidityAllocation: Number(c.liquidityAllocation / 10n ** 18n),
        platformFeeTokens: Number(c.platformFeeTokens / 10n ** 18n),
        deadline: Number(c.deadline),
        tokenAddress: c.tokenAddress,
        isActive: c.isActive,
        isFundingComplete: c.isFundingComplete,
        isCancelled: c.isCancelled,
        name: c.name,
        symbol: c.symbol,
        description: c.description,
        reserveRatio: Number(c.reserveRatio),
        blockNumberCreated: Number(c.blockNumberCreated),
        isPromoted: c.isPromoted,
        uniswapPair: c.uniswapPair,
      }),
    );
  }, [rawCampaignsByCreator]);

  return {
    data: campaignsByCreator,
    isLoading: isLoadingEnvio || isLoadingContract,
    isLoadingEnvio,
    isLoadingContract,
    envioCampaignIds, // For debugging/tracking which campaigns came from Envio
  };
};
