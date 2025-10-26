import { useEnvioQuery } from "../useEnvioQuery";
import { gql } from "graphql-request";

interface TokensPurchasedEvent {
  id: string;
  campaignId: string;
  buyer: string;
  usdcAmount: string;
  tokensReceived: string;
  timestamp: string;
}

interface CampaignsResponse {
  Launchpad_TokensPurchased: TokensPurchasedEvent[];
}

const GET_CAMPAIGNS_BY_PARTICIPANT = gql`
  query GetCampaignsByParticipant($buyer: String) {
    Launchpad_TokensPurchased(where: { buyer: { _eq: $buyer } }) {
      id
      campaignId
      buyer
      usdcAmount
      tokensReceived
      timestamp
    }
  }
`;

export const useCampaignsByParticipant = (participantAddress: string | undefined) => {
  return useEnvioQuery<CampaignsResponse>(
    GET_CAMPAIGNS_BY_PARTICIPANT,
    participantAddress ? { buyer: participantAddress.toLowerCase() } : { buyer: null },
    {
      enabled: !!participantAddress,
      refetchInterval: 5000, // Refetch every 5 seconds
    },
  );
};
