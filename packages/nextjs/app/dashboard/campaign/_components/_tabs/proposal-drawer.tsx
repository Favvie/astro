"use client";

import React, { useEffect, useState } from "react";
import CampaignDAOABI from "../../../../../../hardhat/artifacts/contracts/CampaignDAO.sol/CampaignDAO.json";
import { ProposalStateType, formatDate, formatTimeRemaining, isVotingActive } from "./governance-utils";
import { StatusBadge } from "./status-badge";
import { VotingButtons } from "./voting-buttons";
import { VotingStats } from "./voting-stats";
import { X } from "lucide-react";
import { useReadContract } from "wagmi";
import { Button } from "~~/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "~~/components/ui/drawer";

interface ProposalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  proposalId: number | bigint;
  daoAddress: `0x${string}` | undefined;
  title: string;
  description: string;
  proposer: string;
  startTime: number | bigint;
  endTime: number | bigint;
  forVotes: number | bigint;
  againstVotes: number | bigint;
  abstainVotes: number | bigint;
  // executed: boolean;
  connectedAddress: `0x${string}` | undefined;
  proposalStatus: ProposalStateType | string;
  quorumPercentage?: number;
  majorityPercentage?: number;
  totalSupply?: number | bigint;
  onVoteSubmitted?: () => void;
}

export function ProposalDrawer({
  isOpen,
  onClose,
  proposalId,
  daoAddress,
  title,
  description,
  proposer,
  startTime,
  endTime,
  forVotes,
  againstVotes,
  abstainVotes,
  // executed,
  connectedAddress,
  proposalStatus,
  quorumPercentage,
  majorityPercentage,
  totalSupply,
  onVoteSubmitted,
}: ProposalDrawerProps) {
  const [timeRemaining, setTimeRemaining] = useState("");

  // Fetch voting power
  const { data: votingPower } = useReadContract({
    address: daoAddress,
    abi: CampaignDAOABI.abi,
    functionName: "getVotingPower",
    args: [connectedAddress],
  });

  // Check if user has voted
  const { data: hasVoted } = useReadContract({
    address: daoAddress,
    abi: CampaignDAOABI.abi,
    functionName: "hasAddressVoted",
    args: [proposalId, connectedAddress],
  });

  // Get user's vote type
  const { data: userVoteType } = useReadContract({
    address: daoAddress,
    abi: CampaignDAOABI.abi,
    functionName: "getVote",
    args: [proposalId, connectedAddress],
    query: {
      enabled: hasVoted ? true : false,
    },
  });

  const votingPowerNum = votingPower ? Number(votingPower) : 0;
  const hasVotingPower = votingPowerNum > 0;
  const votingActive = isVotingActive(typeof endTime === "bigint" ? Number(endTime) : endTime);

  // Update time remaining every minute
  useEffect(() => {
    const updateTime = () => {
      setTimeRemaining(formatTimeRemaining(typeof endTime === "bigint" ? Number(endTime) : endTime));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [endTime]);

  const endTimeNum = typeof endTime === "bigint" ? Number(endTime) : endTime;
  const startTimeNum = typeof startTime === "bigint" ? Number(startTime) : startTime;
  const shortenedProposer = proposer ? `${proposer.slice(0, 6)}...${proposer.slice(-4)}` : "Unknown";

  const handleVoteSubmitted = () => {
    if (onVoteSubmitted) onVoteSubmitted();
    onClose();
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="bg-[#19242a] border-[#3e545f] max-h-[90vh] max-w-4xl mx-auto rounded-t-2xl p-4">
        <DrawerHeader className="border-b border-[#3e545f] ">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DrawerTitle className="text-xl font-semibold text-white">{title}</DrawerTitle>
              <div className="flex items-center gap-2 mt-2">
                <StatusBadge status={proposalStatus} />
              </div>
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-4 w-4 text-gray-400" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 py-6 space-y-6">
          {/* Description and Proposer */}
          <div className="space-y-3">
            <DrawerDescription className="text-sm text-gray-300 leading-relaxed">{description}</DrawerDescription>
            <div className="text-xs text-gray-500">
              <p>
                Proposed by: <span className="text-[#8daa98]">{shortenedProposer}</span>
              </p>
            </div>
          </div>

          <div className="border-t border-[#3e545f]" />

          {/* Timeline */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#11181C] border border-[#24353d] rounded-lg p-3">
              <div className="text-xs text-[#546054b0] mb-1">Started</div>
              <div className="text-xs text-gray-300">{formatDate(startTimeNum)}</div>
            </div>
            <div className="bg-[#11181C] border border-[#24353d] rounded-lg p-3">
              <div className="text-xs text-[#546054b0] mb-1">Deadline</div>
              <div className="text-xs text-gray-300">{formatDate(endTimeNum)}</div>
              {votingActive && timeRemaining && (
                <div className="text-xs text-[#8daa98] mt-1 font-semibold">{timeRemaining}</div>
              )}
            </div>
          </div>

          {/* Voting Stats */}
          <VotingStats
            forVotes={forVotes}
            againstVotes={againstVotes}
            abstainVotes={abstainVotes}
            quorumPercentage={quorumPercentage}
            majorityPercentage={majorityPercentage}
            totalSupply={totalSupply}
          />

          <div className="border-t border-[#3e545f]" />

          {/* Voting Buttons */}
          <VotingButtons
            proposalId={proposalId}
            daoAddress={daoAddress}
            hasVoted={hasVoted ? true : false}
            userVoteType={userVoteType as any}
            isVotingActive={votingActive}
            hasVotingPower={hasVotingPower}
            onVoteSubmitted={handleVoteSubmitted}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
