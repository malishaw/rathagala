"use client";

import { useState } from "react";
import { useGetRevenue } from "@/features/boost/api/use-get-revenue";
import PageContainer from "@/components/layouts/page-container";
import { AppPageShell } from "@/components/layouts/page-shell";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Star, AlertCircle, Zap, DollarSign, Loader2 } from "lucide-react";
import { getRelativeTime } from "@/lib/utils";

type RevenueFilter = "today" | "7days" | "30days" | "all";

const BOOST_LABELS: Record<string, string> = {
  BUMP: "Bump Up",
  TOP_AD: "Top Ad",
  URGENT: "Urgent",
  FEATURED: "Featured",
};

export default function RevenueAdminPage() {
  const [filter, setFilter] = useState<RevenueFilter>("all");
  const { data, isLoading } = useGetRevenue(filter);

  const cards = [
    {
      label: "Bump Up",
      icon: <TrendingUp className="h-5 w-5 text-blue-500" />,
      amount: data?.bumpRevenue ?? 0,
      bg: "bg-blue-50 border-blue-200",
    },
    {
      label: "Top Ad",
      icon: <Star className="h-5 w-5 text-yellow-500" />,
      amount: data?.topAdRevenue ?? 0,
      bg: "bg-yellow-50 border-yellow-200",
    },
    {
      label: "Urgent Ad",
      icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      amount: data?.urgentRevenue ?? 0,
      bg: "bg-red-50 border-red-200",
    },
    {
      label: "Featured Ad",
      icon: <Zap className="h-5 w-5 text-purple-500" />,
      amount: data?.featuredRevenue ?? 0,
      bg: "bg-purple-50 border-purple-200",
    },
  ];

  return (
    <PageContainer scrollable>
      <div className="flex flex-1 flex-col space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <AppPageShell
            title="Revenue"
            description="Track revenue from boost promotions"
            actionComponent={<div />}
          />
          <Select value={filter} onValueChange={(v) => setFilter(v as RevenueFilter)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Separator />

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          </div>
        ) : (
          <>
            {/* Total Revenue */}
            <Card className="p-6 bg-teal-900 text-white border-0">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 opacity-80" />
                <div>
                  <p className="text-teal-200 text-sm font-medium">Total Revenue</p>
                  <p className="text-3xl font-bold">Rs. {(data?.totalRevenue ?? 0).toLocaleString()}</p>
                </div>
              </div>
            </Card>

            {/* Per-Boost Revenue Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {cards.map((card) => (
                <Card key={card.label} className={`p-5 border ${card.bg}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {card.icon}
                    <span className="text-sm font-medium text-slate-700">{card.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    Rs. {card.amount.toLocaleString()}
                  </p>
                </Card>
              ))}
            </div>

            {/* Revenue Records Table */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Revenue Records</h3>
              {!data?.records || data.records.length === 0 ? (
                <Card className="p-8 text-center text-slate-500">
                  No revenue records found for this period.
                </Card>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-slate-700">Ad</th>
                        <th className="text-left px-4 py-3 font-medium text-slate-700">User</th>
                        <th className="text-left px-4 py-3 font-medium text-slate-700">Boost Types</th>
                        <th className="text-right px-4 py-3 font-medium text-slate-700">Amount</th>
                        <th className="text-left px-4 py-3 font-medium text-slate-700">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(data.records as any[]).map((record: any) => (
                        <tr key={record.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <span className="font-medium text-slate-800">
                              {record.boostRequest?.ad?.brand} {record.boostRequest?.ad?.model}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {record.boostRequest?.user?.name || "—"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {(record.boostTypes as string[]).map((t) => (
                                <Badge key={t} variant="secondary" className="text-xs">
                                  {BOOST_LABELS[t] || t}
                                </Badge>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-teal-700">
                            Rs. {record.totalAmount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            {getRelativeTime(record.recordedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </PageContainer>
  );
}
