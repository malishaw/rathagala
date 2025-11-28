import { toast } from "sonner";
import { useId } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

export function useRejectAd() {
  const queryClient = useQueryClient();
  const toastId = useId();

  const mutation = useMutation({
    mutationFn: async ({ id, rejectionDescription }: { id: string; rejectionDescription?: string }) => {
      const res = await client.api.ad[":id"].reject.$post({
        param: { id },
        json: {
          rejectionDescription: rejectionDescription || undefined,
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

        let message = `Failed to reject ad (status ${res.status})`;

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
      toast.loading("Rejecting ad...", { id: toastId });
    },
    onSuccess: (data) => {
      toast.success("Ad rejected successfully", { id: toastId });
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      queryClient.invalidateQueries({ queryKey: ["ad", data.id] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reject ad", { id: toastId });
    },
  });

  return mutation;
}

