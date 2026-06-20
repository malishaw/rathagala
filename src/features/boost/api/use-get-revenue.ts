import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

export const useGetRevenue = (
  filter: "today" | "7days" | "30days" | "all" | "custom" = "all",
  startDate?: string,
  endDate?: string,
  page: number = 1,
  limit: number = 20
) => {
  return useQuery({
    queryKey: ["boost-revenue", filter, startDate, endDate, page, limit],
    queryFn: async () => {
      const res = await client.api.boost.revenue.$get({
        query: {
          filter,
          ...(startDate && { startDate }),
          ...(endDate && { endDate }),
          page: page.toString(),
          limit: limit.toString(),
        } as any,
      });
      if (!res.ok) throw new Error("Failed to fetch revenue");
      return res.json();
    },
  });
};
