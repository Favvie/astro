"use client";

import { useState } from "react";
import { Download, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~~/components/ui/alert-dialog";
import { Button } from "~~/components/ui/button";
import { Skeleton } from "~~/components/ui/skeleton";

interface WhitepaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  whitepaperUrl: string | null;
  fileName: string;
  contentType: string | null;
  onDownload: () => void;
}

export function WhitepaperModal({
  isOpen,
  onClose,
  whitepaperUrl,
  fileName,
  contentType,
  onDownload,
}: WhitepaperModalProps) {
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  const renderContent = () => {
    if (!whitepaperUrl) {
      return (
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-400">Unable to load whitepaper</p>
        </div>
      );
    }

    // PDF - use iframe
    if (contentType === "application/pdf") {
      return (
        <div className="w-full h-96 bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
          <iframe
            src={whitepaperUrl}
            className="w-full h-full"
            title="Whitepaper PDF"
            onLoad={() => setIsLoadingContent(false)}
          />
        </div>
      );
    }

    // Images
    if (contentType?.startsWith("image/")) {
      return (
        <div className="w-full flex justify-center bg-gray-900 rounded-lg overflow-hidden border border-gray-700 p-4">
          <img
            src={whitepaperUrl}
            alt="Whitepaper"
            className="max-h-96 max-w-full object-contain rounded"
            onLoad={() => setIsLoadingContent(false)}
          />
        </div>
      );
    }

    // Text files
    if (contentType?.startsWith("text/") || contentType === "application/json") {
      return (
        <div className="w-full bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
          <iframe
            src={whitepaperUrl}
            className="w-full h-96"
            title="Whitepaper Text"
            onLoad={() => setIsLoadingContent(false)}
          />
        </div>
      );
    }

    // Other file types - show generic viewer
    return (
      <div className="w-full h-96 bg-gray-900 rounded-lg border border-gray-700 flex flex-col items-center justify-center gap-4">
        <div className="text-center">
          <p className="text-gray-300 font-semibold mb-2">Document Preview</p>
          <p className="text-gray-400 text-sm mb-4">Click download to view this file</p>
          <p className="text-gray-500 text-xs">Format: {contentType || "unknown"}</p>
        </div>
      </div>
    );
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-3xl bg-[#0F172A] border-gray-700 max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-700">
          <div className="flex-1">
            <AlertDialogTitle className="text-white text-lg">{fileName}</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400 text-sm mt-1">
              {contentType && <span>Format: {contentType}</span>}
            </AlertDialogDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white hover:bg-gray-800 h-8 w-8 p-0"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </AlertDialogHeader>

        <div className="py-4">
          {isLoadingContent && <Skeleton className="w-full h-96 bg-[#11181C] rounded-lg" />}
          {renderContent()}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
          <Button
            variant="outline"
            size="sm"
            className="bg-gray-900/30 text-gray-300 border-gray-700 hover:bg-gray-900/50 hover:text-white"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            size="sm"
            className="bg-blue-900/50 text-blue-300 hover:bg-blue-900/70 hover:text-blue-200 gap-2"
            onClick={onDownload}
          >
            <Download className="w-4 h-4" />
            Download
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
