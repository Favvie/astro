"use client";

import { useState } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "~~/components/ui/button";
import { cn } from "~~/lib/utils";

interface FileUploadInputProps {
  onChange: (file: File | null) => void;
  acceptTypes?: string;
  files: File[];
  onRemove?: () => void;
  uploadStatus?: "idle" | "uploading" | "success" | "error";
  disabled?: boolean;
  maxSizeInMB?: number;
  onSizeError?: (message: string) => void;
}

export const FileUploadInput = ({
  onChange,
  acceptTypes = "image/*,.pdf,.doc,.docx,.txt",
  files,
  onRemove,
  uploadStatus = "idle",
  disabled = false,
  maxSizeInMB,
  onSizeError,
}: FileUploadInputProps) => {
  const [dragging, setDragging] = useState(false);

  const validateFileSize = (file: File): boolean => {
    if (!maxSizeInMB) return true;

    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > maxSizeInMB) {
      const errorMessage = `File size exceeds ${maxSizeInMB}MB limit`;
      onSizeError?.(errorMessage);
      return false;
    }
    return true;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (validateFileSize(selectedFile)) {
        onChange(selectedFile);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const selectedFile = droppedFiles[0];
    if (selectedFile && validateFileSize(selectedFile)) {
      onChange(selectedFile);
    }
  };

  const removeFile = () => {
    onChange(null);
    onRemove?.();
  };

  return (
    <div
      className={cn(
        "border border-dashed rounded-lg p-2 text-center cursor-pointer relative transition-colors",
        dragging
          ? "border-[#8daa98] dark:border-[#8daa98]/80 bg-[#8daa98]/10"
          : "border-gray-100 dark:border-gray-800 hover:border-[#8daa98]",
        disabled && "opacity-50 cursor-not-allowed",
      )}
      onDragOver={!disabled ? handleDragOver : undefined}
      onDragLeave={!disabled ? handleDragLeave : undefined}
      onDrop={!disabled ? handleDrop : undefined}
    >
      <input
        type="file"
        onChange={handleFileChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        accept={acceptTypes}
        disabled={disabled}
      />
      <div className="flex flex-col items-center gap-2">
        <Upload className="h-6 w-6 text-gray-400" />
        <p className="text-xs text-gray-400">
          {files.length > 0 ? `${files[0].name} selected` : "Drop a file here or click to upload"}
        </p>
        {uploadStatus === "success" && <p className="text-xs text-green-600">File uploaded successfully</p>}
        {uploadStatus === "uploading" && <p className="text-xs text-[#8daa98]">Uploading...</p>}
        {uploadStatus === "error" && <p className="text-xs text-red-600">Upload failed</p>}
      </div>
      {files.length > 0 && (
        <div className="mt-4">
          <div className="text-sm text-gray-400 flex items-center justify-center gap-2">
            <span>{files[0].name}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-200"
              onClick={() => removeFile()}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
