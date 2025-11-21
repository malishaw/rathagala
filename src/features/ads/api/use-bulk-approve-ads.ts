import { toast } from "sonner";
import { useId } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

export function useBulkApproveAds() {
  const queryClient = useQueryClient();
  const toastId = useId();

  const mutation = useMutation({
    mutationFn: async (ids: string[]) => {
      // Approve all ads in parallel
      const results = await Promise.allSettled(
        ids.map(async (id) => {
          const res = await client.api.ad[":id"].approve.$post({
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

            const message = errJson?.message || `Failed to approve ad ${id} (status ${res.status})`;
            throw new Error(message);
          }

          return await res.json();
        })
      );

      // Count successes and failures
      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      return { successful, failed, total: ids.length };
    },
    onMutate: () => {
      toast.loading("Approving ads...", { id: toastId });
    },
    onSuccess: (data) => {
      if (data.failed === 0) {
        toast.success(`Successfully approved ${data.successful} ad(s)`, { id: toastId });
      } else {
        toast.warning(
          `Approved ${data.successful} ad(s), ${data.failed} failed`,
          { id: toastId }
        );
      }
      queryClient.invalidateQueries({ queryKey: ["ads"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to approve ads", { id: toastId });
    },
  });

  return mutation;
}

