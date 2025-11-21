import { useQuery } from "@tanstack/react-query";

interface MarketPriceData {
  currentPrice: number | null;
  marketPrice: number | null;
  priceDifference: number | null;
  priceDifferencePercent: number | null;
  similarAdsCount: number;
  message: string | null;
}

interface Params {
  adId: string;
  enabled?: boolean;
}

export const useGetMarketPrice = (params: Params) => {
  const { adId, enabled = true } = params;

  const query = useQuery<MarketPriceData>({
    queryKey: ["marketPrice", { adId }],
    queryFn: async () => {
      const response = await fetch(`/api/market-price?adId=${encodeURIComponent(adId)}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch market price");
      }

      const data = await response.json();
      return data;
    },
    enabled: enabled && !!adId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });

  return query;
};

