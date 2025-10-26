import { useEnvioQuery } from "../useEnvioQuery";
import { gql } from "graphql-request";

interface DebugLiquidityV2Response {
  LaunchpadV2_LiquidityEvent: Array<{
    id: string;
    campaignId: string;
    tokenAmount: string;
    usdcAmount: string;
    user: string;
    tradeType: number;
    token: string;
  }>;
}

interface DebugLiquidityV1Response {
  Launchpad_LiquidityAdded: Array<{
    id: string;
    campaignId: string;
    usdcAmount: string;
    tokensAmount: string;
  }>;
}

const GET_ALL_LIQUIDITY_V2_EVENTS = gql`
  query GetAllLiquidityV2Events {
    LaunchpadV2_LiquidityEvent(limit: 10, order_by: { id: desc }) {
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

const GET_ALL_LIQUIDITY_V1_EVENTS = gql`
  query GetAllLiquidityV1Events {
    Launchpad_LiquidityAdded(limit: 10, order_by: { id: desc }) {
      id
      campaignId
      usdcAmount
      tokensAmount
    }
  }
`;

export const useDebugLiquidityV2Events = () => {
  return useEnvioQuery<DebugLiquidityV2Response>(
    GET_ALL_LIQUIDITY_V2_EVENTS,
    {},
    {
      refetchInterval: 5000,
    },
  );
};

export const useDebugLiquidityV1Events = () => {
  return useEnvioQuery<DebugLiquidityV1Response>(
    GET_ALL_LIQUIDITY_V1_EVENTS,
    {},
    {
      refetchInterval: 5000,
    },
  );
};
