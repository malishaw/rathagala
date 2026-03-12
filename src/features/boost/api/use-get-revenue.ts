import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

export const useGetRevenue = (filter: "today" | "7days" | "30days" | "all" = "all") => {
  return useQuery({
    queryKey: ["boost-revenue", filter],
    queryFn: async () => {
      const res = await client.api.boost.revenue.$get({ query: { filter } });
      if (!res.ok) throw new Error("Failed to fetch revenue");
      return res.json();
    },
  });
};
