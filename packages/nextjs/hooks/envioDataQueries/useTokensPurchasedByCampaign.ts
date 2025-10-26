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

interface TokensPurchasedResponse {
  Launchpad_TokensPurchased: TokensPurchasedEvent[];
}

const GET_TOKENS_PURCHASED_BY_CAMPAIGN = gql`
  query GetTokensPurchasedByCampaign($campaignId: numeric) {
    Launchpad_TokensPurchased(where: { campaignId: { _eq: $campaignId } }, order_by: { timestamp: desc }) {
      id
      campaignId
      buyer
      usdcAmount
      tokensReceived
      timestamp
    }
  }
`;

export const useTokensPurchasedByCampaign = (campaignId: string | number | undefined) => {
  return useEnvioQuery<TokensPurchasedResponse>(
    GET_TOKENS_PURCHASED_BY_CAMPAIGN,
    campaignId ? { campaignId: String(campaignId) } : { campaignId: null },
    {
      enabled: !!campaignId,
      refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
    },
  );
};
