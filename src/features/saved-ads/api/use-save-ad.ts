import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useSaveAd = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (adId: string) => {
      try {
        console.log("Saving ad:", adId);
        console.log("Request URL:", "/api/saved-ad");
        
        const response = await fetch("/api/saved-ad", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ adId }),
          credentials: "include", // Important for auth cookies
        });

        console.log("=== RESPONSE DEBUG ===");
        console.log("Status:", response.status);
        console.log("Status Text:", response.statusText);
        console.log("OK:", response.ok);
        console.log("Headers:", Object.fromEntries(response.headers.entries()));

        // Check if route exists
        if (response.status === 404) {
          console.error("❌ ROUTE NOT FOUND! /api/saved-ad doesn't exist");
          console.error("Did you restart the dev server?");
          throw new Error("API route not found. Please restart your dev server.");
        }

        if (!response.ok) {
          const contentType = response.headers.get("content-type");
          let errorData: any = {};
          
          console.log("Error response content-type:", contentType);
          
          if (contentType && contentType.includes("application/json")) {
            errorData = await response.json().catch((e) => {
              console.error("Failed to parse JSON error:", e);
              return {};
            });
          } else {
            const text = await response.text();
            console.error("Non-JSON error response (status " + response.status + "):", text);
            errorData = { message: text || `Server error (${response.status})` };
          }
          
          console.error("Save ad error:", errorData);
          
          // More specific error messages
          if (response.status === 400) {
            throw new Error(errorData.message || "Invalid request. The ad might not exist.");
          } else if (response.status === 401) {
            throw new Error("Please sign in to save ads");
          } else if (response.status === 500) {
            throw new Error(errorData.message || "Server error. Please try again.");
          }
          
          throw new Error(errorData.message || "Failed to save ad");
        }

        const data = await response.json();
        console.log("✅ Save ad success:", data);
        return data;
      } catch (error) {
        console.error("Save ad mutation error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate and refetch favorites
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      // Also invalidate check query for this specific ad
      queryClient.invalidateQueries({ queryKey: ["favorite-check"] });
      toast.success("Ad saved to favorites!");
    },
    onError: (error: Error) => {
      console.error("Save ad onError:", error);
      
      // Check if it's an authentication error
      if (error.message.includes("not authenticated") || error.message.includes("Unauthorized")) {
        toast.error("Please sign in to save ads");
      } else if (error.message.includes("already in favorites")) {
        toast.info("Ad is already in your favorites");
      } else {
        toast.error(error.message || "Failed to save ad");
      }
    },
  });

  return mutation;
};
