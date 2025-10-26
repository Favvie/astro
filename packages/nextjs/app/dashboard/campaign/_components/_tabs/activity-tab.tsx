import { useState } from "react";
import Image from "next/image";
import { usePoolPrice } from "../utils/pool-price";
import { BrushCleaning, ExternalLink } from "lucide-react";
import { Address } from "~~/components/scaffold-eth";
import { Card } from "~~/components/ui/card";
import { Skeleton } from "~~/components/ui/skeleton";
import {
  useDebugLiquidityV1Events,
  useDebugLiquidityV2Events,
} from "~~/hooks/envioDataQueries/useDebugLiquidityEvents";
import { useDebugSwapEvents } from "~~/hooks/envioDataQueries/useDebugSwapEvents";
import { useLiquidityEventsByCampaign } from "~~/hooks/envioDataQueries/useLiquidityEventsByCampaign";
import { useSwapEventsByCampaign } from "~~/hooks/envioDataQueries/useSwapEventsByCampaign";
import { useTokensPurchasedByCampaign } from "~~/hooks/envioDataQueries/useTokensPurchasedByCampaign";
import { formatAmount } from "~~/lib/utils";
import { ICampaign } from "~~/types/interface";

type TabType = "transactions" | "swaps" | "liquidity";

export function ActivityTab({ campaign }: { campaign: ICampaign | undefined }) {
  const [activeTab, setActiveTab] = useState<TabType>(campaign?.isFundingComplete ? "transactions" : "transactions");

  // Fetch TokensPurchased events from Envio indexer
  const { data: envioData, isLoading: isLoadingEvents } = useTokensPurchasedByCampaign(campaign?.id);
  const events = envioData?.Launchpad_TokensPurchased || [];

  // Fetch Swap events for live campaigns
  const { data: swapData, isLoading: isLoadingSwaps } = useSwapEventsByCampaign(
    campaign?.isFundingComplete ? campaign?.id : undefined,
  );
  const swapEvents = swapData?.LaunchpadV2_SwapEvent || [];

  // Fetch Liquidity events for live campaigns
  const { data: liquidityData, isLoading: isLoadingLiquidity } = useLiquidityEventsByCampaign(
    campaign?.isFundingComplete ? campaign?.id : undefined,
  );
  const liquidityEvents = liquidityData?.LaunchpadV2_LiquidityEvent || [];

  // Debug hooks to check if data exists globally
  const { data: debugSwapData } = useDebugSwapEvents();
  const { data: debugLiquidityV1Data } = useDebugLiquidityV1Events();
  const { data: debugLiquidityV2Data } = useDebugLiquidityV2Events();

  const { swapEvents: poolSwapEvents } = usePoolPrice(campaign?.uniswapPair || "");

  console.log("Campaign ID:", campaign?.id);
  console.log("buy events (from Envio)", events);
  console.log("swap events (filtered by campaignId)", swapEvents);
  console.log("liquidity events (filtered by campaignId)", liquidityEvents);
  console.log("DEBUG - All swap events in system:", debugSwapData?.LaunchpadV2_SwapEvent);
  console.log("DEBUG - All liquidity V1 events in system:", debugLiquidityV1Data?.Launchpad_LiquidityAdded);
  console.log("DEBUG - All liquidity V2 events in system:", debugLiquidityV2Data?.LaunchpadV2_LiquidityEvent);
  console.log("pool swaps", poolSwapEvents);

  return (
    <div className="space-y-8">
      <div>
        {campaign?.isFundingComplete ? (
          <>
            <div className="mb-6">
              <h3 className="text-lg text-gray-300">Live Trading Activity</h3>
            </div>

            {/* Tab Navigation */}
            <div className="mb-6 flex gap-4 border-b border-gray-700">
              <button
                onClick={() => setActiveTab("swaps")}
                className={`px-4 py-3 font-medium transition-colors ${
                  activeTab === "swaps" ? "text-white border-b-2 border-green-500" : "text-gray-400 hover:text-gray-300"
                }`}
              >
                Swaps
              </button>
              <button
                onClick={() => setActiveTab("liquidity")}
                className={`px-4 py-3 font-medium transition-colors ${
                  activeTab === "liquidity"
                    ? "text-white border-b-2 border-green-500"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                Liquidity
              </button>
            </div>

            {/* Swaps Tab */}
            {activeTab === "swaps" && (
              <div className="bg-[#11181C] border-[#24353d] border rounded-lg overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-4 gap-4 p-4 border-b border-gray-700 text-gray-400 text-xs">
                  <div>User</div>
                  <div>Amount</div>
                  <div>Type</div>
                  <div>Token</div>
                </div>

                {/* Swap Events Row */}
                {isLoadingSwaps ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton key={index} className="w-full h-12 rounded-2xl bg-slate-600/40" />
                  ))
                ) : swapEvents.length > 0 ? (
                  swapEvents.map(event => (
                    <div key={event.id} className="grid grid-cols-4 gap-2 p-4 text-xs overflow-x-scroll">
                      <div className="flex items-center gap-2 hover:bg-[#546054b0] w-3/4 py-1 px-2 rounded-2xl">
                        <Address size="xs" address={event.user as `0x${string}`} />
                        <ExternalLink className="w-4 h-4 mb-1" />
                      </div>
                      <span className="text-white pt-2">{formatAmount(Number(event.amount) / 1e6)} USDC</span>
                      <div className="pt-2">
                        <span
                          className={`px-2 py-1 rounded-2xl text-xs font-medium ${
                            event.tradeType === 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {event.tradeType === 0 ? "BUY" : "SELL"}
                        </span>
                      </div>
                      <span className="text-gray-400 pt-2 font-mono text-xs">
                        {event.token.slice(0, 6)}...{event.token.slice(-4)}
                      </span>
                    </div>
                  ))
                ) : (
                  <Card className="bg-[#19242a] border-[#3e545f] h-64">
                    <div className="flex items-center justify-center w-full h-full">
                      <div className="flex flex-col items-center gap-4">
                        <div className="h-16 w-16 rounded-full flex justify-center items-center bg-[#546054b0] text-[#8daa98]">
                          <BrushCleaning size={27} />
                        </div>
                        <div className="flex flex-col items-start gap-2">
                          <div className="font-medium text-lg text-[#8daa98]">No swaps found</div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* Liquidity Tab */}
            {activeTab === "liquidity" && (
              <div className="bg-[#11181C] border-[#24353d] border rounded-lg overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-5 gap-4 p-4 border-b border-gray-700 text-gray-400 text-xs">
                  <div>User</div>
                  <div>USDC Amount</div>
                  <div>Token Amount</div>
                  <div>Type</div>
                  <div>Token</div>
                </div>

                {/* Liquidity Events Row */}
                {isLoadingLiquidity ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton key={index} className="w-full h-12 rounded-2xl bg-slate-600/40" />
                  ))
                ) : liquidityEvents.length > 0 ? (
                  liquidityEvents.map(event => (
                    <div key={event.id} className="grid grid-cols-5 gap-2 p-4 text-xs overflow-x-scroll">
                      <div className="flex items-center gap-2 hover:bg-[#546054b0] w-3/4 py-1 px-2 rounded-2xl">
                        <Address size="xs" address={event.user as `0x${string}`} />
                        <ExternalLink className="w-4 h-4 mb-1" />
                      </div>
                      <span className="text-white pt-2">{formatAmount(Number(event.usdcAmount) / 1e6)} USDC</span>
                      <span className="text-white pt-2">{formatAmount(Number(event.tokenAmount) / 1e18)}</span>
                      <div className="pt-2">
                        <span
                          className={`px-2 py-1 rounded-2xl text-xs font-medium ${
                            event.tradeType === 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {event.tradeType === 0 ? "ADD" : "REMOVE"}
                        </span>
                      </div>
                      <span className="text-gray-400 pt-2 font-mono text-xs">
                        {event.token.slice(0, 6)}...{event.token.slice(-4)}
                      </span>
                    </div>
                  ))
                ) : (
                  <Card className="bg-[#19242a] border-[#3e545f] h-64">
                    <div className="flex items-center justify-center w-full h-full">
                      <div className="flex flex-col items-center gap-4">
                        <div className="h-16 w-16 rounded-full flex justify-center items-center bg-[#546054b0] text-[#8daa98]">
                          <BrushCleaning size={27} />
                        </div>
                        <div className="flex flex-col items-start gap-2">
                          <div className="font-medium text-lg text-[#8daa98]">No liquidity events found</div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="mb-6">
              <h3 className="text-lg text-gray-300">All Transactions</h3>
            </div>
            <div className="mt-5 bg-[#11181C] border-[#24353d] border rounded-lg overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-4 gap-4 p-4 border-b border-gray-700 text-gray-400 text-xs">
                <div className="flex items-center gap-1">
                  Date
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div>user</div>
                <div>Amount</div>
                <div>Received</div>
              </div>

              {isLoadingEvents ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="w-full h-48 rounded-2xl bg-slate-600/40" />
                ))
              ) : events.length > 0 ? (
                events.map(event => {
                  return (
                    <div key={event.id} className="grid grid-cols-4 gap-2 p-4 text-xs overflow-x-scroll">
                      <div className="text-gray-300 pt-2">
                        {new Date(Number(event.timestamp) * 1000).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2 hover:bg-[#546054b0] w-3/4 py-1 px-2 rounded-2xl">
                        <Address size="xs" address={event.buyer as `0x${string}`} />
                        <ExternalLink className="w-4 h-4 mb-1" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Image src="/usdc.svg" alt="USDC" width={16} height={16} className="w-4 h-4" />
                        <span className="text-white">{formatAmount(Number(event.usdcAmount) / 1e6)} USDC</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
                        <span className="text-white">{formatAmount(Number(event.tokensReceived) / 1e18)}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <Card className="bg-[#19242a] border-[#3e545f] h-64">
                  <div className="flex items-center justify-center w-full h-full">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-16 w-16 rounded-full flex justify-center items-center bg-[#546054b0] text-[#8daa98]">
                        <BrushCleaning size={27} />
                      </div>

                      <div className="flex flex-col items-start gap-2">
                        <div className="font-medium text-lg text-[#8daa98]">No activities found</div>
                        <div className="text-[#546054b0] text-xs">Buy in to this campaign</div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
