/**
 * Governance Tab Utilities
 * Helper functions for formatting, calculations, and status management
 */

// Proposal state enum (matches contract)
export enum ProposalState {
  Pending = "Pending",
  Active = "Active",
  Defeated = "Defeated",
  Succeeded = "Succeeded",
  Executed = "Executed",
}

export type ProposalStateType = keyof typeof ProposalState;

/**
 * Get styling for status badge
 */
export const getStatusBadgeStyle = (status: ProposalStateType | string) => {
  const styles: Record<string, { bg: string; text: string }> = {
    Pending: { bg: "bg-gray-600", text: "text-gray-100" },
    Active: { bg: "bg-blue-600", text: "text-blue-100" },
    Defeated: { bg: "bg-red-600", text: "text-red-100" },
    Succeeded: { bg: "bg-green-600", text: "text-green-100" },
    Executed: { bg: "bg-purple-600", text: "text-purple-100" },
  };

  return styles[status] || styles.Pending;
};

/**
 * Format timestamp to readable time remaining
 */
export const formatTimeRemaining = (endTime: number): string => {
  const now = Math.floor(Date.now() / 1000);
  const remaining = endTime - now;

  if (remaining <= 0) return "Voting ended";

  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
};

/**
 * Format timestamp to readable date
 */
export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Calculate percentage of votes
 */
export const calculateVotePercentage = (voteCount: number, totalVotes: number): number => {
  if (totalVotes === 0) return 0;
  return (voteCount / totalVotes) * 100;
};

/**
 * Check if voting is still active
 */
export const isVotingActive = (endTime: number): boolean => {
  return Math.floor(Date.now() / 1000) <= endTime;
};

/**
 * Check if proposal is in final state
 */
export const isFinalState = (status: ProposalStateType | string): boolean => {
  return status === ProposalState.Defeated || status === ProposalState.Succeeded || status === ProposalState.Executed;
};

/**
 * Format large numbers with abbreviations
 */
export const formatVoteCount = (count: number | bigint): string => {
  const num = typeof count === "bigint" ? Number(count) : count;
  const formatted = (num / 10 ** 18).toFixed(2);
  return formatted;
};

/**
 * Calculate quorum status
 */
export const calculateQuorumStatus = (
  totalVotes: number | bigint,
  totalSupply: number | bigint,
  quorumPercentage: number,
): { met: boolean; percentage: number } => {
  const votes = typeof totalVotes === "bigint" ? Number(totalVotes) : totalVotes;
  const supply = typeof totalSupply === "bigint" ? Number(totalSupply) : totalSupply;

  if (supply === 0) return { met: false, percentage: 0 };

  const percentage = (votes / supply) * 100;

  return {
    met: votes * 10000 >= supply * quorumPercentage,
    percentage,
  };
};

/**
 * Calculate majority status
 */
export const calculateMajorityStatus = (
  forVotes: number | bigint,
  againstVotes: number | bigint,
  majorityPercentage: number,
): { met: boolean; percentage: number } => {
  const forVotesNum = typeof forVotes === "bigint" ? Number(forVotes) : forVotes;
  const againstVotesNum = typeof againstVotes === "bigint" ? Number(againstVotes) : againstVotes;

  const totalDecisive = forVotesNum + againstVotesNum;

  if (totalDecisive === 0) return { met: false, percentage: 0 };

  const percentage = (forVotesNum / totalDecisive) * 100;

  return {
    met: forVotesNum * 10000 >= totalDecisive * majorityPercentage,
    percentage,
  };
};
