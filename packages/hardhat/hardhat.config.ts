import type { HardhatUserConfig } from "hardhat/config";
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
// import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxMochaEthers], // hardhatToolboxViemPlugin - only one ignition plugin allowed at a time
  solidity: {
    compilers: [
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            // https://docs.soliditylang.org/en/latest/using-the-compiler.html#optimizer-options
            runs: 200,
          },
          viaIR: true,
        },
      },
    ],
  },
  networks: {
    hardhat: {
      type: "edr-simulated" as const,
      allowUnlimitedContractSize: true,
    },
  },
};

export default config;
