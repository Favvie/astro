import { NextRequest, NextResponse } from "next/server";
import { Client, FileContentsQuery, FileInfoQuery } from "@hashgraph/sdk";

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
    const contentsQuery = new FileContentsQuery().setFileId(fileId);
    const contents = await contentsQuery.execute(client);

    // Try to get file info (which includes memo with filename)
    let fileName: string | null = null;
    try {
      const fileInfoQuery = new FileInfoQuery().setFileId(fileId);
      const fileInfo = await fileInfoQuery.execute(client);
      fileName = fileInfo.fileMemo;
    } catch (err) {
      // File info query might fail, continue with signature detection
      console.warn("Could not retrieve file info:", err);
    }

    // Convert contents to base64 for transmission
    const base64Contents = Buffer.from(contents).toString("base64");

    // Determine content type - first try filename, then file signature
    const contentType = fileName ? getContentTypeFromFileName(fileName) : getContentTypeFromSignature(contents);

    return NextResponse.json({
      success: true,
      fileId,
      contents: base64Contents,
      contentType,
      fileName: fileName || undefined,
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

// Determine content type from file extension
function getContentTypeFromFileName(fileName: string): string {
  const extensionMap: { [key: string]: string } = {
    ".pdf": "application/pdf",
    ".txt": "text/plain",
    ".md": "text/markdown",
    ".json": "application/json",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".csv": "text/csv",
    ".xml": "application/xml",
    ".html": "text/html",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
  };

  const extension = fileName.toLowerCase().match(/\.[^.]*$/)?.[0] || "";
  return extensionMap[extension] || getContentTypeFromSignature(new Uint8Array());
}

// Helper function to determine content type from file signature (fallback)
function getContentTypeFromSignature(buffer: Uint8Array): string {
  // Check file signatures (magic numbers)
  const signatures: { [key: string]: number[] } = {
    "application/pdf": [0x25, 0x50, 0x44, 0x46], // %PDF
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
