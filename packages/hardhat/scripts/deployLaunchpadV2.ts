import { network } from "hardhat";

const { ethers } = await network.connect({
  network: "testnet",
});

async function main() {
  // Get the signer of the tx and address for minting the token
  const [deployer] = await ethers.getSigners();
  console.log("Deploying LaunchpadV2 contract with the account:", deployer.address);

  // The deployer will also be the owner of our NFT contract
  const LaunchpadV2 = await ethers.getContractFactory("LaunchpadV2", deployer);
  const contract = await LaunchpadV2.deploy(
    "0xCEadd06AE587CaD6eF922F91F18f26EB42180Bbb",
    "0x82254d0f8C5091E79a5433f87ca7354a88FB1292",
    "0x14FCa1B39e7eBdBF34519004307a86548eCE08D0",
    "0x061a4E295612b5a60E3A05eF883f74654bb2749D",
  );

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("LaunchpadV2 Contract deployed at:", address);
}

main().catch(console.error);
