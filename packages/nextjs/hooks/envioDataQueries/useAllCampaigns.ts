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

const GET_ALL_CAMPAIGNS = gql`
  query GetAllCampaigns {
    Launchpad_CampaignCreated {
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

export const useAllCampaigns = () => {
  const result = useEnvioQuery<CampaignsResponse>(
    GET_ALL_CAMPAIGNS,
    {},
    {
      enabled: true,
      refetchInterval: 5000, // Refetch every 5 seconds
    },
  );

  console.log("useAllCampaigns result:", result);
  console.log("useAllCampaigns data:", result.data);

  return result;
};
