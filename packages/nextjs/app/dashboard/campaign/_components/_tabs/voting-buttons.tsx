"use client";

import React, { useState } from "react";
import CampaignDAOABI from "../../../../../../hardhat/artifacts/contracts/CampaignDAO.sol/CampaignDAO.json";
import { Minus, ThumbsDown, ThumbsUp } from "lucide-react";
import { useWriteContract } from "wagmi";
import { Button } from "~~/components/ui/button";

interface VotingButtonsProps {
  proposalId: number | bigint;
  daoAddress: `0x${string}` | undefined;
  hasVoted: boolean;
  userVoteType?: number; // 0 = Against, 1 = For, 2 = Abstain
  isVotingActive: boolean;
  hasVotingPower: boolean;
  onVoteSubmitted?: () => void;
  onError?: (error: Error) => void;
}

export function VotingButtons({
  proposalId,
  daoAddress,
  hasVoted,
  userVoteType,
  isVotingActive,
  hasVotingPower,
  onVoteSubmitted,
  onError,
}: VotingButtonsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { writeContractAsync } = useWriteContract();

  const handleVote = async (voteType: 0 | 1 | 2) => {
    if (!daoAddress || !hasVotingPower) {
      if (onError) onError(new Error("You don't have voting power"));
      return;
    }

    setIsSubmitting(true);
    try {
      await writeContractAsync({
        address: daoAddress,
        abi: CampaignDAOABI.abi,
        functionName: "castVote",
        args: [proposalId, voteType],
      });
      setIsSubmitting(false);
      if (onVoteSubmitted) onVoteSubmitted();
    } catch (error) {
      setIsSubmitting(false);
      console.error("Error casting vote:", error);
      if (onError && error instanceof Error) onError(error);
    }
  };

  if (!isVotingActive) {
    return null;
  }

  if (hasVoted) {
    const voteTypeLabels = ["Against", "For", "Abstain"];
    const voteTypeLabel = userVoteType !== undefined ? voteTypeLabels[userVoteType] : "Unknown";

    return (
      <div className="bg-[#11181C] border border-[#3e545f] rounded-lg p-3 text-center">
        <p className="text-sm text-[#546054b0]">
          You voted: <span className="text-[#8daa98] font-semibold">{voteTypeLabel}</span>
        </p>
      </div>
    );
  }

  if (!hasVotingPower) {
    return (
      <div className="bg-[#11181C] border border-[#3e545f] rounded-lg p-3 text-center">
        <p className="text-sm text-gray-400">You don&apos;t have voting power for this proposal</p>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Button
        onClick={() => handleVote(1)}
        disabled={isSubmitting}
        className="flex-1 bg-green-600 text-white hover:bg-green-700 font-semibold flex items-center justify-center gap-1.5 py-2 h-9"
      >
        <ThumbsUp className="w-3.5 h-3.5" />
        {isSubmitting ? "Voting..." : "For"}
      </Button>

      <Button
        onClick={() => handleVote(2)}
        disabled={isSubmitting}
        className="flex-1 bg-gray-600 text-white hover:bg-gray-700 font-semibold flex items-center justify-center gap-1.5 py-2 h-9"
      >
        <Minus className="w-3.5 h-3.5" />
        {isSubmitting ? "Voting..." : "Abstain"}
      </Button>

      <Button
        onClick={() => handleVote(0)}
        disabled={isSubmitting}
        className="flex-1 bg-red-600 text-white hover:bg-red-700 font-semibold flex items-center justify-center gap-1.5 py-2 h-9"
      >
        <ThumbsDown className="w-3.5 h-3.5" />
        {isSubmitting ? "Voting..." : "Against"}
      </Button>
    </div>
  );
}
