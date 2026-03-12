import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/rpc";
import { toast } from "sonner";

interface RequestBoostData {
  adId: string;
  boostTypes: string[];
  bumpDays?: number;
  topAdDays?: number;
  urgentDays?: number;
  featuredDays?: number;
}

export const useRequestBoost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: RequestBoostData) => {
      const res = await client.api.boost.request.$post({ json: data as any });
      if (!res.ok) {
        const err = await res.json();
        throw new Error((err as any).message || "Failed to request boost");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      queryClient.invalidateQueries({ queryKey: ["user-ads"] });
      toast.success("Boost requested! Pay and send the slip via WhatsApp.");
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });
};
