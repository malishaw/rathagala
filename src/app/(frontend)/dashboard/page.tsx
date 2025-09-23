"use client";

import React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useGetUserAds } from "@/features/ads/api/use-get-user-ads";

export default function DashboardPage() {
  const latestAdsQuery = useGetUserAds({ page: 1, limit: 5, search: "", filterByUser: true });
  const { data, isLoading, error } = latestAdsQuery;

  const ads = data?.ads ?? [];

  return (
    <div className="max-w-7xl mx-auto py-12 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Welcome back!</h1>
          <p className="text-sm text-slate-500 mt-1">Here's a summary of your activity and latest ads.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/sell/new" className="inline-flex items-center px-4 py-2 bg-teal-700 text-white rounded-md shadow hover:bg-teal-600">Post New Ad</Link>
          <Link href="/profile" className="inline-flex items-center px-4 py-2 border border-slate-200 rounded-md hover:bg-slate-50">Edit Profile</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Quick stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-sm text-slate-500">Total Ads</div>
              <div className="text-2xl font-semibold text-slate-800">{data?.pagination?.total ?? "—"}</div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-sm text-slate-500">Active Ads</div>
              <div className="text-2xl font-semibold text-slate-800">{ads.filter(a => a.status === "ACTIVE").length}</div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-sm text-slate-500">Drafts</div>
              <div className="text-2xl font-semibold text-slate-800">{ads.filter(a => a.isDraft).length}</div>
            </div>
          </div>

          {/* Latest ads list */}
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-lg font-medium">Latest Ads</h2>
              <p className="text-sm text-slate-500 mt-1">Your most recent listings</p>
            </div>

            <div className="p-4">
              {isLoading ? (
                <div className="text-center py-8 text-slate-500">Loading ads…</div>
              ) : error ? (
                <div className="text-center py-8 text-red-600">Failed to load ads</div>
              ) : ads.length === 0 ? (
                <div className="text-center py-8 text-slate-500">You don't have any ads yet.</div>
              ) : (
                <ul className="space-y-3">
                  {ads.map((ad: any) => (
                    <li key={ad.id} className="flex items-center gap-4 p-3 rounded hover:bg-slate-50">
                      <div className="w-20 h-14 bg-slate-100 rounded overflow-hidden flex-shrink-0">
                        {ad.media && ad.media.length > 0 && ad.media[0].media?.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={ad.media[0].media.url} alt={ad.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">📷</div>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium text-slate-800">{ad.title || ad.brand + ' ' + ad.model}</div>
                            <div className="text-sm text-slate-500">{ad.city ?? ad.province ?? "—"} • {ad.listingType}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-teal-700 font-semibold">{ad.price ? `LKR ${Number(ad.price).toLocaleString()}` : "Price on request"}</div>
                            <div className="text-xs text-slate-400">{ad.updatedAt ? format(new Date(ad.updatedAt), "MMM d") : "—"}</div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="p-3 border-t text-right">
              <Link href="/ads" className="text-sm text-teal-700 hover:underline">View all my ads</Link>
            </div>
          </div>
        </div>

        {/* Right column - activity / help */}
        <aside className="space-y-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h3 className="text-sm text-slate-500">Quick Actions</h3>
            <div className="mt-3 grid gap-2">
              <Link href="/sell/new" className="px-3 py-2 bg-slate-50 rounded hover:bg-slate-100">Create a new listing</Link>
              <Link href="/ads?boost=true" className="px-3 py-2 bg-slate-50 rounded hover:bg-slate-100">Boost an ad</Link>
              <Link href="/ads?featured=true" className="px-3 py-2 bg-slate-50 rounded hover:bg-slate-100">Feature an ad</Link>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h3 className="text-sm text-slate-500">Help & Resources</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li><a className="text-teal-700 hover:underline" href="/help/listing-guidelines">Listing guidelines</a></li>
              <li><a className="text-teal-700 hover:underline" href="/help/fees">Fees & Payments</a></li>
              <li><a className="text-teal-700 hover:underline" href="/help/contact">Contact support</a></li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
