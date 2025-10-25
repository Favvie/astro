import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { CampaignDAOABI } from "~~/app/dashboard/campaign/_components/utils/campaignDAOABI";
import { Hedera } from "~~/utils/CustomChains";

const STATE_NAMES = ["Pending", "Active", "Defeated", "Succeeded", "Executed"];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const daoAddress = searchParams.get("daoAddress") as `0x${string}` | null;
    const proposalId = searchParams.get("proposalId");

    if (!daoAddress || !proposalId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    // Create public client for Hedera testnet
    const client = createPublicClient({
      chain: Hedera,
      transport: http("https://testnet.hashio.io/api"),
    });

    // Fetch proposal data
    const proposalResult = await client.readContract({
      address: daoAddress,
      abi: CampaignDAOABI,
      functionName: "getProposal",
      args: [BigInt(proposalId)],
    });

    // Fetch proposal state
    const stateNum = await client.readContract({
      address: daoAddress,
      abi: CampaignDAOABI,
      functionName: "getProposalState",
      args: [BigInt(proposalId)],
    });

    // Access struct properties by name (Viem returns structs as objects, not arrays)
    const proposal = proposalResult as any;

    const stateIndex = Number(stateNum);
    const state = STATE_NAMES[stateIndex] || "Unknown";

    // Convert BigInt values to strings for JSON serialization
    return NextResponse.json({
      proposal: {
        id: proposal.id?.toString(),
        proposer: proposal.proposer,
        title: proposal.title,
        description: proposal.description,
        startTime: proposal.startTime?.toString(),
        endTime: proposal.endTime?.toString(),
        forVotes: proposal.forVotes?.toString(),
        againstVotes: proposal.againstVotes?.toString(),
        abstainVotes: proposal.abstainVotes?.toString(),
        executed: proposal.executed,
      },
      state,
    });
  } catch (error) {
    console.error("Error fetching proposal:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch proposal",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
