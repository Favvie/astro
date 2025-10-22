import { useCallback, useState } from "react";

interface UseHederaFileUploadState {
  fileId: string | null;
  loading: boolean;
  error: string | null;
}

interface UseHederaFileUploadReturn extends UseHederaFileUploadState {
  uploadFile: (file: File) => Promise<string>;
  reset: () => void;
}

/**
 * Hook for uploading files to Hedera File Service
 * @returns Object with upload function, file ID, loading state, and error
 */
export const useHederaFileUpload = (): UseHederaFileUploadReturn => {
  const [fileId, setFileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(async (file: File): Promise<string> => {
    setLoading(true);
    setError(null);

    try {
      // Call the server-side API route to upload the file
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload-to-hedera", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload file");
      }

      const data = await response.json();
      const uploadedFileId = data.fileId;

      setFileId(uploadedFileId);
      return uploadedFileId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to upload file";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setFileId(null);
    setError(null);
  }, []);

  return {
    fileId,
    loading,
    error,
    uploadFile,
    reset,
  };
};
