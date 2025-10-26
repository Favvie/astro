import { useEnvioQuery } from "../useEnvioQuery";
import { gql } from "graphql-request";

interface LiquidityEvent {
  id: string;
  campaignId: string;
  tokenAmount: string;
  usdcAmount: string;
  user: string;
  tradeType: number;
  token: string;
}

interface LiquidityEventsResponse {
  LaunchpadV2_LiquidityEvent: LiquidityEvent[];
}

const GET_LIQUIDITY_EVENTS_BY_CAMPAIGN = gql`
  query GetLiquidityEventsByCampaign($campaignId: numeric) {
    LaunchpadV2_LiquidityEvent(where: { campaignId: { _eq: $campaignId } }, order_by: { id: desc }) {
      id
      campaignId
      tokenAmount
      usdcAmount
      user
      tradeType
      token
    }
  }
`;

export const useLiquidityEventsByCampaign = (campaignId: string | number | undefined) => {
  return useEnvioQuery<LiquidityEventsResponse>(
    GET_LIQUIDITY_EVENTS_BY_CAMPAIGN,
    campaignId ? { campaignId: String(campaignId) } : { campaignId: null },
    {
      enabled: !!campaignId,
      refetchInterval: 5000,
    },
  );
};
