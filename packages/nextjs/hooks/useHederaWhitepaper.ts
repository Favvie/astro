import { useEffect, useState } from "react";

interface HederaWhitepaperResult {
  whitepaperUrl: string | null;
  isLoading: boolean;
  error: string | null;
  downloadWhitepaper: () => void;
  fileName: string;
  contentType: string | null;
}

export function useHederaWhitepaper(fileId?: string, campaignName?: string): HederaWhitepaperResult {
  const [whitepaperUrl, setWhitepaperUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contentType, setContentType] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");

  useEffect(() => {
    if (!fileId) {
      setWhitepaperUrl(null);
      setIsLoading(false);
      setError(null);
      setContentType(null);
      return;
    }

    const fetchWhitepaper = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/get-hedera-file?fileId=${fileId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch whitepaper");
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to fetch whitepaper");
        }

        // Convert base64 to blob URL for better handling of PDFs and documents
        const binaryString = atob(data.contents);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const blob = new Blob([bytes], { type: data.contentType });
        const url = URL.createObjectURL(blob);

        setWhitepaperUrl(url);
        setContentType(data.contentType);

        // Generate file name based on content type
        const extension = getFileExtension(data.contentType);
        const name = campaignName ? `${campaignName}-whitepaper.${extension}` : `whitepaper-${fileId}.${extension}`;
        setFileName(name);
      } catch (err) {
        console.error("Error fetching whitepaper:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setWhitepaperUrl(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWhitepaper();

    // Cleanup blob URL on unmount
    return () => {
      if (whitepaperUrl) {
        URL.revokeObjectURL(whitepaperUrl);
      }
    };
  }, [fileId, campaignName]);

  const downloadWhitepaper = () => {
    if (!whitepaperUrl) return;

    const link = document.createElement("a");
    link.href = whitepaperUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return { whitepaperUrl, isLoading, error, downloadWhitepaper, fileName, contentType };
}

// Helper function to get file extension from content type
function getFileExtension(contentType: string): string {
  const typeMap: Record<string, string> = {
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "text/plain": "txt",
    "text/markdown": "md",
    "application/json": "json",
    "text/csv": "csv",
    "application/xml": "xml",
    "text/xml": "xml",
    "text/html": "html",
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/svg+xml": "svg",
  };

  // If it's octet-stream or unknown, try to infer from common defaults
  // Don't default to "pdf" as that breaks plain text files
  return typeMap[contentType] || "bin";
}
