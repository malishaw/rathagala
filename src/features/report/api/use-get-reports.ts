import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

interface FilterParams {
  page?: number;
  limit?: number;
  status?: string | null;
  adId?: string | null;
  userId?: string | null;
}

export const useGetReports = (params: FilterParams) => {
  const {
    page = 1,
    limit = 10,
    status = "",
    adId = "",
    userId = "",
  } = params;

  const query = useQuery({
    queryKey: ["reports", { page, limit, status, adId, userId }],
    queryFn: async () => {
      const queryParams = {
        page: page.toString(),
        limit: limit.toString(),
        ...(status && { status }),
        ...(adId && { adId }),
        ...(userId && { userId }),
      };

      const response = await client.api.report.$get({
        query: queryParams,
      });

      if (!response.ok) {
        const { message } = await response.json();

        throw new Error(message);
      }

      const data = await response.json();

      return data;
    },
  });

  return query;
};
