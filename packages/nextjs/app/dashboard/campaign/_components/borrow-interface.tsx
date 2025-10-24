"use client";

import type React from "react";
import { useState } from "react";
import { ICampaign, IStakingPool } from "~~/types/interface";

export function BorrowInterface({}: { campaign: ICampaign; stakingPool?: IStakingPool | undefined }) {
  const [activeTab, setActiveTab] = useState<"trade" | "liquidity" | "stake">("trade");
  // Convert swap amounts to BigInt with proper decimal handling
  // Calculate equivalent amounts based on pool reserves

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Tabs */}
      <div className="flex items-center">
        <button
          onClick={() => setActiveTab("trade")}
          className={`px-4 py-1 rounded-3xl text-sm font-medium transition-colors ${
            activeTab === "trade" ? "bg-[#546054b0] text-gray-300" : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Trade
        </button>
        <button
          onClick={() => setActiveTab("liquidity")}
          className={`px-4 py-1 rounded-3xl text-sm font-medium transition-colors ${
            activeTab === "liquidity" ? "bg-[#546054b0] text-gray-300" : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Liquidity
        </button>
        <button
          onClick={() => setActiveTab("stake")}
          className={`px-4 py-1 rounded-3xl text-sm font-medium transition-colors ${
            activeTab === "stake" ? "bg-[#546054b0] text-gray-300" : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Stake
        </button>
      </div>
    </div>
  );
}
