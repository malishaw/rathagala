import { toast } from "sonner";
import { useId } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

export function usePublishAd() {
  const queryClient = useQueryClient();
  const toastId = useId();

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await client.api.ad[":id"].approve.$post({
        param: { id },
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

        let message = `Failed to publish ad (status ${res.status})`;

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
      toast.loading("Publishing ad...", { id: toastId });
    },
    onSuccess: () => {
      toast.success("Ad published successfully", { id: toastId });
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to publish ad", { id: toastId });
    },
  });

  return mutation;
}
