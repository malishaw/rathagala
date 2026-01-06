import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

export const useListMedia = (userId?: string) => {
  const query = useQuery({
    queryKey: ["media", userId],
    queryFn: async () => {
      const response = await client.api.media.$get();

      if (!response.ok) {
        const { message } = await response.json();

        throw new Error(message);
      }

      const data = await response.json();

      return data;
    },
    enabled: !!userId
  });

  return query;
};
