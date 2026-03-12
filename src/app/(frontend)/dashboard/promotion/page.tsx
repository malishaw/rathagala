"use client";

import { useState, useEffect } from "react";
import { useGetBoostPricing } from "@/features/boost/api/use-get-boost-pricing";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/rpc";
import { toast } from "sonner";
import PageContainer from "@/components/layouts/page-container";
import { AppPageShell } from "@/components/layouts/page-shell";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, Star, AlertCircle, Zap, Save, Loader2 } from "lucide-react";

type BoostType = "BUMP" | "TOP_AD" | "URGENT" | "FEATURED";

const BOOST_INFO: Record<BoostType, { label: string; description: string; icon: React.ReactNode; color: string }> = {
  BUMP: {
    label: "Bump Up",
    description: "Moves ad to top of listing once per day",
    icon: <TrendingUp className="h-5 w-5" />,
    color: "text-blue-600",
  },
  TOP_AD: {
    label: "Top Ad",
    description: "Appears in 4 premium rotating slots at top of listing",
    icon: <Star className="h-5 w-5" />,
    color: "text-yellow-600",
  },
  URGENT: {
    label: "Urgent Ad",
    description: "Red Urgent badge + filter option for buyers",
    icon: <AlertCircle className="h-5 w-5" />,
    color: "text-red-600",
  },
  FEATURED: {
    label: "Featured Ad",
    description: "3-image preview + yellow highlight + maximum visibility",
    icon: <Zap className="h-5 w-5" />,
    color: "text-purple-600",
  },
};

const DAYS = [3, 7, 15];

interface PriceMap {
  [boostType: string]: {
    [days: number]: number;
  };
}

export default function PromotionAdminPage() {
  const { data: pricing, isLoading } = useGetBoostPricing();
  const queryClient = useQueryClient();
  const [prices, setPrices] = useState<PriceMap>({});

  useEffect(() => {
    if (!pricing) return;
    const map: PriceMap = {};
    (pricing as any[]).forEach((p: any) => {
      if (!map[p.boostType]) map[p.boostType] = {};
      map[p.boostType][p.days] = p.price;
    });
    setPrices(map);
  }, [pricing]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const pricesList: { boostType: string; days: number; price: number }[] = [];
      for (const boostType of Object.keys(prices)) {
        for (const days of DAYS) {
          pricesList.push({ boostType, days, price: prices[boostType]?.[days] ?? 0 });
        }
      }
      const res = await client.api.boost.pricing.$put({ json: { prices: pricesList as any } });
      if (!res.ok) throw new Error("Failed to update pricing");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boost-pricing"] });
      toast.success("Pricing updated successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handlePriceChange = (boostType: BoostType, days: number, value: string) => {
    const num = parseFloat(value) || 0;
    setPrices((prev) => ({
      ...prev,
      [boostType]: { ...(prev[boostType] ?? {}), [days]: num },
    }));
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer scrollable>
      <div className="flex flex-1 flex-col space-y-6">
        <AppPageShell
          title="Promotion Pricing"
          description="Set prices for all 4 boost types and durations"
          actionComponent={
            <Button
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save All Prices
            </Button>
          }
        />
        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(Object.keys(BOOST_INFO) as BoostType[]).map((type) => {
            const info = BOOST_INFO[type];
            return (
              <Card key={type} className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className={info.color}>{info.icon}</span>
                  <div>
                    <h3 className="font-semibold text-slate-900">{info.label}</h3>
                    <p className="text-xs text-slate-500">{info.description}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {DAYS.map((days) => (
                    <div key={days} className="flex items-center gap-3">
                      <Label className="w-20 text-sm font-medium text-slate-700">
                        {days} days
                      </Label>
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-sm text-slate-500">Rs.</span>
                        <Input
                          type="number"
                          min={0}
                          value={prices[type]?.[days] ?? ""}
                          onChange={(e) => handlePriceChange(type, days, e.target.value)}
                          className="h-9 text-sm"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-end">
          <Button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save All Prices
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
