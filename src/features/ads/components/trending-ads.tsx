"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useGetTrendingAds } from "../api/use-get-trending-ads";

export function TrendingAds() {
  const { data: trendingAds, isLoading, error } = useGetTrendingAds(10);

  if (error) {
    return null; // Don't show if error
  }

  return (
    <Card className="p-4 bg-white border border-slate-100 rounded-xl shadow-none">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-teal-600" />
        <h3 className="font-semibold text-slate-800">Trending Ads</h3>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <Skeleton className="w-12 h-12 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))
        ) : trendingAds && trendingAds.length > 0 ? (
          trendingAds.map((ad: any) => (
            <Link
              key={ad.id}
              href={`/${ad.id}`}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group"
            >
              <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                {ad.media && ad.media.length > 0 ? (
                  <img
                    src={ad.media[0].url}
                    alt={ad.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                    <span className="text-xs text-slate-400">No img</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-slate-800 truncate group-hover:text-teal-700">
                  {ad.title}
                </h4>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{ad.price ? `Rs. ${ad.price.toLocaleString()}` : 'Price on request'}</span>
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>{ad.analytics?.views || 0}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-slate-500">No trending ads yet</p>
          </div>
        )}
      </div>
    </Card>
  );
}