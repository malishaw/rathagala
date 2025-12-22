import { toast } from "sonner";
import { useId } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

export function useDeleteAd() {
  const queryClient = useQueryClient();
  const toastId = useId();

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await client.api.ad[":id"].$delete({
        param: { id },
      });

      if (!res.ok) {
        const cloned = res.clone();
        let errJson: any = null;

        try {
          errJson = await cloned.json();
        } catch (e) {
          // ignore
        }

        const message = errJson?.message || `Failed to delete ad (status ${res.status})`;
        throw new Error(message);
      }

      return id;
    },
    onMutate: () => {
      toast.loading("Deleting ad...", { id: toastId });
    },
    onSuccess: () => {
      toast.success("Ad deleted successfully", { id: toastId });
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete ad", { id: toastId });
    },
  });

  return mutation;
}
