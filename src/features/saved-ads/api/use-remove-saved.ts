import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useRemoveSaved = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (adId: string) => {
      try {
        console.log("Removing ad from favorites:", adId);
        const response = await fetch(`/api/saved-ad/${adId}`, {
          method: "DELETE",
          credentials: "include", // Important for auth cookies
        });

        console.log("Response status:", response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Remove saved error:", errorData);
          throw new Error(errorData.message || "Failed to remove ad");
        }

        const data = await response.json();
        console.log("Remove saved success:", data);
        return data;
      } catch (error) {
        console.error("Remove saved mutation error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate and refetch favorites
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      // Also invalidate check query for this specific ad
      queryClient.invalidateQueries({ queryKey: ["favorite-check"] });
      toast.success("Ad removed from favorites");
    },
    onError: (error: Error) => {
      console.error("Remove saved onError:", error);
      toast.error(error.message || "Failed to remove ad");
    },
  });

  return mutation;
};
