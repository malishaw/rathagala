import { toast } from "sonner";
import { useId } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { CreateAdSchema } from "@/server/routes/ad/ad.schemas";

interface MutationParams {
  values: CreateAdSchema;
}

export function useSetupAd() {
  const queryClient = useQueryClient();
  const toastId = useId();

  const mutation = useMutation({
    mutationFn: async ({ values }: MutationParams) => {
      const res = await client.api.ad.$post({
        json: values
      });

      if (!res.ok) {
        if (res.status >= 500) {
          throw new Error("Service temporarily unavailable. Please try again in a few moments.");
        }

        const errorData = (await res.json().catch(() => ({}))) as {
          message?: string;
          details?: Array<{ message?: string; path?: string[] }>;
        };
        let errorMsg = errorData.message || "Failed to create ad";
        if (Array.isArray(errorData.details) && errorData.details.length > 0) {
          const detailedMsgs = errorData.details
            .map((issue) => issue.message || `${issue.path?.join(".")}: invalid`)
            .join("; ");
          errorMsg = detailedMsgs || errorMsg;
        }
        throw new Error(errorMsg);
      }

      const data = await res.json();

      return data;
    },
    onMutate: () => {
      toast.loading("Creating Ad...", { id: toastId });
    },
    onSuccess: () => {
      toast.success("Ad created successfully", { id: toastId });
      queryClient.invalidateQueries({ queryKey: ["ads"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create ad", {
        id: toastId
      });
    }
  });

  return mutation;
}
