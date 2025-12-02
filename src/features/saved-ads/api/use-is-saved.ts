import { useQuery } from "@tanstack/react-query";

export const useIsSaved = (adId: string) => {
  const query = useQuery({
    queryKey: ["favorite-check", adId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/saved-ad/check/${adId}`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          // Silently return false for auth errors or any failures
          if (response.status === 401 || response.status === 403) {
            return false;
          }
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to check favorite status");
        }

        const data = await response.json();
        return data.isFavorited;
      } catch (error) {
        // Silently return false on any error (network issues, etc.)
        return false;
      }
    },
    enabled: !!adId,
    retry: false,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  return query;
};
