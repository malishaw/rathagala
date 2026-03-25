import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/rpc";
import { toast } from "sonner";

interface AdminPromoteData {
  adId: string;
  boostTypes: string[];
  bumpDays?: number;
  topAdDays?: number;
  urgentDays?: number;
  featuredDays?: number;
}

export const useAdminPromoteAd = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: AdminPromoteData) => {
      const res = await client.api.boost["admin-promote"].$post({ json: data as any });
      if (!res.ok) {
        const err = await res.json();
        throw new Error((err as any).message || "Failed to promote ad");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      queryClient.invalidateQueries({ queryKey: ["boost-requests"] });
      queryClient.invalidateQueries({ queryKey: ["boost-revenue"] });
      toast.success("Ad promoted successfully!");
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });
};
