import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~~/components/ui/alert-dialog";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const Faucet = () => {
  const { writeContractAsync: writeYourContractAsync } = useScaffoldWriteContract({ contractName: "Faucet" });
  const { address } = useAccount();
  const [selectedAsset, setSelectedAsset] = useState<"USDC" | "STT" | null>(null);

  const dripFaucet = async () => {
    if (!address) {
      toast.error("Please connect your wallet first", {
        position: "top-right",
      });
      return;
    }
    const toastId = toast.loading("Dripping...", {
      position: "top-right",
    });
    try {
      toast.loading("Fetching Tokens...", { id: toastId, position: "top-right" });
      await writeYourContractAsync({
        functionName: "drip",
        args: [address],
      });
      toast.success("Drip successful!", { id: toastId, position: "top-right" });
    } catch (e) {
      toast.error("Drip failed!", { id: toastId, position: "top-right" });
      console.error("Error setting greeting:", e);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <div className="w-13 h-13 rounded-full p-3 border border-[#1a4a2d] bg-[#25333b] hover:bg-[#546054b0]">
          <Image src="/faucet-2.svg" alt="Logo" width={100} height={100} className="w-8" />
        </div>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-[#11181C] border-[#24353d] text-gray-300">
        <AlertDialogHeader>
          <AlertDialogTitle className="mb-4">What Asset do you need?</AlertDialogTitle>
          <div className="mb-3">
            <ul className="grid w-full gap-3 md:grid-cols-2">
              <li>
                <input
                  type="radio"
                  id="hosting-small"
                  name="hosting"
                  value="USDC"
                  className="hidden peer"
                  onChange={() => setSelectedAsset("USDC")}
                />
                <label
                  htmlFor="hosting-small"
                  className="inline-flex items-center justify-between w-full p-5 border rounded-lg cursor-pointer hover:text-gray-300 bg-[#19242a] border-[#3e545f] peer-checked:text-[#8daa98] peer-checked:border-[#8daa98] text-gray-400 hover:bg-[#11181C]"
                >
                  <div className="block space-y-3">
                    <Image src="/usdc.svg" alt="USDC" width={16} height={16} className="w-7 h-7" />
                    <div className="w-full text-2xl font-medium">USDC</div>
                  </div>
                  <svg
                    className="w-5 h-5 ms-3 rtl:rotate-180"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 14 10"
                  >
                    <path
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M1 5h12m0 0L9 1m4 4L9 9"
                    />
                  </svg>
                </label>
              </li>
              <li>
                <input
                  type="radio"
                  id="hosting-big"
                  name="hosting"
                  value="STT"
                  className="hidden peer"
                  onChange={() => setSelectedAsset("STT")}
                />
                <label
                  htmlFor="hosting-big"
                  className="inline-flex items-center justify-between w-full p-5 border rounded-lg cursor-pointer hover:text-gray-300 peer-checked:text-[#8daa98] peer-checked:border-[#8daa98] hover:bg-[#11181C] text-gray-400 bg-[#19242a] border-[#3e545f] "
                >
                  <div className="block space-y-3">
                    <Image src="/stt.png" alt="USDC" width={16} height={16} className="w-7 h-7" />
                    <div className="w-full text-2xl font-medium">STT</div>
                  </div>
                  <svg
                    className="w-5 h-5 ms-3 rtl:rotate-180"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 14 10"
                  >
                    <path
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M1 5h12m0 0L9 1m4 4L9 9"
                    />
                  </svg>
                </label>
              </li>
            </ul>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-transparent text-[#8daa98] border-[#8daa98]">Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-[#8daa98] text-[#11181C]"
            onClick={() => {
              if (selectedAsset === "USDC") {
                dripFaucet();
              } else if (selectedAsset === "STT") {
                window.open("https://cloud.google.com/application/web3/faucet/somnia/shannon", "_blank");
              } else {
                toast.error("Please select an asset", { position: "top-right" });
              }
            }}
          >
            Drip
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default Faucet;
