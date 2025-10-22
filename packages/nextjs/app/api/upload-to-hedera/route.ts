import { NextRequest, NextResponse } from "next/server";
import { Client, FileAppendTransaction, FileCreateTransaction, Hbar, PrivateKey } from "@hashgraph/sdk";
import { unlinkSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const CHUNK_SIZE = 1024; // 1KB chunks for Hedera

export async function POST(request: NextRequest) {
  try {
    console.log("Starting file processing");
    const formData = await request.formData();
    const file = formData.get("file") as File;

    console.log("File data:", file);

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum of 10MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB` },
        { status: 400 },
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    // Environment variables (store these securely)
    const operatorId = process.env.NEXT_PUBLIC_HEDERA_ACCOUNT_ID;
    const operatorKey = process.env.HEDERA_OPERATOR_KEY;

    if (!operatorId || !operatorKey) {
      return NextResponse.json({ error: "Missing Hedera credentials" }, { status: 500 });
    }

    // Create Hedera client
    const client = Client.forTestnet().setOperator(operatorId, operatorKey);

    // Generate file key for access control
    const fileKey = PrivateKey.generateED25519();

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileContents = Buffer.from(arrayBuffer);

    // Save to temporary file
    const tempFilePath = join(tmpdir(), `hedera-upload-${Date.now()}-${file.name}`);
    writeFileSync(tempFilePath, fileContents);

    console.log("Temp file path:", tempFilePath);

    let fileId: string;

    try {
      console.log("Starting file creation");
      if (fileContents.length <= CHUNK_SIZE) {
        // File is small enough, create directly
        fileId = await createFile(client, fileContents, file.name, fileKey);
      } else {
        // File is larger, use create + append pattern
        fileId = await createAndAppendFile(client, fileContents, file.name, fileKey);
      }

      console.log(`File uploaded successfully: ${fileId}`);

      return NextResponse.json({
        success: true,
        fileId,
        fileKeyPrivate: fileKey.toStringRaw(), // Store this securely in production
        fileKeyPublic: fileKey.publicKey.toStringRaw(),
      });
    } finally {
      // Clean up temp file
      try {
        unlinkSync(tempFilePath);
      } catch (cleanupError) {
        console.warn("Failed to cleanup temp file:", cleanupError);
      }
    }
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error: "Upload failed",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

async function createFile(client: Client, contents: Buffer, fileName: string, fileKey: PrivateKey): Promise<string> {
  const transaction = await new FileCreateTransaction()
    .setKeys([fileKey.publicKey])
    .setContents(contents)
    .setFileMemo(fileName)
    .setMaxTransactionFee(new Hbar(2))
    .freezeWith(client);

  const signTx = await transaction.sign(fileKey);
  const submitTx = await signTx.execute(client);
  const receipt = await submitTx.getReceipt(client);

  return receipt.fileId?.toString() || "";
}

async function createAndAppendFile(
  client: Client,
  contents: Buffer,
  fileName: string,
  fileKey: PrivateKey,
): Promise<string> {
  // Create file with first chunk
  const firstChunk = contents.subarray(0, CHUNK_SIZE);
  const fileId = await createFile(client, firstChunk, fileName, fileKey);

  // Append remaining chunks
  const remainingContent = contents.subarray(CHUNK_SIZE);
  const chunks = [];

  for (let i = 0; i < remainingContent.length; i += CHUNK_SIZE) {
    chunks.push(remainingContent.subarray(i, i + CHUNK_SIZE));
  }

  for (const chunk of chunks) {
    const appendTx = await new FileAppendTransaction()
      .setFileId(fileId)
      .setContents(chunk)
      .setMaxTransactionFee(new Hbar(2))
      .freezeWith(client);

    const signedAppendTx = await appendTx.sign(fileKey);
    await signedAppendTx.execute(client);
  }

  return fileId;
}
