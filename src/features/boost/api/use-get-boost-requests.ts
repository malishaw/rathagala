import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

export const useGetBoostRequests = (status?: string, page = 1, limit = 20) => {
  return useQuery({
    queryKey: ["boost-requests", status, page, limit],
    queryFn: async () => {
      const res = await client.api.boost.requests.$get({
        query: { status, page: page.toString(), limit: limit.toString() },
      });
      if (!res.ok) throw new Error("Failed to fetch boost requests");
      return res.json();
    },
  });
};
