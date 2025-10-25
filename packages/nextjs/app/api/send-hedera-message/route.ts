import { NextRequest, NextResponse } from "next/server";
import { Client, TopicMessageSubmitTransaction } from "@hashgraph/sdk";

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

interface MessagePayload {
  topicId: string;
  messageText: string;
  senderAddress: string;
  displayName: string;
}

async function publishMessage(payload: MessagePayload): Promise<{ sequenceNumber: number; timestamp: string }> {
  const client = initializeClient();

  try {
    // Create message structure
    const message = {
      text: payload.messageText,
      senderAddress: payload.senderAddress,
      displayName: payload.displayName,
      timestamp: new Date().toISOString(),
    };

    const messageString = JSON.stringify(message);

    // Submit message to topic
    const transactionResponse = await new TopicMessageSubmitTransaction()
      .setTopicId(payload.topicId)
      .setMessage(messageString)
      .execute(client);

    const receipt = await transactionResponse.getReceipt(client);

    return {
      sequenceNumber: receipt.topicSequenceNumber?.toNumber() || 0,
      timestamp: new Date().toISOString(),
    };
  } finally {
    client.close();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topicId, messageText, senderAddress, displayName } = body;

    // Validation
    if (!topicId || !messageText || !senderAddress || !displayName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (messageText.trim().length === 0) {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
    }

    const result = await publishMessage({
      topicId,
      messageText,
      senderAddress,
      displayName,
    });

    return NextResponse.json({
      success: true,
      sequenceNumber: result.sequenceNumber,
      timestamp: result.timestamp,
    });
  } catch (error) {
    console.error("Error publishing message to Hedera:", error);
    return NextResponse.json(
      {
        error: "Failed to publish message",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
