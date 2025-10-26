import { useEnvioQuery } from "../useEnvioQuery";
import { gql } from "graphql-request";

interface SwapEvent {
  id: string;
  campaignId: string;
  amount: string;
  user: string;
  tradeType: number;
  token: string;
}

interface SwapEventsResponse {
  LaunchpadV2_SwapEvent: SwapEvent[];
}

const GET_SWAP_EVENTS_BY_CAMPAIGN = gql`
  query GetSwapEventsByCampaign($campaignId: numeric) {
    LaunchpadV2_SwapEvent(where: { campaignId: { _eq: $campaignId } }, order_by: { id: desc }) {
      id
      campaignId
      amount
      user
      tradeType
      token
    }
  }
`;

export const useSwapEventsByCampaign = (campaignId: string | number | undefined) => {
  return useEnvioQuery<SwapEventsResponse>(
    GET_SWAP_EVENTS_BY_CAMPAIGN,
    campaignId ? { campaignId: String(campaignId) } : { campaignId: null },
    {
      enabled: !!campaignId,
      refetchInterval: 5000,
    },
  );
};
