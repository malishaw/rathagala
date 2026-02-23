import { toast } from "sonner";
import { useId } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { DeleteAdReason } from "@/constants/delete-reasons";

type DeleteAdInput = {
  id: string;
  reason: DeleteAdReason;
  adTitle?: string;
};

export function useDeleteAd() {
  const queryClient = useQueryClient();
  const toastId = useId();

  const mutation = useMutation({
    mutationFn: async ({ id, reason }: DeleteAdInput) => {
      const res = await client.api.ad[":id"].$delete({
        param: { id },
        json: { reason },
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

      let parsed: any = null;

      try {
        parsed = await res.json();
      } catch (e) {
        // ignore json parse errors
      }

      return { id, serverMessage: parsed?.message as string | undefined };
    },
    onMutate: () => {
      toast.loading("Deleting ad...", { id: toastId });
    },
    onSuccess: (data, variables) => {
      const message = data?.serverMessage?.trim()
        || (variables?.adTitle?.trim() ? `Your ${variables.adTitle.trim()} ad successfully deleted.` : "Ad deleted successfully");

      toast.success(message, { id: toastId });
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      queryClient.invalidateQueries({ queryKey: ["userAds"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["deleted-ads"] });
      queryClient.refetchQueries({ queryKey: ["ads"] });
      queryClient.refetchQueries({ queryKey: ["deleted-ads"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete ad", { id: toastId });
    },
  });

  return mutation;
}
