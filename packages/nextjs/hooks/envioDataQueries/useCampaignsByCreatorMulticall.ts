// hooks/useCampaignsByCreatorMulticall.ts
import { useMemo } from "react";
import { useDeployedContractInfo } from "../scaffold-eth";
import { useSelectedNetwork } from "../scaffold-eth";
import { useCampaignsByCreator } from "./useCampaignsByCreator";
import { useReadContracts } from "wagmi";
import { ICampaign } from "~~/types/interface";
import { AllowedChainIds } from "~~/utils/scaffold-eth";

/**
 * Optimized hook that fetches campaigns detected by Envio using wagmi multicall.
 *
 * Flow:
 * 1. Envio detects new campaigns via events (real-time updates)
 * 2. Extract campaign IDs from Envio data
 * 3. Use wagmi multicall to fetch _getCampaignInfo for all campaign IDs in parallel
 * 4. Transform and return combined campaign data
 */
export const useCampaignsByCreatorMulticall = (creatorAddress: string | undefined) => {
  // Fetch from Envio (triggers polling every 10 seconds to detect new campaigns)
  const { data: envioCampaignsData, isLoading: isLoadingEnvio } = useCampaignsByCreator(creatorAddress);
  const envioCampaignIds = envioCampaignsData?.Launchpad_CampaignCreated?.map(c => Number(c.campaignId)) || [];
  console.log("envioCampaignIds", envioCampaignIds);

  const selectedNetwork = useSelectedNetwork();
  const { data: deployedContract } = useDeployedContractInfo({
    contractName: "LaunchpadV2",
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

  // Transform contract data to UI-friendly format
  const campaignsByCreator = useMemo((): ICampaign[] => {
    if (!campaignDetailsArray || campaignDetailsArray.length === 0) {
      return [];
    }

    return campaignDetailsArray
      .map((result: any) => {
        if (result.status === "failure" || !result.result) {
          return null;
        }

        const campaign = result.result;
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
    data: campaignsByCreator,
    isLoading: isLoadingEnvio || isLoadingContract,
    isLoadingEnvio,
    isLoadingContract,
    envioCampaignIds,
  };
};
