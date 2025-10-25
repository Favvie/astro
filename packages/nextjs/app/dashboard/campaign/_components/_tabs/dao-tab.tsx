"use client";

import React, { useState } from "react";
import { ChatTab } from "./chat-tab";
import { GovernanceTab } from "./governance-tab";
import { Loader2, Vault } from "lucide-react";
import { zeroAddress } from "viem";
import { Button } from "~~/components/ui/button";
import { Card } from "~~/components/ui/card";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { ICampaign } from "~~/types/interface";

interface DaoTabProps {
  campaign: ICampaign | undefined;
  connectedAddress: `0x${string}` | undefined;
  daoAddress: `0x${string}` | undefined;
}

type SubTab = "chat" | "governance";

export function DaoTab({ campaign, connectedAddress, daoAddress }: DaoTabProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("chat");

  const { writeContractAsync: createDAOAsync } = useScaffoldWriteContract({
    contractName: "CampaignDAOFactory",
  });

  const { data: hederaTopicId } = useScaffoldReadContract({
    contractName: "CampaignDAOFactory",
    functionName: "hederaTopicIds",
    args: [BigInt(campaign?.id || 0)],
  });

  const isCreator = campaign?.creator === connectedAddress;
  const isDaoNotCreated = daoAddress === zeroAddress;

  const handleCreateDAO = async () => {
    if (!campaign || !connectedAddress) {
      console.error("Missing campaign or connected address");
      return;
    }

    setIsCreating(true);
    try {
      // Step 1: Create Hedera topic
      console.log("Creating Hedera topic...");
      const topicResponse = await fetch("/api/create-hedera-topic", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaignId: campaign.id,
          campaignName: campaign.name,
        }),
      });

      if (!topicResponse.ok) {
        const errorData = await topicResponse.json();
        throw new Error(`Failed to create Hedera topic: ${errorData.error}`);
      }

      const topicData = await topicResponse.json();
      const hederaTopicId = topicData.topicId;
      console.log("Hedera topic created:", hederaTopicId);

      // Step 2: Create DAO with the Hedera topic ID
      console.log("Creating DAO with Hedera topic...");
      await createDAOAsync({
        functionName: "createCampaignDAO",
        args: [
          campaign.tokenAddress as `0x${string}`,
          BigInt(campaign.id),
          hederaTopicId,
          campaign.creator as `0x${string}`,
          true,
        ],
      });
      console.log("DAO created successfully!");
    } catch (error) {
      console.error("Error creating DAO:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-8">
      {isDaoNotCreated ? (
        // No DAO - Show create card
        isCreator ? (
          <Card className="bg-[#19242a] border-[#3e545f] p-6">
            <div className="flex flex-col items-center gap-6">
              <div className="h-16 w-16 rounded-full flex justify-center items-center bg-[#546054b0] text-[#8daa98]">
                <Vault size={27} />
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="font-medium text-lg text-[#8daa98]">No DAO Created</div>
                <div className="text-[#546054b0] text-sm">Create a DAO to manage campaign governance</div>
              </div>
              <Button
                className="px-6 py-2 bg-[#8daa98] text-[#11181C] hover:bg-[#a4c9b5] rounded-md font-semibold transition-colors flex items-center gap-2"
                onClick={handleCreateDAO}
                disabled={isCreating}
              >
                {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                {isCreating ? "Creating..." : "Create DAO"}
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="bg-[#19242a] border-[#3e545f] p-6">
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full flex justify-center items-center bg-[#546054b0] text-[#8daa98]">
                <Vault size={27} />
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="font-medium text-lg text-[#8daa98]">No DAO Created</div>
                <div className="text-[#546054b0] text-sm">Waiting for campaign creator to create DAO</div>
              </div>
            </div>
          </Card>
        )
      ) : (
        // DAO Exists - Show header and sub-tabs
        <>
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-[#8daa98]">Campaign Governance</h3>
            <p className="text-sm text-[#546054b0]">
              DAO Address:{" "}
              <span className="text-white font-mono">
                {daoAddress?.slice(0, 6)}...{daoAddress?.slice(-4)}
              </span>
            </p>
            {hederaTopicId && <p className="text-xs text-gray-500">Topic ID: {hederaTopicId}</p>}
          </div>

          {/* Sub-Tab Navigation */}
          <div className="flex border-b border-gray-700 gap-6">
            {(["chat", "governance"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                className={`px-2 py-3 border-b-2 capitalize font-medium transition-colors ${
                  activeSubTab === tab
                    ? "border-[#8daa98] text-[#8daa98]"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Sub-Tab Content */}
          <div className="space-y-4">
            {activeSubTab === "chat" && <ChatTab topicId={hederaTopicId} connectedAddress={connectedAddress} />}
            {activeSubTab === "governance" && (
              <GovernanceTab connectedAddress={connectedAddress} daoAddress={daoAddress} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
