"use client";

import { DepositSidebar } from "../_components/deposit-sidebar";
import { VaultHeader } from "../_components/vault-header";
import { VaultTabs } from "../_components/vault-tabs";
import { Button } from "~~/components/ui/button";

export default function VaultPage() {
  return (
    <>
      <div className="pb-2 pt-4 pl-5">
        <Button
          variant="ghost"
          size="sm"
          className="bg-[#25333b] hover:bg-[#25333b]/70 text-gray-400 hover:text-white rounded-3xl px-8"
          onClick={() => window.history.back()}
        >
          Back
        </Button>
      </div>
      <div className="p-1.5 space-y-8 bg-[#070907] m-2 sm:m-4 rounded-2xl h-full">
        <div className="sm:flex">
          <div className="flex-1 p-1 sm:p-6 h-full">
            <div className="p-2 sm:p-0">
              <VaultHeader />
            </div>
            <VaultTabs />
          </div>
          <div className="p-1 sm:p-6">
            <DepositSidebar />
          </div>
        </div>
      </div>
    </>
  );
}
