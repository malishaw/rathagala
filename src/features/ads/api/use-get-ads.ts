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
  status?: string | null;
  includeExpired?: boolean;
  type?: string | null;
  condition?: string | null;
  minYear?: string | null;
  maxYear?: string | null;
  fuelType?: string | null;
  transmission?: string | null;
  city?: string | null;
  district?: string | null;
  featuredActive?: string | boolean | null;
  topAdActive?: string | boolean | null;
  bumpActive?: string | boolean | null;
  urgentActive?: string | boolean | null;
}

interface QueryOptions {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
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
    status,
    includeExpired,
    type,
    condition,
    minYear,
    maxYear,
    fuelType,
    transmission,
    city,
    district,
    featuredActive,
    topAdActive,
    bumpActive,
    urgentActive,
  } = params;

  const query = useQuery({
    queryKey: [
      "ads",
      {
        page,
        limit,
        search,
        listingType,
        minPrice,
        maxPrice,
        location,
        brand,
        model,
        status,
        includeExpired,
        type,
        condition,
        minYear,
        maxYear,
        fuelType,
        transmission,
        city,
        district,
        featuredActive,
        topAdActive,
        bumpActive,
        urgentActive,
      },
    ],
    queryFn: async () => {
      const queryParams = {
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(listingType && listingType !== "all" && { listingType }),
        ...(minPrice !== undefined && minPrice !== null && { minPrice: minPrice.toString() }),
        ...(maxPrice !== undefined && maxPrice !== null && { maxPrice: maxPrice.toString() }),
        ...(location && { location }),
        ...(brand && brand !== "all" && { brand }),
        ...(model && model !== "all" && { model }),
        ...(status && status !== "all" && { status }),
        ...(includeExpired && { includeExpired: "true" }),
        ...(type && type !== "all" && { type }),
        ...(condition && condition !== "all" && { condition }),
        ...(minYear && minYear !== "any" && minYear !== "all" && { minYear }),
        ...(maxYear && maxYear !== "any" && maxYear !== "all" && { maxYear }),
        ...(fuelType && fuelType !== "all" && { fuelType }),
        ...(transmission && transmission !== "all" && { transmission }),
        ...(city && city !== "all" && { city }),
        ...(district && district !== "all" && { district }),
        ...(featuredActive && { featuredActive: featuredActive.toString() }),
        ...(topAdActive && { topAdActive: topAdActive.toString() }),
        ...(bumpActive && { bumpActive: bumpActive.toString() }),
        ...(urgentActive && { urgentActive: urgentActive.toString() }),
      };

      const response = await client.api.ad.$get({
        query: queryParams as any,
      });

      if (!response.ok) {
        const { message } = await response.json();

        throw new Error(message);
      }

      const data = await response.json();

      return data;
    },
    enabled: options?.enabled ?? true,
    staleTime: options?.staleTime,
    gcTime: options?.gcTime,
  });

  return query;
};
