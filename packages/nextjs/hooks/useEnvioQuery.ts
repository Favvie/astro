import { UseQueryOptions, UseQueryResult, useQuery } from "@tanstack/react-query";
import { request } from "graphql-request";

const ENVIO_ENDPOINT = process.env.NEXT_PUBLIC_ENVIO_ENDPOINT || "http://localhost:8080/v1/graphql";

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
