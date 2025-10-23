"use client";

import { useState } from "react";
import Image from "next/image";
import { BorrowInterface } from "./borrow-interface";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import { Button } from "~~/components/ui/button";
import { Skeleton } from "~~/components/ui/skeleton";
import externalContracts from "~~/contracts/externalContracts";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { formatAmount } from "~~/lib/utils";
import { ICampaign } from "~~/types/interface";

export function DepositSidebar({ campaign }: { campaign: ICampaign | undefined }) {
  const { address: connectedAddress } = useAccount();
  const [amount, setAmount] = useState<number>(0);
  const { writeContractAsync: writeYourContractAsync } = useScaffoldWriteContract({ contractName: "Launchpad" });
  const { writeContractAsync: approveTokenAsync } = useScaffoldWriteContract({ contractName: "USDC" });
  const contractAddress = externalContracts[296].Launchpad.address;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(Number(value));
    }
  };

  // Convert amount to BigInt with proper decimal handling for USDC (6 decimals)
  const amountInWei = amount > 0 ? BigInt(Math.floor(amount * 10 ** 6)) : 0n;
  const amountToApprove = 6000000000000;

  const { data: purchaseReturn } = useScaffoldReadContract({
    contractName: "LaunchpadV2",
    functionName: "previewPurchase",
    args: [campaign?.id || 0, amountInWei],
  });

  const buyTokens = async () => {
    const toastId = toast.loading("Buying tokens...", {
      position: "top-right",
    });

    if (amount === 0) {
      toast.error("Amount must be greater than 0", {
        id: toastId,
        position: "top-right",
      });
      return;
    }

    // Check if we have sufficient USDC balance
    if (amountInWei > (usdcBalance ?? 0n)) {
      toast.error("Insufficient USDC balance", {
        id: toastId,
        position: "top-right",
      });
      return;
    }

    try {
      // Check if we need to approve more USDC
      if (amountInWei > (usdcAllowance ?? 0n)) {
        console.log("Approving USDC...", {
          amountInWei: amountInWei.toString(),
          amountToApprove: amountToApprove.toString(),
          currentAllowance: usdcAllowance?.toString() || "0",
          contractAddress,
        });
        await approveUsdc();
        toast.success("USDC approved successfully", {
          id: toastId,
          position: "top-right",
        });
      }

      console.log("Buying tokens...", {
        campaignId: campaign?.id,
        amountInWei: amountInWei.toString(),
        contractAddress,
      });
      await depositUsdc();
      toast.success("Tokens purchased successfully!", {
        id: toastId,
        position: "top-right",
      });
    } catch (error: any) {
      console.error("Error buying tokens:", error);
      toast.error(error.message || "Error buying tokens", {
        id: toastId,
        position: "top-right",
      });
    }
  };

  const depositUsdc = async () => {
    try {
      // Try with gas estimation first, fallback to fixed gas if it fails
      try {
        await writeYourContractAsync({
          functionName: "buyTokens",
          args: [campaign?.id || 0, amountInWei],
        });
      } catch (gasError) {
        console.log("Gas estimation failed, using fixed gas limit:", gasError);
        await writeYourContractAsync({
          functionName: "buyTokens",
          args: [campaign?.id || 0, amountInWei],
          gas: 500000n, // Set a reasonable gas limit
        });
      }
    } catch (e) {
      console.error("Error buying tokens:", e);
      throw e; // Re-throw to be caught by the parent function
    }
  };

  const approveUsdc = async () => {
    try {
      // Try with gas estimation first, fallback to fixed gas if it fails
      try {
        await approveTokenAsync({
          functionName: "approve",
          args: [contractAddress, amountToApprove as unknown as bigint],
        });
      } catch (gasError) {
        console.log("Gas estimation failed for approval, using fixed gas limit:", gasError);
        await approveTokenAsync({
          functionName: "approve",
          args: [contractAddress, amountToApprove as unknown as bigint],
          gas: 100000n, // Set a reasonable gas limit for approval
        });
      }
    } catch (e) {
      console.error("Error approving USDC:", e);
      throw e; // Re-throw to be caught by the parent function
    }
  };

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

      <ConnectButton.Custom>
        {({ account, chain, openConnectModal, mounted }) => {
          const isConnected = mounted && account && chain;
          return isConnected ? (
            <Button onClick={buyTokens} className="text-center bg-[#546054b0] rounded-3xl py-7 w-full">
              <span className="text-gray-200 text-lg">{amount > 0 ? "Purchase" : "Enter an amount"}</span>
            </Button>
          ) : (
            <Button onClick={openConnectModal} className="text-center bg-[#546054b0] rounded-3xl py-7 w-full">
              <span className="text-gray-200 text-lg">Connect Wallet</span>
            </Button>
          );
        }}
      </ConnectButton.Custom>
    </div>
  );
}
