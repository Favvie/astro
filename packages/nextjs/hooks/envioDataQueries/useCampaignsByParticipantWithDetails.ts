// hooks/useCampaignsByParticipantWithDetails.ts
import { useMemo } from "react";
import { useDeployedContractInfo, useSelectedNetwork } from "../scaffold-eth";
import { useCampaignsByParticipant } from "./useCampaignsByParticipant";
import { useReadContracts } from "wagmi";
import { ICampaign } from "~~/types/interface";
import { AllowedChainIds } from "~~/utils/scaffold-eth";

/**
 * Optimized hook that fetches campaigns detected by Envio (where user participated) and retrieves their full details from the contract.
 *
 * Flow:
 * 1. Envio detects participation via TokensPurchased events (real-time updates)
 * 2. Extract campaign IDs from Envio data
 * 3. Use wagmi multicall to fetch _getCampaignInfo for all campaign IDs in parallel
 * 4. Transform and return combined campaign data
 */
export const useCampaignsByParticipantWithDetails = (participantAddress: string | undefined) => {
  // Fetch from Envio (triggers polling every 5 seconds to detect new participations)
  const { data: envioParticipationData, isLoading: isLoadingEnvio } = useCampaignsByParticipant(participantAddress);

  // Memoize campaign IDs to prevent unnecessary re-renders of dependent hooks
  const envioParticipatedCampaignIds = useMemo(() => {
    const ids = envioParticipationData?.Launchpad_TokensPurchased?.map(c => Number(c.campaignId)) || [];
    // Remove duplicates (user might have participated in same campaign multiple times)
    const uniqueIds = Array.from(new Set(ids));
    console.log("envioParticipatedCampaignIds", uniqueIds);
    return uniqueIds;
  }, [envioParticipationData]);

  const selectedNetwork = useSelectedNetwork();
  const { data: deployedContract } = useDeployedContractInfo({
    contractName: "Launchpad",
    chainId: selectedNetwork.id as AllowedChainIds,
  });

  // Build multicall contracts array for all campaign IDs
  const contracts = useMemo(() => {
    if (!deployedContract || envioParticipatedCampaignIds.length === 0) {
      return [];
    }

    return envioParticipatedCampaignIds.map(campaignId => ({
      address: deployedContract.address as `0x${string}`,
      abi: deployedContract.abi,
      functionName: "_getCampaignInfo",
      args: [campaignId],
    }));
  }, [deployedContract, envioParticipatedCampaignIds]);

  // Fetch all campaign details in parallel using multicall
  const { data: campaignDetailsArray, isLoading: isLoadingContract } = useReadContracts({
    contracts: contracts as any,
    query: {
      enabled: contracts.length > 0,
    },
  });

  console.log("campaignDetailsArray", campaignDetailsArray);

  // Transform contract data to UI-friendly format
  const campaignsByParticipant = useMemo((): ICampaign[] => {
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
    data: campaignsByParticipant,
    isLoading: isLoadingEnvio || isLoadingContract,
    isLoadingEnvio,
    isLoadingContract,
    envioParticipatedCampaignIds, // For debugging/tracking which campaigns came from Envio
  };
};
