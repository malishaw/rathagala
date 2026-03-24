import { useQuery } from "@tanstack/react-query";

export const useGetFavorites = () => {
  const query = useQuery({
    queryKey: ["favorites"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/saved-ad", {
          method: "GET",
          credentials: "include", // Important for auth cookies
          headers: {
            "Content-Type": "application/json",
          },
        });

        // If not authenticated, return empty array
        if (response.status === 401) {
          return [];
        }

        // If route not found, log it
        if (response.status === 404) {
          return [];
        }

        if (!response.ok) {
          return [];
        }

        const data = await response.json();

        // Supports both legacy array response and current object response.
        if (Array.isArray(data)) {
          return data;
        }

        if (data && Array.isArray(data.favorites)) {
          return data.favorites;
        }

        return [];
      } catch (error) {
        // Return empty array on error
        return [];
      }
    },
    retry: false, // Don't retry on failure
  });

  return query;
};
