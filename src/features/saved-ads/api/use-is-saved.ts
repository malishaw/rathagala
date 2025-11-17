import { useQuery } from "@tanstack/react-query";

export const useIsSaved = (adId: string) => {
  const query = useQuery({
    queryKey: ["favorite-check", adId],
    queryFn: async () => {
      try {
        console.log("Checking if ad is saved:", adId);
        const response = await fetch(`/api/saved-ad/check/${adId}`, {
          method: "GET",
          credentials: "include", // Important for auth cookies
        });

        console.log("Response status:", response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Check favorite error:", errorData);
          // If not authenticated, return false instead of throwing
          if (response.status === 401) {
            return false;
          }
          throw new Error(errorData.message || "Failed to check favorite status");
        }

        const data = await response.json();
        console.log("Check favorite success for", adId, ":", data.isFavorited);
        return data.isFavorited;
      } catch (error) {
        console.error("Check favorite query error:", error);
        // Return false on error instead of breaking the UI
        return false;
      }
    },
    enabled: !!adId, // Only run query if adId exists
    retry: false, // Don't retry on failure
  });

  return query;
};
