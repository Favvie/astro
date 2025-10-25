import { NextRequest, NextResponse } from "next/server";
import { Client, TopicCreateTransaction } from "@hashgraph/sdk";

// Initialize Hedera client
const initializeClient = () => {
  const accountId = process.env.NEXT_PUBLIC_HEDERA_ACCOUNT_ID;
  const privateKey = process.env.HEDERA_OPERATOR_KEY;

  if (!accountId || !privateKey) {
    throw new Error("Hedera credentials not configured");
  }

  const client = Client.forTestnet();
  client.setOperator(accountId, privateKey);
  return client;
};

// Create a Hedera Consensus Service topic
async function createTopic(memo: string): Promise<string> {
  const client = initializeClient();

  try {
    const transactionResponse = await new TopicCreateTransaction().setTopicMemo(memo).execute(client);

    const receipt = await transactionResponse.getReceipt(client);

    if (!receipt.topicId) {
      throw new Error("Failed to create topic - no topic ID returned");
    }

    return receipt.topicId.toString();
  } finally {
    client.close();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaignId, campaignName } = body;

    if (!campaignId || !campaignName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const memo = `Campaign DAO: ${campaignName} (ID: ${campaignId})`;
    const topicId = await createTopic(memo);

    return NextResponse.json({ topicId });
  } catch (error) {
    console.error("Error creating Hedera topic:", error);
    return NextResponse.json(
      { error: "Failed to create Hedera topic", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
