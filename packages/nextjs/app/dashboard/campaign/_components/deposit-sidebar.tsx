"use client";

import { useState } from "react";
import Image from "next/image";
import { BorrowInterface } from "./borrow-interface";
import { useAccount } from "wagmi";
import { Button } from "~~/components/ui/button";
import { Skeleton } from "~~/components/ui/skeleton";
import externalContracts from "~~/contracts/externalContracts";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { formatAmount } from "~~/lib/utils";
import { ICampaign } from "~~/types/interface";

export function DepositSidebar({ campaign }: { campaign: ICampaign | undefined }) {
  const { address: connectedAddress } = useAccount();
  const [amount, setAmount] = useState<number>(0);

  const contractAddress = externalContracts[296].Launchpad.address;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(Number(value));
    }
  };

  // Convert amount to BigInt with proper decimal handling for USDC (6 decimals)
  const amountInWei = amount > 0 ? BigInt(Math.floor(amount * 10 ** 6)) : 0n;

  const { data: purchaseReturn } = useScaffoldReadContract({
    contractName: "LaunchpadV2",
    functionName: "previewPurchase",
    args: [campaign?.id || 0, amountInWei],
  });

  const { data: usdcBalance } = useScaffoldReadContract({
    contractName: "USDC",
    functionName: "balanceOf",
    args: [connectedAddress],
  });

  const { data: usdcAllowance } = useScaffoldReadContract({
    contractName: "USDC",
    functionName: "allowance",
    args: [connectedAddress, contractAddress],
  });

  const formattedUsdcAmount = Number(usdcBalance ?? 0n) / 10 ** 6;
  const formattedTokenAmount = Number(purchaseReturn ?? 0n) / 10 ** 18;

  const handleMaxClick = () => {
    setAmount(formattedUsdcAmount);
  };

  if (!campaign) {
    return <Skeleton className="h-[700px] w-[400px] bg-[#11181C] rounded-2xl" />;
  }

  return campaign.isFundingComplete ? (
    <BorrowInterface campaign={campaign} />
  ) : (
    <div className="w-full max-w-md space-y-4">
      {/* Main Deposit Card */}
      <div className="bg-[#11181C] rounded-3xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-gray-300 text-lg font-medium">Deposit USDC</h2>
          <Image src="/usdc.svg" alt="USDC" width={16} height={16} className="w-5 h-5" />
        </div>

        <input
          type="text"
          value={amount}
          onChange={handleAmountChange}
          placeholder="0.00"
          className="text-6xl font-light text-gray-300 mb-6 bg-transparent border-none outline-none w-full placeholder-gray-500"
        />

        <div className="flex items-center justify-between">
          <span className="text-gray-500 text-lg">${Number(formattedUsdcAmount)?.toFixed(2)}</span>
          <div className="flex items-center gap-3">
            <span className="text-gray-400">{Number(amount).toFixed(2)} USDC</span>
            <Button
              onClick={handleMaxClick}
              className="bg-[#546054b0] hover:bg-gray-600 text-gray-300 px-4 py-1 h-8 text-sm rounded-full"
            >
              MAX
            </Button>
          </div>
        </div>
      </div>

      {/* Details Card */}
      <div className="bg-[#11181C] rounded-3xl p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/usdc.svg" alt="USDC" width={16} height={16} className="w-5 h-5" />
            <span className="text-gray-300">Deposit (USDC)</span>
          </div>
          <span className="text-gray-300">{amount.toFixed(2)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-400">Platform OG points</span>
          <div className="flex items-center gap-2">
            <div className="flex">
              <span className="text-blue-400">✨</span>
              <span className="text-blue-400">✨</span>
            </div>
            <span className="text-blue-400 font-medium">{campaign.promotionalOgPoints}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-400">Minimum expected tokens</span>
          <span className="text-gray-300">{formattedTokenAmount.toFixed(2)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-400">Available for sale</span>
          <span className="text-gray-300">${formatAmount(campaign.tokensForSale)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-400">USDC Allowance</span>
          <span className="text-gray-300">
            {usdcAllowance ? (Number(usdcAllowance) / 10 ** 6).toFixed(2) : "0.00"} USDC
          </span>
        </div>
      </div>
    </div>
  );
}
