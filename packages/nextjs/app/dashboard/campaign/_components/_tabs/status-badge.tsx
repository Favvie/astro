"use client";

import React from "react";
import { ProposalStateType, getStatusBadgeStyle } from "./governance-utils";

interface StatusBadgeProps {
  status: ProposalStateType | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { bg, text } = getStatusBadgeStyle(status);

  return <span className={`px-3 py-1 rounded-full text-sm font-semibold ${bg} ${text}`}>{status}</span>;
}
