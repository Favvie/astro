"use client";

import React from "react";
import { ProposalStateType } from "./governance-utils";
import { StatusBadge } from "./status-badge";
import { Card } from "~~/components/ui/card";

interface ProposalCardProps {
  title: string;
  proposalStatus: ProposalStateType | string;
  onClick: () => void;
}

export function ProposalCard({ title, proposalStatus, onClick }: ProposalCardProps) {
  return (
    <Card
      onClick={onClick}
      className="bg-[#19242a] border-[#3e545f] hover:bg-[#1f2a30] cursor-pointer transition-colors"
    >
      <div className="p-3 flex items-center justify-between gap-4">
        <h4 className="text-sm font-semibold text-white truncate flex-1">{title}</h4>
        <StatusBadge status={proposalStatus} />
      </div>
    </Card>
  );
}
