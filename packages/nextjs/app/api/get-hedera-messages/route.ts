import { NextRequest, NextResponse } from "next/server";

interface HederaMessage {
  sequence_number: number;
  consensus_timestamp: string;
  message: string; // Base64 encoded
}

interface ParsedMessage {
  text: string;
  senderAddress: string;
  displayName: string;
  timestamp: string;
  hederaSequenceNumber: number;
  hederaTimestamp: string;
}

function decodeMessage(base64Message: string): Partial<ParsedMessage> | null {
  try {
    const decodedString = Buffer.from(base64Message, "base64").toString("utf-8");
    return JSON.parse(decodedString);
  } catch (error) {
    console.error("Error decoding message:", error);
    return null;
  }
}

async function fetchMessagesFromMirrorNode(topicId: string, limit: number = 100): Promise<ParsedMessage[]> {
  const mirrorNodeUrl = `https://testnet.mirrornode.hedera.com/api/v1/topics/${topicId}/messages?limit=${limit}&order=asc`;

  const response = await fetch(mirrorNodeUrl);

  if (!response.ok) {
    throw new Error(`Mirror Node API error: ${response.statusText}`);
  }

  const data = (await response.json()) as {
    messages: HederaMessage[];
  };

  // Parse and format messages
  const messages: ParsedMessage[] = data.messages
    .map(hederaMsg => {
      const decoded = decodeMessage(hederaMsg.message);
      if (!decoded || !decoded.text || !decoded.senderAddress) {
        return null;
      }

      return {
        text: decoded.text || "",
        senderAddress: decoded.senderAddress || "",
        displayName: decoded.displayName || "Unknown",
        timestamp: decoded.timestamp || new Date().toISOString(),
        hederaSequenceNumber: hederaMsg.sequence_number,
        hederaTimestamp: hederaMsg.consensus_timestamp,
      };
    })
    .filter((msg): msg is ParsedMessage => msg !== null);

  return messages;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const topicId = searchParams.get("topicId");
    const limit = parseInt(searchParams.get("limit") || "100");

    if (!topicId) {
      return NextResponse.json({ error: "Missing topicId parameter" }, { status: 400 });
    }

    if (limit < 1 || limit > 1000) {
      return NextResponse.json({ error: "Limit must be between 1 and 1000" }, { status: 400 });
    }

    const messages = await fetchMessagesFromMirrorNode(topicId, limit);

    return NextResponse.json({
      success: true,
      messages,
      count: messages.length,
    });
  } catch (error) {
    console.error("Error fetching messages from Hedera:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch messages",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
