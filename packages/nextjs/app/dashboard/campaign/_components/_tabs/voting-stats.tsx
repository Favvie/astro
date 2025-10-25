"use client";

import React from "react";
import { calculateVotePercentage, formatVoteCount } from "./governance-utils";

interface VotingStatsProps {
  forVotes: number | bigint;
  againstVotes: number | bigint;
  abstainVotes: number | bigint;
  quorumPercentage?: number;
  majorityPercentage?: number;
  totalSupply?: number | bigint;
}

export function VotingStats({
  forVotes,
  againstVotes,
  abstainVotes,
  quorumPercentage,
  majorityPercentage,
  totalSupply,
}: VotingStatsProps) {
  const forNum = typeof forVotes === "bigint" ? Number(forVotes) : forVotes;
  const againstNum = typeof againstVotes === "bigint" ? Number(againstVotes) : againstVotes;
  const abstainNum = typeof abstainVotes === "bigint" ? Number(abstainVotes) : abstainVotes;

  const totalVotes = forNum + againstNum + abstainNum;
  const forPercentage = calculateVotePercentage(forNum, totalVotes);
  const againstPercentage = calculateVotePercentage(againstNum, totalVotes);
  const abstainPercentage = calculateVotePercentage(abstainNum, totalVotes);

  // Calculate quorum if parameters provided
  const supplyNum = totalSupply ? (typeof totalSupply === "bigint" ? Number(totalSupply) : totalSupply) : 0;
  const quorumPercentageNum = quorumPercentage || 0;
  const quorumMet = supplyNum > 0 ? totalVotes * 10000 >= supplyNum * quorumPercentageNum : false;
  const quorumPercentageDisplay = supplyNum > 0 ? (totalVotes / supplyNum) * 100 : 0;

  // Calculate majority if parameters provided
  const majorityPercentageNum = majorityPercentage || 0;
  const decisiveVotes = forNum + againstNum;
  const majorityMet = decisiveVotes > 0 ? forNum * 10000 >= decisiveVotes * majorityPercentageNum : false;

  return (
    <div className="space-y-3">
      {/* Vote Counts */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[#11181C] border border-[#24353d] rounded-lg p-2">
          <div className="text-xs text-[#546054b0] mb-1">For</div>
          <div className="text-sm text-green-400 font-semibold">{formatVoteCount(forVotes)}</div>
          <div className="text-xs text-gray-500 mt-1">{forPercentage.toFixed(1)}%</div>
        </div>

        <div className="bg-[#11181C] border border-[#24353d] rounded-lg p-2">
          <div className="text-xs text-[#546054b0] mb-1">Against</div>
          <div className="text-sm text-red-400 font-semibold">{formatVoteCount(againstVotes)}</div>
          <div className="text-xs text-gray-500 mt-1">{againstPercentage.toFixed(1)}%</div>
        </div>

        <div className="bg-[#11181C] border border-[#24353d] rounded-lg p-2">
          <div className="text-xs text-[#546054b0] mb-1">Abstain</div>
          <div className="text-sm text-gray-400 font-semibold">{formatVoteCount(abstainVotes)}</div>
          <div className="text-xs text-gray-500 mt-1">{abstainPercentage.toFixed(1)}%</div>
        </div>
      </div>

      {/* Governance Requirements */}
      {quorumPercentage !== undefined && majorityPercentage !== undefined && (
        <div className="space-y-1.5">
          {/* Quorum Status */}
          <div className="bg-[#11181C] border border-[#24353d] rounded-lg p-2">
            <div className="flex justify-between items-center mb-1.5">
              <div className="text-xs text-[#546054b0]">Quorum ({quorumPercentageNum / 100}%)</div>
              <div className={`text-xs font-semibold ${quorumMet ? "text-green-400" : "text-gray-500"}`}>
                {quorumPercentageDisplay.toFixed(1)}% / {quorumPercentageNum / 100}%
              </div>
            </div>
            <div className="w-full h-1.5 bg-[#24353d] rounded-full overflow-hidden">
              <div
                className={`h-full ${quorumMet ? "bg-green-500" : "bg-yellow-500"}`}
                style={{ width: `${Math.min(quorumPercentageDisplay, 100)}%` }}
              />
            </div>
          </div>

          {/* Majority Status */}
          <div className="bg-[#11181C] border border-[#24353d] rounded-lg p-2">
            <div className="flex justify-between items-center mb-1.5">
              <div className="text-xs text-[#546054b0]">Majority ({majorityPercentageNum / 100}%)</div>
              <div className={`text-xs font-semibold ${majorityMet ? "text-green-400" : "text-gray-500"}`}>
                {decisiveVotes > 0 ? ((forNum / decisiveVotes) * 100).toFixed(1) : "0"}% / {majorityPercentageNum / 100}
                %
              </div>
            </div>
            <div className="w-full h-1.5 bg-[#24353d] rounded-full overflow-hidden">
              <div
                className={`h-full ${majorityMet ? "bg-green-500" : "bg-yellow-500"}`}
                style={{ width: `${decisiveVotes > 0 ? Math.min((forNum / decisiveVotes) * 100, 100) : 0}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
