"use client";

import { useState } from "react";
import { WhitepaperModal } from "./WhitepaperModal";
import { Download, Eye, FileText } from "lucide-react";
import { Button } from "~~/components/ui/button";
import { Skeleton } from "~~/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "~~/components/ui/tooltip";
import { useHederaWhitepaper } from "~~/hooks/useHederaWhitepaper";

interface WhitepaperButtonProps {
  whitepaperFileId?: string;
  campaignName?: string;
}

export function WhitepaperButton({ whitepaperFileId, campaignName }: WhitepaperButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { whitepaperUrl, isLoading, error, downloadWhitepaper, fileName, contentType } = useHederaWhitepaper(
    whitepaperFileId,
    campaignName,
  );

  // Show skeleton while loading
  if (isLoading) {
    return <Skeleton className="h-9 w-32 bg-[#11181C] rounded-lg" />;
  }

  // Show error state
  if (error) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-900/20 text-red-400 border border-red-700/30 text-sm">
            <FileText className="w-4 h-4" />
            <span>Whitepaper unavailable</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-sm text-xs font-light text-gray-300 bg-[#11181C] px-3 py-2">
          {error}
        </TooltipContent>
      </Tooltip>
    );
  }

  // Show whitepaper button with view and download options
  if (whitepaperUrl) {
    return (
      <>
        <WhitepaperModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          whitepaperUrl={whitepaperUrl}
          fileName={fileName}
          contentType={contentType}
          onDownload={downloadWhitepaper}
        />
        <div className="flex items-center gap-2">
          {/* View Button - Opens modal */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="bg-blue-900/20 text-blue-300 border-blue-700/30 hover:bg-blue-900/40 hover:text-blue-200 gap-2"
                onClick={() => setIsModalOpen(true)}
              >
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">Whitepaper</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs font-light text-gray-300 bg-[#11181C] px-3 py-2">
              View whitepaper details
            </TooltipContent>
          </Tooltip>

          {/* Download Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white hover:bg-blue-900/20 px-2"
                onClick={downloadWhitepaper}
              >
                <Download className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs font-light text-gray-300 bg-[#11181C] px-3 py-2">
              Download {fileName}
            </TooltipContent>
          </Tooltip>
        </div>
      </>
    );
  }

  // Show "No whitepaper" indicator
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900/30 text-gray-400 border border-gray-700/30 text-sm">
          <FileText className="w-4 h-4" />
          <span className="hidden sm:inline">No whitepaper</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs font-light text-gray-300 bg-[#11181C] px-3 py-2">
        No whitepaper has been provided for this campaign
      </TooltipContent>
    </Tooltip>
  );
}
