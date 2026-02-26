import { toast } from "sonner";
import { useId } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

export function useBulkPermanentDeleteAds() {
  const queryClient = useQueryClient();
  const toastId = useId();

  const mutation = useMutation({
    mutationFn: async (adIds: string[]) => {
      const res = await client.api.ad["bulk-permanent-delete"].$post({
        json: { adIds },
      });

      if (!res.ok) {
        const cloned = res.clone();
        let errJson: any = null;
        let errText: string | null = null;

        try {
          errJson = await cloned.json();
        } catch (e) {
          // ignore
        }

        try {
          errText = await res.text();
        } catch (e) {
          // ignore
        }

        let message = `Failed to delete ads (status ${res.status})`;

        if (errJson) {
          if (typeof errJson.message === "string" && errJson.message.trim()) {
            message = errJson.message;
          } else {
            message = JSON.stringify(errJson);
          }
        } else if (errText && errText.trim()) {
          message = errText.trim();
        }

        throw new Error(message);
      }

      return await res.json();
    },
    onMutate: (adIds) => {
      const count = adIds.length;
      toast.loading(`Deleting ${count} ad${count > 1 ? 's' : ''}...`, { id: toastId });
    },
    onSuccess: (data, adIds) => {
      toast.success(data.message || "Ads deleted successfully!", { id: toastId });
      // Invalidate expired ads queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ["expired-ads"] });
      queryClient.invalidateQueries({ queryKey: ["ads"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete ads", {
        id: toastId,
      });
    },
  });

  return mutation;
}