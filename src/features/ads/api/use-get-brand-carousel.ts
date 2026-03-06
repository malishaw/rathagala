import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

export const useGetBrandCarousel = () => {
  return useQuery({
    queryKey: ["brand-carousel"],
    queryFn: async () => {
      const response = await client.api["brand-carousel"].$get();

      if (!response.ok) {
        throw new Error("Failed to fetch brand carousel");
      }

      const data = await response.json();
      return data.brands;
    },
  });
};
