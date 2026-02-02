import { toast } from "sonner";
import { useId } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

type PromotionType = "boost" | "featured" | "none";
type Duration = "1week" | "2weeks" | "1month";

interface UpdatePromotionParams {
  id: string;
  promotionType: PromotionType;
  duration?: Duration;
}

export function useUpdatePromotion() {
  const queryClient = useQueryClient();
  const toastId = useId();

  const mutation = useMutation({
    mutationFn: async (params: UpdatePromotionParams) => {
      const res = await client.api.ad[":id"].promotion.$patch({
        param: { id: params.id },
        json: {
          promotionType: params.promotionType,
          duration: params.duration,
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

        let message = `Failed to update promotion (status ${res.status})`;

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
      toast.loading("Updating promotion status...", { id: toastId });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      queryClient.invalidateQueries({ queryKey: ["ad", data.id] });
      toast.success("Promotion status updated successfully", { id: toastId });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update promotion status", {
        id: toastId,
      });
    },
  });

  return mutation;
}
