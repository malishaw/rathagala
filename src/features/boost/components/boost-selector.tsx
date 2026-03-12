"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { useGetBoostPricing } from "@/features/boost/api/use-get-boost-pricing";
import { Zap, Star, AlertCircle, TrendingUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type BoostType = "BUMP" | "TOP_AD" | "URGENT" | "FEATURED";

export interface BoostSelection {
  boostTypes: BoostType[];
  bumpDays?: number;
  topAdDays?: number;
  urgentDays?: number;
  featuredDays?: number;
  totalAmount: number;
}

interface BoostSelectorProps {
  onChange: (selection: BoostSelection) => void;
  showPaymentDetails?: boolean;
  whatsappNumber?: string;
}

const BOOST_INFO: Record<BoostType, { label: string; description: string; icon: React.ReactNode; color: string }> = {
  BUMP: {
    label: "Bump Up",
    description: "Move your ad to the top of the listing once per day",
    icon: <TrendingUp className="h-4 w-4" />,
    color: "text-blue-600",
  },
  TOP_AD: {
    label: "Top Ad",
    description: "Appear in the 4 premium slots at the top with yellow highlight",
    icon: <Star className="h-4 w-4" />,
    color: "text-yellow-600",
  },
  URGENT: {
    label: "Urgent Ad",
    description: "Red Urgent badge — attract buyers looking for quick deals",
    icon: <AlertCircle className="h-4 w-4" />,
    color: "text-red-600",
  },
  FEATURED: {
    label: "Featured Ad",
    description: "Maximum visibility with 3-image preview and yellow highlight",
    icon: <Zap className="h-4 w-4" />,
    color: "text-purple-600",
  },
};

const DURATION_OPTIONS = [3, 7, 15];

export function BoostSelector({ onChange, showPaymentDetails = false, whatsappNumber = "0XXXXXXXXX" }: BoostSelectorProps) {
  const { data: pricing, isLoading } = useGetBoostPricing();
  const [selected, setSelected] = useState<Set<BoostType>>(new Set());
  const [durations, setDurations] = useState<Record<BoostType, number>>({
    BUMP: 7,
    TOP_AD: 7,
    URGENT: 7,
    FEATURED: 7,
  });

  const getPrice = (type: BoostType, days: number): number => {
    if (!pricing) return 0;
    const found = (pricing as any[]).find((p: any) => p.boostType === type && p.days === days);
    return found?.price ?? 0;
  };

  const totalAmount = Array.from(selected).reduce((sum, type) => {
    return sum + getPrice(type, durations[type]);
  }, 0);

  useEffect(() => {
    onChange({
      boostTypes: Array.from(selected),
      bumpDays: selected.has("BUMP") ? durations.BUMP : undefined,
      topAdDays: selected.has("TOP_AD") ? durations.TOP_AD : undefined,
      urgentDays: selected.has("URGENT") ? durations.URGENT : undefined,
      featuredDays: selected.has("FEATURED") ? durations.FEATURED : undefined,
      totalAmount,
    });
  }, [selected, durations, totalAmount]);

  const toggleType = (type: BoostType) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        if (next.size >= 3) return prev; // max 3
        next.add(type);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">Select up to 3 boost options</p>

      <div className="grid grid-cols-1 gap-3">
        {(Object.keys(BOOST_INFO) as BoostType[]).map((type) => {
          const info = BOOST_INFO[type];
          const isSelected = selected.has(type);
          const isDisabled = !isSelected && selected.size >= 3;

          return (
            <Card
              key={type}
              className={cn(
                "p-4 cursor-pointer border-2 transition-all",
                isSelected ? "border-teal-500 bg-teal-50" : "border-transparent bg-slate-50 hover:border-slate-300",
                isDisabled && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => !isDisabled && toggleType(type)}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={isSelected}
                  disabled={isDisabled}
                  onCheckedChange={() => !isDisabled && toggleType(type)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={info.color}>{info.icon}</span>
                    <span className="font-semibold text-sm">{info.label}</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{info.description}</p>

                  {isSelected && (
                    <div className="flex items-center gap-3 mt-2">
                      <Select
                        value={durations[type].toString()}
                        onValueChange={(v) => setDurations((d) => ({ ...d, [type]: parseInt(v) }))}
                      >
                        <SelectTrigger className="w-32 h-8 text-xs" onClick={(e) => e.stopPropagation()}>
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
                      <span className="text-sm font-semibold text-teal-700">
                        Rs. {getPrice(type, durations[type]).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {selected.size > 0 && (
        <div className="border-t pt-4">
          <div className="flex items-center justify-between text-base font-bold">
            <span>Total Amount</span>
            <span className="text-teal-700">Rs. {totalAmount.toLocaleString()}</span>
          </div>
        </div>
      )}

      {showPaymentDetails && selected.size > 0 && (
        <Accordion type="single" collapsible>
          <AccordionItem value="payment">
            <AccordionTrigger className="text-sm font-medium">Payment Details</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-sm text-slate-600 bg-slate-50 rounded-md p-4">
                <p className="font-semibold text-slate-800">How to pay:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Transfer <strong>Rs. {totalAmount.toLocaleString()}</strong> to the account below</li>
                  <li>Take a screenshot of the payment slip</li>
                  <li>Send it via WhatsApp to <strong>{whatsappNumber}</strong></li>
                  <li>Admin will approve your boost within 24 hours</li>
                </ol>
                <div className="mt-3 border rounded-md p-3 bg-white space-y-1">
                  <p><strong>Bank:</strong> Commercial Bank of Ceylon</p>
                  <p><strong>Account Name:</strong> Rathagala.lk</p>
                  <p><strong>Account No:</strong> 1234567890</p>
                  <p><strong>Branch:</strong> Colombo Main</p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
}
