import { useEnvioQuery } from "../useEnvioQuery";
import { gql } from "graphql-request";

interface CampaignCreatedEvent {
  id: string;
  campaignId: string;
  creator: string;
  name: string;
  targetFunding: string;
  totalSupply: string;
  deadline: string;
}

interface CampaignsResponse {
  Launchpad_CampaignCreated: CampaignCreatedEvent[];
}

const GET_CAMPAIGNS_BY_CREATOR = gql`
  query GetCampaignsByCreator($creator: String) {
    Launchpad_CampaignCreated(where: { creator: { _eq: $creator } }) {
      id
      campaignId
      creator
      name
      targetFunding
      totalSupply
      deadline
    }
  }
`;

export const useCampaignsByCreator = (creatorAddress: string | undefined) => {
  return useEnvioQuery<CampaignsResponse>(
    GET_CAMPAIGNS_BY_CREATOR,
    creatorAddress ? { creator: creatorAddress.toLowerCase() } : { creator: null },
    {
      enabled: !!creatorAddress,
      refetchInterval: 5000, // Refetch every 5 seconds
    },
  );
};
