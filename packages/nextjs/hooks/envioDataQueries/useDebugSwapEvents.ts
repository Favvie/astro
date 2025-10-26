import { useEnvioQuery } from "../useEnvioQuery";
import { gql } from "graphql-request";

interface DebugSwapResponse {
  LaunchpadV2_SwapEvent: Array<{
    id: string;
    campaignId: string;
    amount: string;
    user: string;
    tradeType: number;
    token: string;
  }>;
}

const GET_ALL_SWAP_EVENTS = gql`
  query GetAllSwapEvents {
    LaunchpadV2_SwapEvent(limit: 10, order_by: { id: desc }) {
      id
      campaignId
      amount
      user
      tradeType
      token
    }
  }
`;

export const useDebugSwapEvents = () => {
  return useEnvioQuery<DebugSwapResponse>(
    GET_ALL_SWAP_EVENTS,
    {},
    {
      refetchInterval: 5000,
    },
  );
};
