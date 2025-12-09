import { toast } from "sonner";
import { useId } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { CreateReportSchema } from "@/server/routes/report/report.schemas";

interface MutationParams {
  values: CreateReportSchema;
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  const toastId = useId();

  const mutation = useMutation({
    mutationFn: async ({ values }: MutationParams) => {
      const res = await client.api.report.$post({
        json: values
      });

      if (!res.ok) {
        const error = await res.json();

        throw new Error(error.message || "Failed to create report");
      }

      const data = await res.json();

      return data;
    },
    onMutate: () => {
      toast.loading("Submitting report...", { id: toastId });
    },
    onSuccess: () => {
      toast.success("Report submitted successfully", { id: toastId });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit report", {
        id: toastId
      });
    }
  });

  return mutation;
}
