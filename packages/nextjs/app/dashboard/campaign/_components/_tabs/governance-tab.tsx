"use client";

import React, { useEffect, useState } from "react";
import CampaignDAOABI from "../../../../../../hardhat/artifacts/contracts/CampaignDAO.sol/CampaignDAO.json";
import { ProposalState } from "./governance-utils";
import { ProposalCard } from "./proposal-card";
import { ProposalDrawer } from "./proposal-drawer";
import { Plus } from "lucide-react";
import { useReadContract, useWriteContract } from "wagmi";
import { Button } from "~~/components/ui/button";
import { Card } from "~~/components/ui/card";

interface GovernanceTabProps {
  connectedAddress: `0x${string}` | undefined;
  daoAddress: `0x${string}` | undefined;
}

interface ProposalData {
  id: bigint;
  proposer: string;
  title: string;
  description: string;
  startTime: bigint;
  endTime: bigint;
  forVotes: bigint;
  againstVotes: bigint;
  abstainVotes: bigint;
  executed: boolean;
}

export function GovernanceTab({ connectedAddress, daoAddress }: GovernanceTabProps) {
  const [showCreateProposal, setShowCreateProposal] = useState(false);
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalDescription, setProposalDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proposals, setProposals] = useState<ProposalData[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [proposalStates, setProposalStates] = useState<Record<number, string>>({});
  const [openDrawerProposalId, setOpenDrawerProposalId] = useState<number | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<ProposalData | null>(null);

  // Read proposal count
  const { data: proposalCount, refetch: refetchProposalCount } = useReadContract({
    address: daoAddress,
    abi: CampaignDAOABI.abi,
    functionName: "proposalCount",
  });

  // Read user's voting power
  const { data: votingPower } = useReadContract({
    address: daoAddress,
    abi: CampaignDAOABI.abi,
    functionName: "getVotingPower",
    args: [connectedAddress],
  });

  // Read DAO parameters
  const { data: quorumPercentage } = useReadContract({
    address: daoAddress,
    abi: CampaignDAOABI.abi,
    functionName: "quorumPercentage",
  });

  const { data: majorityPercentage } = useReadContract({
    address: daoAddress,
    abi: CampaignDAOABI.abi,
    functionName: "majorityPercentage",
  });

  // Read campaign token total supply
  const { data: campaignToken } = useReadContract({
    address: daoAddress,
    abi: CampaignDAOABI.abi,
    functionName: "campaignToken",
  });

  const { data: totalSupply } = useReadContract({
    address: campaignToken as `0x${string}` | undefined,
    abi: [
      {
        type: "function",
        name: "totalSupply",
        outputs: [{ type: "uint256" }],
        stateMutability: "view",
      },
    ],
    query: {
      enabled: !!campaignToken,
    },
  });

  // Write functions
  const { writeContractAsync } = useWriteContract();

  // Fetch proposals when proposal count changes
  useEffect(() => {
    const fetchProposals = async () => {
      if (!daoAddress || !proposalCount) return;

      setLoadingProposals(true);
      const count = Number(proposalCount);
      const fetchedProposals: ProposalData[] = [];
      const states: Record<number, string> = {};

      try {
        // Fetch all proposals from API
        for (let i = 1; i <= count; i++) {
          try {
            const proposalData = await fetch(`/api/governance/get-proposal?daoAddress=${daoAddress}&proposalId=${i}`)
              .then(res => res.json())
              .catch(() => null);

            if (proposalData?.proposal) {
              // Convert string values back to BigInt
              const proposal = proposalData.proposal;
              fetchedProposals.push({
                id: BigInt(proposal.id),
                proposer: proposal.proposer,
                title: proposal.title,
                description: proposal.description,
                startTime: BigInt(proposal.startTime),
                endTime: BigInt(proposal.endTime),
                forVotes: BigInt(proposal.forVotes),
                againstVotes: BigInt(proposal.againstVotes),
                abstainVotes: BigInt(proposal.abstainVotes),
                executed: proposal.executed,
              });
              states[i] = proposalData.state;
            }
          } catch (e) {
            console.error(`Failed to fetch proposal ${i}:`, e);
          }
        }

        setProposals(fetchedProposals);
        setProposalStates(states);
      } catch (error) {
        console.error("Error fetching proposals:", error);
      } finally {
        setLoadingProposals(false);
      }
    };

    fetchProposals();
  }, [proposalCount, daoAddress]);

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposalTitle || !proposalDescription || !daoAddress) {
      alert("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await writeContractAsync({
        address: daoAddress,
        abi: CampaignDAOABI.abi,
        functionName: "createProposal",
        args: [proposalTitle, proposalDescription],
      });
      setProposalTitle("");
      setProposalDescription("");
      setShowCreateProposal(false);
      // Refetch proposals
      setTimeout(() => refetchProposalCount(), 1000);
    } catch (error) {
      console.error("Error creating proposal:", error);
      alert("Failed to create proposal");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoteSubmitted = () => {
    // Refetch proposals to get updated vote counts
    setTimeout(() => refetchProposalCount(), 1000);
  };

  const handleOpenDrawer = (proposal: ProposalData) => {
    setSelectedProposal(proposal);
    setOpenDrawerProposalId(Number(proposal.id));
  };

  const handleCloseDrawer = () => {
    setOpenDrawerProposalId(null);
    setSelectedProposal(null);
  };

  const formattedVotingPower = votingPower ? Number(votingPower) / 10 ** 18 : 0;
  const proposalCountNum = proposalCount ? Number(proposalCount) : 0;

  return (
    <div className="space-y-6">
      {/* Create Proposal Section */}
      {formattedVotingPower > 0 && (
        <>
          {!showCreateProposal ? (
            <Button
              onClick={() => setShowCreateProposal(true)}
              className="w-full bg-[#8daa98] text-[#11181C] hover:bg-[#a4c9b5] font-semibold flex items-center justify-center gap-2 py-6"
            >
              <Plus className="w-5 h-5" />
              Create Proposal
            </Button>
          ) : (
            <Card className="bg-[#19242a] border-[#3e545f] p-6">
              <form onSubmit={handleCreateProposal} className="space-y-4">
                <div>
                  <label className="text-sm text-[#546054b0] mb-2 block">Proposal Title</label>
                  <input
                    type="text"
                    value={proposalTitle}
                    onChange={e => setProposalTitle(e.target.value)}
                    placeholder="Enter proposal title"
                    className="w-full bg-[#11181C] border border-[#24353d] rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#8daa98]"
                  />
                </div>

                <div>
                  <label className="text-sm text-[#546054b0] mb-2 block">Description</label>
                  <textarea
                    value={proposalDescription}
                    onChange={e => setProposalDescription(e.target.value)}
                    placeholder="Enter proposal description"
                    rows={4}
                    className="w-full bg-[#11181C] border border-[#24353d] rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#8daa98]"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-[#8daa98] text-[#11181C] hover:bg-[#a4c9b5] font-semibold"
                  >
                    {isSubmitting ? "Creating..." : "Submit Proposal"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setShowCreateProposal(false)}
                    className="flex-1 bg-[#546054b0] text-[#8daa98] hover:bg-[#3a3f3a] font-semibold"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </>
      )}

      {/* Proposals List */}
      <div>
        <h3 className="text-lg font-medium text-[#8daa98] mb-4">Proposals ({proposalCountNum})</h3>

        {loadingProposals ? (
          <Card className="bg-[#19242a] border-[#3e545f] p-6">
            <div className="text-center text-gray-400">
              <p>Loading proposals...</p>
            </div>
          </Card>
        ) : proposals.length > 0 ? (
          <div className="space-y-2">
            {proposals.map(proposal => (
              <ProposalCard
                key={Number(proposal.id)}
                title={proposal.title}
                proposalStatus={proposalStates[Number(proposal.id)] || ProposalState.Pending}
                onClick={() => handleOpenDrawer(proposal)}
              />
            ))}
          </div>
        ) : proposalCountNum === 0 ? (
          <Card className="bg-[#19242a] border-[#3e545f] p-6">
            <div className="text-center text-gray-400">
              <p>No proposals yet</p>
            </div>
          </Card>
        ) : (
          <Card className="bg-[#19242a] border-[#3e545f] p-6">
            <div className="text-center text-gray-400">
              <p>Unable to load proposal details</p>
            </div>
          </Card>
        )}
      </div>

      {/* Voting Power Info */}
      <Card className="bg-[#11181C] border-[#24353d] p-4">
        <div className="text-xs text-[#546054b0] mb-1">Your Voting Power</div>
        <div className="text-lg text-[#8daa98] font-semibold">{formattedVotingPower.toFixed(2)}</div>
      </Card>

      {/* Proposal Drawer */}
      {selectedProposal && (
        <ProposalDrawer
          isOpen={openDrawerProposalId !== null}
          onClose={handleCloseDrawer}
          proposalId={selectedProposal.id}
          daoAddress={daoAddress}
          title={selectedProposal.title}
          description={selectedProposal.description}
          proposer={selectedProposal.proposer}
          startTime={selectedProposal.startTime}
          endTime={selectedProposal.endTime}
          forVotes={selectedProposal.forVotes}
          againstVotes={selectedProposal.againstVotes}
          abstainVotes={selectedProposal.abstainVotes}
          connectedAddress={connectedAddress}
          proposalStatus={proposalStates[Number(selectedProposal.id)] || ProposalState.Pending}
          quorumPercentage={quorumPercentage ? Number(quorumPercentage) : undefined}
          majorityPercentage={majorityPercentage ? Number(majorityPercentage) : undefined}
          totalSupply={totalSupply as bigint | undefined}
          onVoteSubmitted={handleVoteSubmitted}
        />
      )}
    </div>
  );
}
