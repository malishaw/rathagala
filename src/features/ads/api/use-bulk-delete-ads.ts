import { toast } from "sonner";
import { useId } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

export function useBulkDeleteAds() {
  const queryClient = useQueryClient();
  const toastId = useId();

  const mutation = useMutation({
    mutationFn: async (ids: string[]) => {
      // Delete all ads in parallel
      const results = await Promise.allSettled(
        ids.map(async (id) => {
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

            const message = errJson?.message || `Failed to delete ad ${id} (status ${res.status})`;
            throw new Error(message);
          }

          return id;
        })
      );

      // Count successes and failures
      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      return { successful, failed, total: ids.length };
    },
    onMutate: () => {
      toast.loading("Deleting ads...", { id: toastId });
    },
    onSuccess: (data) => {
      if (data.failed === 0) {
        toast.success(`Successfully deleted ${data.successful} ad(s)`, { id: toastId });
      } else {
        toast.warning(
          `Deleted ${data.successful} ad(s), ${data.failed} failed`,
          { id: toastId }
        );
      }
      queryClient.invalidateQueries({ queryKey: ["ads"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete ads", { id: toastId });
    },
  });

  return mutation;
}

