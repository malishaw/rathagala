import { useQuery } from "@tanstack/react-query";

export const useGetFavorites = () => {
  const query = useQuery({
    queryKey: ["favorites"],
    queryFn: async () => {
      try {
        console.log("Fetching favorites from /api/saved-ad");
        const response = await fetch("/api/saved-ad", {
          method: "GET",
          credentials: "include", // Important for auth cookies
          headers: {
            "Content-Type": "application/json",
          },
        });

        console.log("Response status:", response.status, "OK:", response.ok);

        // If not authenticated, return empty array
        if (response.status === 401) {
          console.log("User not authenticated, returning empty array");
          return [];
        }

        // If route not found, log it
        if (response.status === 404) {
          console.error("Route not found! The /api/saved-ad endpoint doesn't exist. Server may need restart.");
          return [];
        }

        if (!response.ok) {
          const contentType = response.headers.get("content-type");
          console.log("Content-Type:", contentType);
          
          let errorData: any = {};
          if (contentType && contentType.includes("application/json")) {
            errorData = await response.json().catch(() => ({}));
          } else {
            const text = await response.text();
            console.error("Non-JSON response:", text);
          }
          
          console.error("Get favorites error:", errorData, "Status:", response.status);
          throw new Error(errorData.message || "Failed to fetch favorites");
        }

        const data = await response.json();
        console.log("Get favorites success:", data);
        return data;
      } catch (error) {
        console.error("Get favorites query error:", error);
        // Return empty array on error
        return [];
      }
    },
    retry: false, // Don't retry on failure
  });

  return query;
};
