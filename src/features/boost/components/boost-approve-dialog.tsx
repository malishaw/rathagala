"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";
import { useApproveBoost } from "@/features/boost/api/use-approve-boost";
import { useGetBoostPricing } from "@/features/boost/api/use-get-boost-pricing";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, TrendingUp, Star, AlertCircle, Zap } from "lucide-react";
import { getRelativeTime } from "@/lib/utils";

type BoostType = "BUMP" | "TOP_AD" | "URGENT" | "FEATURED";

const BOOST_LABELS: Record<BoostType, string> = {
  BUMP: "Bump Up",
  TOP_AD: "Top Ad",
  URGENT: "Urgent Ad",
  FEATURED: "Featured Ad",
};

const BOOST_ICONS: Record<BoostType, React.ReactNode> = {
  BUMP: <TrendingUp className="h-4 w-4 text-blue-500" />,
  TOP_AD: <Star className="h-4 w-4 text-yellow-500" />,
  URGENT: <AlertCircle className="h-4 w-4 text-red-500" />,
  FEATURED: <Zap className="h-4 w-4 text-purple-500" />,
};

const DURATION_OPTIONS = [3, 7, 15];

interface BoostApproveDialogProps {
  adId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BoostApproveDialog({ adId, open, onOpenChange }: BoostApproveDialogProps) {
  const { data: pricing } = useGetBoostPricing();
  const approveBoost = useApproveBoost();

  const { data, isLoading } = useQuery({
    queryKey: ["boost-request-for-ad", adId],
    queryFn: async () => {
      const res = await client.api.boost.ad[":adId"].$get({ param: { adId } });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: open,
  });

  const boostRequest = (data as any)?.boostRequest;

  const [selectedTypes, setSelectedTypes] = useState<Set<BoostType>>(new Set());
  const [durations, setDurations] = useState<Record<BoostType, number>>({
    BUMP: 7,
    TOP_AD: 7,
    URGENT: 7,
    FEATURED: 7,
  });

  useEffect(() => {
    if (boostRequest) {
      setSelectedTypes(new Set(boostRequest.boostTypes as BoostType[]));
      setDurations({
        BUMP: boostRequest.bumpDays ?? 7,
        TOP_AD: boostRequest.topAdDays ?? 7,
        URGENT: boostRequest.urgentDays ?? 7,
        FEATURED: boostRequest.featuredDays ?? 7,
      });
    }
  }, [boostRequest]);

  const getPrice = (type: BoostType, days: number): number => {
    if (!pricing) return 0;
    const found = (pricing as any[]).find((p: any) => p.boostType === type && p.days === days);
    return found?.price ?? 0;
  };

  const totalAmount = Array.from(selectedTypes).reduce(
    (sum, type) => sum + getPrice(type, durations[type]),
    0
  );

  const toggleType = (type: BoostType) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else if (next.size < 3) next.add(type);
      return next;
    });
  };

  const handleConfirm = () => {
    if (!boostRequest) return;
    approveBoost.mutate(
      {
        boostRequestId: boostRequest.id,
        boostTypes: Array.from(selectedTypes),
        bumpDays: selectedTypes.has("BUMP") ? durations.BUMP : undefined,
        topAdDays: selectedTypes.has("TOP_AD") ? durations.TOP_AD : undefined,
        urgentDays: selectedTypes.has("URGENT") ? durations.URGENT : undefined,
        featuredDays: selectedTypes.has("FEATURED") ? durations.FEATURED : undefined,
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Boost Approval</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
          </div>
        ) : !boostRequest ? (
          <p className="text-sm text-slate-500 py-4">No boost request found for this ad.</p>
        ) : (
          <div className="space-y-4">
            <div className="text-xs text-slate-500">
              Requested: {getRelativeTime(boostRequest.requestedAt)}
            </div>


            <div className="space-y-3">
              {(["BUMP", "TOP_AD", "URGENT", "FEATURED"] as BoostType[]).map((type) => {
                const isSelected = selectedTypes.has(type);
                const isDisabled = !isSelected && selectedTypes.size >= 3;
                return (
                  <div key={type} className="flex items-center gap-3 p-3 rounded-lg border bg-slate-50">
                    <Checkbox
                      checked={isSelected}
                      disabled={isDisabled}
                      onCheckedChange={() => toggleType(type)}
                    />
                    <div className="flex items-center gap-2 flex-1">
                      {BOOST_ICONS[type]}
                      <Label className="font-medium text-sm cursor-pointer" onClick={() => !isDisabled && toggleType(type)}>
                        {BOOST_LABELS[type]}
                      </Label>
                    </div>
                    {isSelected && (
                      <Select
                        value={durations[type].toString()}
                        onValueChange={(v) => setDurations((d) => ({ ...d, [type]: parseInt(v) }))}
                      >
                        <SelectTrigger className="w-36 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DURATION_OPTIONS.map((days) => (
                            <SelectItem key={days} value={days.toString()}>
                              {days} days — Rs. {getPrice(type, days).toLocaleString()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between font-semibold text-sm border-t pt-3">
              <span>Total Amount</span>
              <span className="text-teal-700">Rs. {totalAmount.toLocaleString()}</span>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={approveBoost.isPending || !boostRequest || selectedTypes.size === 0}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            {approveBoost.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Confirm Boost
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
