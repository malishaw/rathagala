import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

export const useGetBoostPricing = () => {
  return useQuery({
    queryKey: ["boost-pricing"],
    queryFn: async () => {
      const res = await client.api.boost.pricing.$get();
      if (!res.ok) throw new Error("Failed to fetch pricing");
      return res.json();
    },
  });
};
