import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

interface QueryOptions {
  enabled?: boolean;
}

export const useGetTrendingAds = (limit: number = 10, options?: QueryOptions) => {
  const query = useQuery({
    queryKey: ["trending-ads", { limit }],
    queryFn: async () => {
      const response = await client.api.ad.trending.$get({
        query: {
          limit: limit.toString(),
        },
      });

      if (!response.ok) {
        const { message } = await response.json();

        throw new Error(message);
      }

      const data = await response.json();

      return data;
    },
    enabled: options?.enabled ?? true,
  });

  return query;
};