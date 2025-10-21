import { network } from "hardhat";

const { ethers } = await network.connect({
  network: "testnet",
});

async function main() {
  // Get the signer of the tx and address for minting the token
  const [deployer] = await ethers.getSigners();
  console.log("Deploying Launchpad contract with the account:", deployer.address);

  // The deployer will also be the owner of our NFT contract
  const Launchpad = await ethers.getContractFactory("Launchpad", deployer);
  const contract = await Launchpad.deploy(
    "0x228c18b89badb585de00efeebd7ca0bf832abc6d",
    "0x82254d0f8C5091E79a5433f87ca7354a88FB1292",
    "0x14FCa1B39e7eBdBF34519004307a86548eCE08D0",
    "0x061a4E295612b5a60E3A05eF883f74654bb2749D",
    50 * 10 ** 6,
  );

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("Launchpad Contract deployed at:", address);
}

main().catch(console.error);
