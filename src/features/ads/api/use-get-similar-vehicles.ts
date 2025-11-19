import { useQuery } from "@tanstack/react-query";

interface SimilarVehicle {
  id: string;
  title: string;
  brand: string | null;
  model: string | null;
  year: string | null;
  price: number | null;
  mileage: number | null;
  fuelType: string | null;
  transmission: string | null;
  condition: string | null;
  location: string;
  image: string;
}

interface SimilarVehiclesData {
  vehicles: SimilarVehicle[];
}

interface Params {
  adId: string;
  limit?: number;
  enabled?: boolean;
}

export const useGetSimilarVehicles = (params: Params) => {
  const { adId, limit = 5, enabled = true } = params;

  const query = useQuery<SimilarVehiclesData>({
    queryKey: ["similarVehicles", { adId, limit }],
    queryFn: async () => {
      const response = await fetch(
        `/api/similar-vehicles?adId=${encodeURIComponent(adId)}&limit=${limit}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch similar vehicles");
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

