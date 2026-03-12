import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/rpc";
import { toast } from "sonner";

interface ApproveBoostData {
  boostRequestId: string;
  boostTypes?: string[];
  bumpDays?: number;
  topAdDays?: number;
  urgentDays?: number;
  featuredDays?: number;
}

export const useApproveBoost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ApproveBoostData) => {
      const res = await client.api.boost.approve.$post({ json: data as any });
      if (!res.ok) {
        const err = await res.json();
        throw new Error((err as any).message || "Failed to approve boost");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      queryClient.invalidateQueries({ queryKey: ["boost-requests"] });
      queryClient.invalidateQueries({ queryKey: ["boost-revenue"] });
      toast.success("Boost approved and activated!");
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });
};
