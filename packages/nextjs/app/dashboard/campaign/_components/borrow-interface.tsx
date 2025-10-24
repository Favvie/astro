"use client";

import type React from "react";
import { useState } from "react";
import Image from "next/image";
import { usePoolPrice } from "./utils/pool-price";
import { Address } from "viem";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { Button } from "~~/components/ui/button";
import externalContracts from "~~/contracts/externalContracts";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { ICampaign, IStakingPool } from "~~/types/interface";

export function BorrowInterface({ campaign }: { campaign: ICampaign; stakingPool?: IStakingPool | undefined }) {
  const { address: connectedAddress, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<"trade" | "liquidity" | "stake">("trade");
  const [collateralAmount, setCollateralAmount] = useState("");
  const [borrowAmount, setBorrowAmount] = useState("");

  // const [swapDirection, setSwapDirection] = useState<"token-to-usdc" | "usdc-to-token">("token-to-usdc");

  const { writeContractAsync: approveAsync } = useWriteContract();
  const { writeContractAsync: writeYourContractAsync } = useScaffoldWriteContract({ contractName: "LaunchpadV2" });

  const contractAddress = externalContracts[296].LaunchpadV2.address;
  const { currentPoolPrice, hasPoolData, reserves, token0, token1, usdcAddress } = usePoolPrice(campaign.uniswapPair);

  const erc20Abi = [
    {
      inputs: [
        { internalType: "address", name: "spender", type: "address" },
        { internalType: "uint256", name: "value", type: "uint256" },
      ],
      name: "approve",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      constant: true,
      inputs: [{ name: "_owner", type: "address" }],
      name: "balanceOf",
      outputs: [{ name: "balance", type: "uint256" }],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
  ];

  const approveToken = async (address: string, amount: bigint) => {
    try {
      await approveAsync({
        address: address as Address,
        abi: erc20Abi,
        functionName: "approve",
        args: [contractAddress, amount],
      });
    } catch (e) {
      console.error("Approval error:", e);
    }
  };

  const handleCollateralChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setCollateralAmount(value);
      // Auto-calculate equivalent USDC amount based on pool ratio
      if (value && reserves && token0 && token1) {
        const tokenAmount = Number(value);
        const equivalentUSDC = calculateEquivalentUSDC(tokenAmount);
        setBorrowAmount(equivalentUSDC.toFixed(6));
      } else if (!value) {
        setBorrowAmount("");
      }
    }
  };

  const handleBorrowChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setBorrowAmount(Number(value).toFixed(6));
      // Auto-calculate equivalent token amount based on pool ratio
      if (value && reserves && token0 && token1) {
        const usdcAmount = Number(value);
        const equivalentTokens = calculateEquivalentTokens(usdcAmount);
        setCollateralAmount(equivalentTokens.toString());
      } else if (!value) {
        setCollateralAmount("");
      }
    }
  };

  // Calculate equivalent amounts based on pool reserves
  const calculateEquivalentUSDC = (tokenAmount: number): number => {
    if (!reserves || !token0 || !token1) return 0;

    const [reserve0, reserve1] = reserves as [bigint, bigint, number];
    const isToken0USDC = (token0 as string).toLowerCase() === usdcAddress.toLowerCase();

    let tokenReserve, usdcReserve;
    if (isToken0USDC) {
      usdcReserve = Number(reserve0) / 10 ** 6; // USDC has 6 decimals
      tokenReserve = Number(reserve1) / 10 ** 18; // Token has 18 decimals
    } else {
      tokenReserve = Number(reserve0) / 10 ** 18; // Token has 18 decimals
      usdcReserve = Number(reserve1) / 10 ** 6; // USDC has 6 decimals
    }

    if (tokenReserve === 0) return 0;
    const price = usdcReserve / tokenReserve;
    return tokenAmount * price;
  };

  const calculateEquivalentTokens = (usdcAmount: number): number => {
    if (!reserves || !token0 || !token1) return 0;

    const [reserve0, reserve1] = reserves as [bigint, bigint, number];
    const isToken0USDC = (token0 as string).toLowerCase() === usdcAddress.toLowerCase();

    let tokenReserve, usdcReserve;
    if (isToken0USDC) {
      usdcReserve = Number(reserve0) / 10 ** 6; // USDC has 6 decimals
      tokenReserve = Number(reserve1) / 10 ** 18; // Token has 18 decimals
    } else {
      tokenReserve = Number(reserve0) / 10 ** 18; // Token has 18 decimals
      usdcReserve = Number(reserve1) / 10 ** 6; // USDC has 6 decimals
    }

    if (usdcReserve === 0) return 0;
    const price = tokenReserve / usdcReserve;
    return usdcAmount * price;
  };

  // Get swap amount out for real-time calculation
  // const { data: usdcAmountOut } = useScaffoldReadContract({
  //   contractName: "LaunchpadV2",
  //   functionName: "getSwapAmountOut",
  //   args: [campaign.id, swapFromAmountInWei],
  //   query: {
  //     enabled: swapDirection === "token-to-usdc" && Number(swapFromAmount) > 0,
  //   },
  // });

  const { data: usdcBalance } = useScaffoldReadContract({
    contractName: "USDC",
    functionName: "balanceOf",
    args: [connectedAddress],
  });

  const tokenBalance = useReadContract({
    abi: erc20Abi,
    address: campaign.tokenAddress as Address,
    functionName: "balanceOf",
    args: [connectedAddress || ""],
    query: {
      refetchInterval: 10000,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
    },
  });

  const addLiquidity = async () => {
    if (!collateralAmount || !borrowAmount) {
      console.error("Both token and USDC amounts are required");
      return;
    }

    // Warn if ratios are significantly different from pool (if pool exists)
    if (hasPoolData && collateralValue > 0) {
      const userRatio = borrowValue / collateralValue;
      const priceDeviation = Math.abs((userRatio - currentPoolPrice) / currentPoolPrice);

      if (priceDeviation > 0.05) {
        // 5% deviation threshold
        const confirmMsg = `Your ratio (1:${userRatio.toFixed(6)}) differs from the current pool ratio (1:${currentPoolPrice.toFixed(6)}) by ${(priceDeviation * 100).toFixed(1)}%. This may result in immediate impermanent loss. Continue?`;
        if (!confirm(confirmMsg)) {
          return;
        }
      }
    }

    const tokenAmountInWei = BigInt(Math.floor(Number(collateralAmount) * 10 ** 18));
    const usdcAmountInWei = BigInt(Math.floor(Number(borrowAmount) * 10 ** 6));

    // Set minimum liquidity amounts with 2% slippage tolerance
    const minTokenLiquidity = BigInt(Math.floor(Number(tokenAmountInWei) * 0.98));
    const minUsdcLiquidity = BigInt(Math.floor(Number(usdcAmountInWei) * 0.98));

    // Set deadline to 5 minutes from now
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 5);

    try {
      // Approve token spending
      console.log("Approving token...");
      await approveToken(campaign.tokenAddress, 60000000000000000000000 as unknown as bigint);

      // Approve USDC spending
      console.log("Approving USDC...");
      await approveToken(usdcAddress, 6000000000000 as unknown as bigint);

      // Add liquidity to pool
      console.log("Adding liquidity...");
      await writeYourContractAsync({
        functionName: "addLiquidityToPool",
        args: [campaign.id, tokenAmountInWei, usdcAmountInWei, minTokenLiquidity, minUsdcLiquidity, deadline],
      });

      // Clear input fields on success
      setCollateralAmount("");
      setBorrowAmount("");

      console.log("Liquidity added successfully!");
    } catch (e) {
      console.error("Error adding liquidity:", e);
    }
  };

  const collateralValue = Number.parseFloat(collateralAmount) || 0;
  const borrowValue = Number.parseFloat(borrowAmount) || 0;

  const formattedUsdcAmount = Number(usdcBalance ?? 0n) / 10 ** 6;
  const formattedTokenAmount = Number(tokenBalance.data ?? 0n) / 10 ** 18;

  // Updated handleMaxClick function for liquidity tab
  const handleMaxClick = (inputType?: "collateral" | "borrow") => {
    if (activeTab === "liquidity") {
      if (inputType === "collateral") {
        // Set max token amount for collateral input
        setCollateralAmount(formattedTokenAmount.toString());
      } else if (inputType === "borrow") {
        // Set max USDC amount for borrow input
        setBorrowAmount(formattedUsdcAmount.toFixed(6));
      }
    } else {
      return;
    }
  };
  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Tabs */}
      <div className="flex items-center">
        <button
          onClick={() => setActiveTab("trade")}
          className={`px-4 py-1 rounded-3xl text-sm font-medium transition-colors ${
            activeTab === "trade" ? "bg-[#546054b0] text-gray-300" : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Trade
        </button>
        <button
          onClick={() => setActiveTab("liquidity")}
          className={`px-4 py-1 rounded-3xl text-sm font-medium transition-colors ${
            activeTab === "liquidity" ? "bg-[#546054b0] text-gray-300" : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Liquidity
        </button>
        <button
          onClick={() => setActiveTab("stake")}
          className={`px-4 py-1 rounded-3xl text-sm font-medium transition-colors ${
            activeTab === "stake" ? "bg-[#546054b0] text-gray-300" : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Stake
        </button>
      </div>

      {activeTab === "liquidity" ? (
        <>
          {/* Supply token Section */}
          <div className="bg-[#11181C] rounded-3xl px-6 py-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gray-300 text-lg">Supply {campaign.name}</h3>
              <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">₿</span>
              </div>
            </div>

            <div className="mb-3">
              <input
                type="text"
                value={collateralAmount}
                onChange={handleCollateralChange}
                placeholder="0.00"
                className="text-4xl font-light text-gray-300 bg-transparent border-none outline-none w-full placeholder-gray-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-gray-500 text-sm">${Number(formattedTokenAmount).toFixed(2)}</div>
              <div className="flex items-center gap-3">
                <span className="text-gray-400">
                  {Number(formattedTokenAmount).toFixed(2)} {campaign.symbol}
                </span>
                <Button
                  onClick={() => handleMaxClick("collateral")}
                  className="bg-[#546054b0] hover:bg-gray-600 text-gray-300 px-4 py-1 h-8 text-sm rounded-full"
                >
                  MAX
                </Button>
              </div>
            </div>
          </div>

          {/* supply USDC Section */}
          <div className="bg-[#11181C] rounded-3xl px-6 py-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gray-300 text-lg">Supply USDC</h3>
              <Image src="/usdc.svg" alt="USDC" width={16} height={16} className="w-5 h-5" />
            </div>

            <div className="mb-3">
              <input
                type="text"
                value={borrowAmount}
                onChange={handleBorrowChange}
                placeholder="0.00"
                className="text-4xl font-light text-gray-400 bg-transparent border-none outline-none w-full placeholder-gray-500"
                onFocus={e => e.target.select()}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-gray-500 text-sm">
                ${borrowValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-400">{formattedUsdcAmount.toFixed(2)} USDC</span>
                <Button
                  onClick={() => handleMaxClick("borrow")}
                  className="bg-[#546054b0] hover:bg-gray-600 text-gray-300 px-4 py-1 h-8 text-sm rounded-full"
                >
                  MAX
                </Button>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="bg-[#151b1e] rounded-3xl px-6 py-4 shadow-lg space-y-4">
            {hasPoolData ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Current Pool Price</span>
                  <span className="text-white">${currentPoolPrice.toFixed(6)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Pool Ratio</span>
                  <span className="text-white">
                    1 {campaign.symbol} = {currentPoolPrice.toFixed(6)} USDC
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Your Ratio</span>
                  <span
                    className={`${
                      collateralAmount &&
                      borrowAmount &&
                      Math.abs(borrowValue / collateralValue - currentPoolPrice) / currentPoolPrice > 0.05
                        ? "text-yellow-400"
                        : "text-green-400"
                    }`}
                  >
                    {collateralAmount && borrowValue && collateralValue > 0
                      ? `1:${(borrowValue / collateralValue).toFixed(6)}`
                      : "---"}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Pool Status</span>
                  <span className="text-yellow-400">No liquidity pool found</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Note</span>
                  <span className="text-gray-400 text-sm">You can set any ratio for initial liquidity</span>
                </div>
              </>
            )}

            <div className="flex items-center justify-between">
              <span className="text-gray-300">Slippage Tolerance</span>
              <span className="text-white">2%</span>
            </div>
          </div>

          <Button
            onClick={addLiquidity}
            disabled={!isConnected || !collateralAmount || !borrowAmount}
            className="w-full bg-[#546054b0] rounded-3xl text-white py-7 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {!isConnected ? "Connect Wallet" : "Add Liquidity"}
          </Button>
        </>
      ) : (
        <div className="flex items-center justify-center h-full">loading</div>
      )}
    </div>
  );
}
