import { toast } from "sonner";
import { useId } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

export function useUnpublishAd() {
  const queryClient = useQueryClient();
  const toastId = useId();

  const mutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const res = await client.api.ad[":id"].reject.$post({
        param: { id },
        json: {
          rejectionDescription: reason || "Unpublished by admin",
        },
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

        let message = `Failed to unpublish ad (status ${res.status})`;

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
    onMutate: () => {
      toast.loading("Unpublishing ad...", { id: toastId });
    },
    onSuccess: () => {
      toast.success("Ad unpublished successfully", { id: toastId });
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to unpublish ad", { id: toastId });
    },
  });

  return mutation;
}
