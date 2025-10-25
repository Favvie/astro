import { NextRequest, NextResponse } from "next/server";
import { Client, FileContentsQuery } from "@hashgraph/sdk";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 });
    }

    // Environment variables
    const operatorId = process.env.NEXT_PUBLIC_HEDERA_ACCOUNT_ID;
    const operatorKey = process.env.HEDERA_OPERATOR_KEY;

    if (!operatorId || !operatorKey) {
      return NextResponse.json({ error: "Missing Hedera credentials" }, { status: 500 });
    }

    // Create Hedera client
    const client = Client.forTestnet().setOperator(operatorId, operatorKey);

    // Query file contents
    const query = new FileContentsQuery().setFileId(fileId);

    const contents = await query.execute(client);

    // Convert contents to base64 for transmission
    const base64Contents = Buffer.from(contents).toString("base64");

    // Determine content type based on file signature
    const contentType = getContentType(contents);

    return NextResponse.json({
      success: true,
      fileId,
      contents: base64Contents,
      contentType,
    });
  } catch (error: any) {
    console.error("Fetch error:", error);
    return NextResponse.json(
      {
        error: "Fetch failed",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

// Helper function to determine content type from file signature
function getContentType(buffer: Uint8Array): string {
  // Check file signatures (magic numbers)
  const signatures: { [key: string]: number[] } = {
    "image/png": [0x89, 0x50, 0x4e, 0x47],
    "image/jpeg": [0xff, 0xd8, 0xff],
    "image/gif": [0x47, 0x49, 0x46],
    "image/webp": [0x52, 0x49, 0x46, 0x46],
    "image/svg+xml": [0x3c, 0x73, 0x76, 0x67], // <svg
  };

  for (const [contentType, signature] of Object.entries(signatures)) {
    if (signature.every((byte, index) => buffer[index] === byte)) {
      return contentType;
    }
  }

  // Default to octet-stream if unknown
  return "application/octet-stream";
}
