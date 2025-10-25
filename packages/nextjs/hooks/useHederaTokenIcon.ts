import { useEffect, useState } from "react";

interface HederaTokenIconResult {
  iconUrl: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useHederaTokenIcon(fileId?: string): HederaTokenIconResult {
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fileId) {
      setIconUrl(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const fetchTokenIcon = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/get-hedera-file?fileId=${fileId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch token icon");
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to fetch token icon");
        }

        // Convert base64 to data URL
        const dataUrl = `data:${data.contentType};base64,${data.contents}`;
        setIconUrl(dataUrl);
      } catch (err) {
        console.error("Error fetching token icon:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setIconUrl(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokenIcon();
  }, [fileId]);

  return { iconUrl, isLoading, error };
}
