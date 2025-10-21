import { network } from "hardhat";

const { ethers } = await network.connect({
  network: "testnet",
});

async function main() {
  // Get the signer of the tx and address for minting the token
  const [deployer] = await ethers.getSigners();
  console.log("Deploying CampaignDAOFactory contract with the account:", deployer.address);

  // The deployer will also be the owner of our NFT contract
  const CampaignDAOFactory = await ethers.getContractFactory("CampaignDAOFactory", deployer);
  const contract = await CampaignDAOFactory.deploy();

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("CampaignDAOFactory Contract deployed at:", address);
}

main().catch(console.error);
