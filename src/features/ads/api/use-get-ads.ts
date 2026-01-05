import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

interface FilterParams {
  page?: number;
  limit?: number;
  search?: string | null;
  listingType?: string | null;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  brand?: string | null;
  model?: string | null;
}

interface QueryOptions {
  enabled?: boolean;
}

export const useGetAds = (params: FilterParams, options?: QueryOptions) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    listingType = "",
    minPrice,
    maxPrice,
    location,
    brand,
    model,
  } = params;

  const query = useQuery({
    queryKey: ["ads", { page, limit, search, listingType, minPrice, maxPrice, location, brand, model }],
    queryFn: async () => {
      const queryParams = {
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(listingType && listingType !== "all" && { listingType }),
        ...(minPrice !== undefined && { minPrice: minPrice.toString() }),
        ...(maxPrice !== undefined && { maxPrice: maxPrice.toString() }),
        ...(location && { location }),
        ...(brand && { brand }),
        ...(model && { model }),
      };

      const response = await client.api.ad.$get({
        query: queryParams,
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
