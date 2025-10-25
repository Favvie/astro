"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { DepositSidebar } from "../_components/deposit-sidebar";
import { VaultHeader } from "../_components/vault-header";
import { VaultTabs } from "../_components/vault-tabs";
import { useAccount } from "wagmi";
import { Button } from "~~/components/ui/button";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

export default function VaultPage() {
  const { address: connectedAddress } = useAccount();
  const params = useParams();
  const campaignId = params.id;
  const campaignIdNumber = Number(campaignId);

  const { data } = useScaffoldReadContract({
    contractName: "Launchpad",
    functionName: "_getCampaignInfo",
    args: [campaignIdNumber],
  });

  const _campaign = useMemo(() => {
    if (!data) return undefined;
    return {
      id: Number(data.id),
      creator: data.creator,
      targetAmount: Number(data.targetAmount / 10n ** 6n),
      amountRaised: Number(data.amountRaised / 10n ** 6n),
      tokensSold: Number(data.tokensSold / 10n ** 18n),
      totalSupply: Number(data.totalSupply / 10n ** 18n),
      tokensForSale: Number(data.tokensForSale / 10n ** 18n),
      creatorAllocation: Number(data.creatorAllocation / 10n ** 18n),
      liquidityAllocation: Number(data.liquidityAllocation / 10n ** 18n),
      platformFeeTokens: Number(data.platformFeeTokens / 10n ** 18n),
      deadline: Number(data.deadline),
      tokenAddress: data.tokenAddress,
      isActive: data.isActive,
      isFundingComplete: data.isFundingComplete,
      isCancelled: data.isCancelled,
      name: data.name,
      symbol: data.symbol,
      description: data.description,
      reserveRatio: Number(data.reserveRatio),
      blockNumberCreated: Number(data.blockNumberCreated),
      promotionalOgPoints: Number(data.promotionalOgPoints),
      isPromoted: data.isPromoted,
      uniswapPair: data.uniswapPair,
      tokenIconFileId: data.iconFileid,
      whitepaperFileId: data.whitepaperFileid,
    };
  }, [data]);

  return (
    <>
      <div className="pb-2 pt-4 pl-5">
        <Button
          variant="ghost"
          size="sm"
          className="bg-[#25333b] hover:bg-[#25333b]/70 text-gray-400 hover:text-white rounded-3xl px-8"
          onClick={() => window.history.back()}
        >
          Back
        </Button>
      </div>
      <div className="p-1.5 space-y-8 bg-[#070907] m-2 sm:m-4 rounded-2xl h-full">
        <div className="sm:flex">
          <div className="flex-1 p-1 sm:p-6 h-full">
            <div className="p-2 sm:p-0">
              <VaultHeader address={connectedAddress} campaign={_campaign} />
            </div>
            <VaultTabs campaign={_campaign} />
          </div>
          <div className="p-1 sm:p-6">
            <DepositSidebar campaign={_campaign} />
          </div>
        </div>
      </div>
    </>
  );
}
