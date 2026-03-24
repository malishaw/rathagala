"use client";

import { useGetBoostPricing } from "@/features/boost/api/use-get-boost-pricing";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  TrendingUp,
  Star,
  AlertCircle,
  Zap,
  Loader2,
  Check,
  Clock,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import { useMemo } from "react";

type BoostType = "BUMP" | "TOP_AD" | "URGENT" | "FEATURED";

const BOOST_INFO: Record<
  BoostType,
  {
    label: string;
    description: string;
    features: string[];
    icon: React.ReactNode;
    color: string;
    bg: string;
    border: string;
    badgeBg: string;
  }
> = {
  URGENT: {
    label: "Urgent",
    description: "Grab immediate attention with a bold Urgent badge on your ad",
    features: [
      "Red Urgent badge on your ad",
      "Appears in Urgent filter results",
      "Higher visibility to serious buyers",
    ],
    icon: <AlertCircle className="h-6 w-6" />,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    badgeBg: "bg-red-100 text-red-700",
  },
  FEATURED: {
    label: "Featured",
    description: "Maximum visibility with highlighted listing and image preview",
    features: [
      "2-image preview in listings",
      "Yellow highlighted background",
      "Maximum visibility boost",
    ],
    icon: <Zap className="h-6 w-6" />,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    badgeBg: "bg-purple-100 text-purple-700",
  },
  TOP_AD: {
    label: "Top Ad",
    description: "Your ad rotates in the premium top slots of the listing page",
    features: [
      "Premium top placement",
      "Rotates in 2 featured slots",
      "First thing buyers see",
    ],
    icon: <Star className="h-6 w-6" />,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    badgeBg: "bg-yellow-100 text-yellow-700",
  },
  BUMP: {
    label: "Bump Up",
    description: "Push your ad back to the top of search results daily",
    features: [
      "Moves ad to top of listings",
      "Refreshed position daily",
      "Stay ahead of new ads",
    ],
    icon: <TrendingUp className="h-6 w-6" />,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    badgeBg: "bg-blue-100 text-blue-700",
  },
};

const ORDER: BoostType[] = ["URGENT", "FEATURED", "TOP_AD", "BUMP"];

export default function PaymentsPage() {
  const { data: pricing, isLoading } = useGetBoostPricing();

  type PricingEntry = { boostType: string; days: number; price: number };

  const priceMap = useMemo(() => {
    const map: Record<string, Record<number, number>> = {};
    if (!pricing) return map;
    (pricing as PricingEntry[]).forEach((p) => {
      if (!map[p.boostType]) map[p.boostType] = {};
      map[p.boostType][p.days] = p.price;
    });
    return map;
  }, [pricing]);

  // Collect all unique day options sorted
  const allDays = useMemo(() => {
    const set = new Set<number>();
    if (pricing) {
      (pricing as PricingEntry[]).forEach((p) => set.add(p.days));
    }
    return Array.from(set).sort((a, b) => a - b);
  }, [pricing]);

  return (
    <div>
      {/* Hero */}
      <section className="relative py-16 md:py-24 bg-gradient-to-r from-teal-900 via-teal-800 to-teal-700 text-white overflow-hidden">
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <div className="absolute -right-40 -top-40 w-80 h-80 bg-teal-400 rounded-full" />
          <div className="absolute -left-20 bottom-10 w-60 h-60 bg-teal-300 rounded-full" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-heading">
              Promotion Packages
            </h1>
            <p className="text-xl text-teal-100 mb-2">
              Boost your ad&apos;s visibility and sell faster on Rathagala.lk
            </p>
            <p className="text-teal-200 text-sm">
              Choose a promotion type and duration that fits your needs
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 text-center mb-8">
              How It Works
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  icon: <CreditCard className="h-8 w-8 text-teal-600" />,
                  title: "Choose & Pay",
                  desc: "Select a promotion type and duration, then make the payment",
                },
                {
                  icon: <Clock className="h-8 w-8 text-teal-600" />,
                  title: "Quick Activation",
                  desc: "Your promotion is activated after admin approval",
                },
                {
                  icon: <ShieldCheck className="h-8 w-8 text-teal-600" />,
                  title: "Get Results",
                  desc: "Your ad gets more views and reaches more buyers",
                },
              ].map((step, i) => (
                <div key={i} className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-50 mb-4">
                    {step.icon}
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-1">{step.title}</h3>
                  <p className="text-sm text-slate-500">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 text-center mb-2">
              Promotion Types & Pricing
            </h2>
            <p className="text-slate-500 text-center mb-10">
              All prices are in LKR. You can combine multiple promotions on a single ad.
            </p>

            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ORDER.map((type) => {
                  const info = BOOST_INFO[type];
                  const typePrices = priceMap[type] || {};

                  return (
                    <Card
                      key={type}
                      className={`overflow-hidden border ${info.border}`}
                    >
                      {/* Card Header */}
                      <div className={`${info.bg} px-6 py-5`}>
                        <div className="flex items-center gap-3">
                          <div className={info.color}>{info.icon}</div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-800">
                              {info.label}
                            </h3>
                            <p className="text-sm text-slate-500">
                              {info.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="px-6 py-5">
                        {/* Features */}
                        <ul className="space-y-2 mb-5">
                          {info.features.map((f, i) => (
                            <li
                              key={i}
                              className="flex items-center gap-2 text-sm text-slate-600"
                            >
                              <Check className={`h-4 w-4 flex-shrink-0 ${info.color}`} />
                              {f}
                            </li>
                          ))}
                        </ul>

                        <Separator className="mb-5" />

                        {/* Pricing by duration */}
                        <div className="space-y-3">
                          {allDays.map((days) => {
                            const price = typePrices[days];
                            if (price === undefined) return null;
                            return (
                              <div
                                key={days}
                                className="flex items-center justify-between rounded-lg border px-4 py-3"
                              >
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-slate-400" />
                                  <span className="text-sm font-medium text-slate-700">
                                    {days} Days
                                  </span>
                                </div>
                                <Badge
                                  variant="secondary"
                                  className={`text-sm font-bold ${info.badgeBg}`}
                                >
                                  Rs. {price.toLocaleString()}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Contact / Note */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-xl font-bold text-slate-800 mb-3">
              Need Help?
            </h2>
            <p className="text-slate-500 text-sm">
              To promote your ad, go to your ad listing and click the &quot;Boost&quot; button.
              You can select one or more promotion types and your preferred duration.
              For any questions, feel free to contact us.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
