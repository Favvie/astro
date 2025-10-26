import { UseQueryOptions, UseQueryResult, useQuery } from "@tanstack/react-query";
import { request } from "graphql-request";

const ENVIO_ENDPOINT = "https://indexer.dev.hyperindex.xyz/f7cd6b3/v1/graphql" as const;
// const ENVIO_ENDPOINT = "https://localhost:8080" as const;

export const useEnvioQuery = <TData = unknown, TError = unknown>(
  query: string,
  variables?: Record<string, any>,
  options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">,
): UseQueryResult<TData, TError> => {
  return useQuery<TData, TError>({
    queryKey: ["envio", query, variables],
    queryFn: async () => request<TData>(ENVIO_ENDPOINT, query, variables),
    ...options,
  });
};
