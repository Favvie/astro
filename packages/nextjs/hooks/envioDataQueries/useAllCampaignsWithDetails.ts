// hooks/useAllCampaignsWithDetails.ts
import { useMemo } from "react";
import { useDeployedContractInfo, useSelectedNetwork } from "../scaffold-eth";
import { useAllCampaigns } from "./useAllCampaigns";
import { useReadContracts } from "wagmi";
import { ICampaign } from "~~/types/interface";
import { AllowedChainIds } from "~~/utils/scaffold-eth";

/**
 * Optimized hook that fetches all campaigns detected by Envio and retrieves their full details from the contract.
 *
 * Flow:
 * 1. Envio detects all campaigns via CampaignCreated events (real-time updates)
 * 2. Extract campaign IDs from Envio data
 * 3. Use wagmi multicall to fetch _getCampaignInfo for all campaign IDs in parallel
 * 4. Transform and return combined campaign data
 */
export const useAllCampaignsWithDetails = (limit?: number) => {
  // Fetch from Envio (triggers polling every 5 seconds to detect new campaigns)
  const { data: envioCampaignsData, isLoading: isLoadingEnvio } = useAllCampaigns();

  console.log("envioCampaignsData from Envio:", envioCampaignsData);
  console.log("isLoadingEnvio:", isLoadingEnvio);

  // Memoize campaign IDs to prevent unnecessary re-renders of dependent hooks
  const envioCampaignIds = useMemo(() => {
    const campaigns = envioCampaignsData?.Launchpad_CampaignCreated || [];

    console.log("campaigns from Envio:", campaigns);
    console.log("campaigns length:", campaigns.length);

    let ids = campaigns.map(c => Number(c.campaignId));

    if (limit) {
      ids = ids.slice(0, limit);
    }
    console.log("envioCampaignIds", ids);
    return ids;
  }, [envioCampaignsData, limit]);

  const selectedNetwork = useSelectedNetwork();
  const { data: deployedContract } = useDeployedContractInfo({
    contractName: "Launchpad",
    chainId: selectedNetwork.id as AllowedChainIds,
  });

  // Build multicall contracts array for all campaign IDs
  const contracts = useMemo(() => {
    if (!deployedContract || envioCampaignIds.length === 0) {
      return [];
    }

    return envioCampaignIds.map(campaignId => ({
      address: deployedContract.address as `0x${string}`,
      abi: deployedContract.abi,
      functionName: "_getCampaignInfo",
      args: [campaignId],
    }));
  }, [deployedContract, envioCampaignIds]);

  // Fetch all campaign details in parallel using multicall
  const { data: campaignDetailsArray, isLoading: isLoadingContract } = useReadContracts({
    contracts: contracts as any,
    query: {
      enabled: contracts.length > 0,
    },
  });

  console.log("campaignDetailsArray", campaignDetailsArray);

  // Transform contract data to UI-friendly format
  const campaigns = useMemo((): ICampaign[] => {
    if (!campaignDetailsArray || campaignDetailsArray.length === 0) {
      return [];
    }

    return campaignDetailsArray
      .map((result: any) => {
        if (result.status === "failure" || !result.result) {
          return null;
        }

        const campaign = result.result;
        console.log("campaign", campaign);
        return {
          id: Number(campaign.id),
          creator: campaign.creator,
          targetAmount: Number(campaign.targetAmount / 10n ** 6n),
          amountRaised: Number(campaign.amountRaised / 10n ** 6n),
          tokensSold: Number(campaign.tokensSold / 10n ** 18n),
          totalSupply: Number(campaign.totalSupply / 10n ** 18n),
          tokensForSale: Number(campaign.tokensForSale / 10n ** 18n),
          creatorAllocation: Number(campaign.creatorAllocation / 10n ** 18n),
          liquidityAllocation: Number(campaign.liquidityAllocation / 10n ** 18n),
          platformFeeTokens: Number(campaign.platformFeeTokens / 10n ** 18n),
          deadline: Number(campaign.deadline),
          tokenAddress: campaign.tokenAddress,
          isActive: campaign.isActive,
          isFundingComplete: campaign.isFundingComplete,
          isCancelled: campaign.isCancelled,
          name: campaign.name,
          symbol: campaign.symbol,
          description: campaign.description,
          reserveRatio: Number(campaign.reserveRatio),
          blockNumberCreated: Number(campaign.blockNumberCreated),
          isPromoted: campaign.isPromoted,
          uniswapPair: campaign.uniswapPair,
        } as ICampaign;
      })
      .filter((campaign): campaign is ICampaign => campaign !== null);
  }, [campaignDetailsArray]);

  return {
    data: campaigns,
    isLoading: isLoadingEnvio || isLoadingContract,
    isLoadingEnvio,
    isLoadingContract,
    envioCampaignIds, // For debugging/tracking which campaigns came from Envio
  };
};
