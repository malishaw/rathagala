"use client";

import { useState } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import { useGetAds } from "@/features/ads/api/use-get-ads";
import { useGetOrganizations } from "@/features/organizations/api/use-get-orgs";
import { buildAdUrl } from "@/lib/ad-url";
import { useGetUsers } from "@/features/users/api/use-get-users";
import { getRelativeTime } from "@/lib/utils";
import { Bell, Car, Clock, Lightbulb, Building2, Users, ArrowRight, Star, TrendingUp } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

export default function DashboardPage() {
  // Get user session
  const { data: session } = authClient.useSession();
  const isAdmin = (session?.user as any)?.role === "admin";

  // Request all ads for admin view - use high limit to get accurate counts
  const latestAdsQuery = useGetAds({ page: 1, limit: 1000, search: "" });
  const { data, isLoading, error } = latestAdsQuery;

  // Fetch organizations for admin
  const { data: orgsData, isLoading: orgsLoading } = useGetOrganizations({
    page: 1,
    limit: 5,
    search: ""
  });

  // Fetch users for admin
  const { data: usersData, isLoading: usersLoading } = useGetUsers({
    page: 1,
    limit: 5,
    search: ""
  });

  const ads = data?.ads ?? [];
  const organizations = orgsData?.organizations ?? [];

  // Client-side pagination for Latest Ads
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const totalPages = Math.ceil(ads.length / ITEMS_PER_PAGE);
  const currentAds = ads.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <div className="max-w-7xl mx-auto py-8 px-4">

        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-teal-600 mb-1">Dashboard</p>
              <h1 className="text-3xl font-bold text-slate-900 mb-1">Welcome back!</h1>
              <p className="text-slate-500 text-sm">Manage your listings and grow your business</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/sell/new"
                className="group inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-medium text-sm shadow-sm shadow-teal-200"
              >
                <Car className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Post New Ad
              </Link>
              <Link
                href="/profile"
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-200 bg-white text-slate-600 rounded-xl hover:border-teal-300 hover:text-teal-700 hover:bg-teal-50 transition-all font-medium text-sm"
              >
                Edit Profile
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Admin Stats Cards */}
            {isAdmin && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <Link href="/dashboard/ads-manage" className="group bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200">
                  <div className="p-2.5 bg-blue-50 rounded-xl w-fit mb-4 group-hover:bg-blue-100 transition-colors">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Total Ads</div>
                  <div className="text-3xl font-bold text-slate-800">{data?.pagination?.total ?? "—"}</div>
                </Link>

                <Link href="/dashboard/ads-manage?status=ACTIVE" className="group bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-green-200 transition-all duration-200">
                  <div className="p-2.5 bg-green-50 rounded-xl w-fit mb-4 group-hover:bg-green-100 transition-colors">
                    <Star className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Approved</div>
                  <div className="text-3xl font-bold text-slate-800">{ads.filter(a => a.status === "ACTIVE").length}</div>
                </Link>

                <Link href="/dashboard/ads-manage?status=PENDING_REVIEW" className="group bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-amber-200 transition-all duration-200">
                  <div className="p-2.5 bg-amber-50 rounded-xl w-fit mb-4 group-hover:bg-amber-100 transition-colors">
                    <Clock className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Pending</div>
                  <div className="text-3xl font-bold text-slate-800">{ads.filter(a => a.status === "PENDING_REVIEW").length}</div>
                </Link>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="p-2.5 bg-purple-50 rounded-xl w-fit mb-4">
                    <Building2 className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Orgs</div>
                  <div className="text-3xl font-bold text-slate-800">{orgsData?.pagination?.total ?? "—"}</div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="p-2.5 bg-orange-50 rounded-xl w-fit mb-4">
                    <Users className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Users</div>
                  <div className="text-3xl font-bold text-slate-800">{usersData?.pagination?.total ?? "—"}</div>
                </div>
              </div>
            )}

            {/* Regular Stats Cards */}
            {!isAdmin && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="group relative bg-teal-600 p-6 rounded-2xl overflow-hidden hover:bg-teal-700 transition-colors duration-200 shadow-md shadow-teal-100">
                  <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
                  <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/5 rounded-full" />
                  <div className="relative">
                    <div className="p-2.5 bg-white/20 rounded-xl w-fit mb-4 group-hover:bg-white/30 transition-colors">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-xs font-semibold text-teal-100 uppercase tracking-widest mb-1.5">Total Ads</div>
                    <div className="text-4xl font-bold text-white">{data?.pagination?.total ?? "—"}</div>
                  </div>
                </div>

                <div className="group relative bg-emerald-600 p-6 rounded-2xl overflow-hidden hover:bg-emerald-700 transition-colors duration-200 shadow-md shadow-emerald-100">
                  <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
                  <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/5 rounded-full" />
                  <div className="relative">
                    <div className="p-2.5 bg-white/20 rounded-xl w-fit mb-4 group-hover:bg-white/30 transition-colors">
                      <Star className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-xs font-semibold text-emerald-100 uppercase tracking-widest mb-1.5">Active Ads</div>
                    <div className="text-4xl font-bold text-white">{ads.filter(a => a.status === "ACTIVE").length}</div>
                  </div>
                </div>

                <div className="group relative bg-orange-500 p-6 rounded-2xl overflow-hidden hover:bg-orange-600 transition-colors duration-200 shadow-md shadow-orange-100">
                  <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
                  <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/5 rounded-full" />
                  <div className="relative">
                    <div className="p-2.5 bg-white/20 rounded-xl w-fit mb-4 group-hover:bg-white/30 transition-colors">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-xs font-semibold text-orange-100 uppercase tracking-widest mb-1.5">Drafts</div>
                    <div className="text-4xl font-bold text-white">{ads.filter(a => a.isDraft).length}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Latest Ads */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Latest Ads</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Your most recent listings</p>
                </div>
              </div>

              <div className="p-5">
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-slate-100 border-t-teal-600 mx-auto mb-3"></div>
                    <p className="text-slate-400 text-sm">Loading your ads…</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <span className="text-red-400 text-xl">!</span>
                    </div>
                    <p className="text-slate-700 font-semibold text-sm">Failed to load ads</p>
                    <p className="text-slate-400 text-xs mt-1">Please try refreshing the page</p>
                  </div>
                ) : ads.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Car className="w-7 h-7 text-teal-500" />
                    </div>
                    <p className="text-slate-700 font-semibold text-sm">No ads yet</p>
                    <p className="text-slate-400 text-xs mt-1">Create your first listing to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <ul className="space-y-2">
                      {currentAds.map((ad: any) => (
                        <li key={ad.id} className="group rounded-lg border border-slate-100 hover:border-teal-200 hover:shadow-sm transition-all duration-200 bg-white hover:bg-teal-50">
                          <Link href={buildAdUrl(ad)} className="flex items-center gap-3 p-2 w-full h-full">
                            <div className="w-24 h-20 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                              {ad.media && ad.media.length > 0 && ad.media[0].media?.url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={ad.media[0].media.url} alt={ad.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                  <Car className="w-5 h-5" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-3">
                                <div className="truncate">
                                  <div className="font-semibold text-slate-800 text-sm truncate group-hover:text-teal-700 transition-colors">
                                    {ad.title || `${ad.brand} ${ad.model}`}
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs text-slate-400 truncate">{ad.city ?? ad.province ?? "Location not specified"}</span>
                                    <span className="w-1 h-1 bg-slate-300 rounded-full flex-shrink-0" />
                                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                                      ad.status === "ACTIVE"
                                        ? "bg-green-50 text-green-600"
                                        : ad.status === "PENDING_REVIEW"
                                        ? "bg-amber-50 text-amber-600"
                                        : "bg-slate-100 text-slate-500"
                                    }`}>
                                      {ad.status === "ACTIVE" ? "Active" : ad.status === "PENDING_REVIEW" ? "Pending" : ad.listingType}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <div className="text-teal-700 font-bold text-sm">
                                    {ad.price
                                      ? <>{`LKR ${Number(ad.price).toLocaleString()}`}{(ad as any).metadata?.isNegotiable && <div className="text-xs font-normal opacity-70"> Negotiable</div>}</>
                                      : ((ad as any).metadata?.isNegotiable ? "Negotiable" : "Price on request")}
                                  </div>
                                  <div className="text-[10px] text-slate-400 mt-0.5">{ad.updatedAt ? getRelativeTime(ad.updatedAt) : "—"}</div>
                                </div>
                              </div>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>

                    {totalPages > 1 && (
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                if (currentPage > 1) setCurrentPage(p => p - 1);
                              }}
                              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>

                          {Array.from({ length: totalPages }).map((_, i) => {
                            const page = i + 1;
                            if (totalPages > 7 && (page < currentPage - 1 || page > currentPage + 1) && page !== 1 && page !== totalPages) {
                              if (page === currentPage - 2 || page === currentPage + 2) {
                                return (
                                  <PaginationItem key={page}>
                                    <PaginationEllipsis />
                                  </PaginationItem>
                                );
                              }
                              return null;
                            }

                            return (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  href="#"
                                  isActive={page === currentPage}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setCurrentPage(page);
                                  }}
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          })}

                          <PaginationItem>
                            <PaginationNext
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                if (currentPage < totalPages) setCurrentPage(p => p + 1);
                              }}
                              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    )}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60">
                <Link href="/ads" className="inline-flex items-center gap-1.5 text-teal-700 hover:text-teal-600 font-semibold text-sm group">
                  View all ads
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Organizations Section - Admin Only */}
            {isAdmin && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100">
                  <h2 className="text-lg font-bold text-slate-800">Organizations</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Recent organizations</p>
                </div>

                <div className="p-5">
                  {orgsLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-slate-100 border-t-teal-600 mx-auto mb-3"></div>
                      <p className="text-slate-400 text-sm">Loading organizations…</p>
                    </div>
                  ) : organizations.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Building2 className="w-7 h-7 text-purple-400" />
                      </div>
                      <p className="text-slate-700 font-semibold text-sm">No organizations yet</p>
                      <p className="text-slate-400 text-xs mt-1">Organizations will appear here</p>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {organizations.map((org: any) => (
                        <li key={org.id} className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors duration-200 border border-slate-100 hover:border-slate-200">
                          <Avatar className="h-11 w-11 rounded-xl flex-shrink-0">
                            {org.logo ? (
                              <AvatarImage src={org.logo} alt={org.name} />
                            ) : (
                              <AvatarFallback className="rounded-xl bg-purple-50 text-purple-500">
                                <Building2 className="h-5 w-5" />
                              </AvatarFallback>
                            )}
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-800 text-sm truncate">{org.name}</div>
                                <div className="text-xs text-slate-400 mt-0.5">
                                  {org.createdAt ? getRelativeTime(org.createdAt) : "—"}
                                </div>
                              </div>
                              <Link
                                href={`/dashboard/organizations/${org.id}`}
                                className="flex-shrink-0 inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 font-medium text-xs bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition-colors"
                              >
                                View
                                <ArrowRight className="h-3 w-3" />
                              </Link>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60">
                  <Link href="/dashboard/organizations" className="inline-flex items-center gap-1.5 text-teal-700 hover:text-teal-600 font-semibold text-sm group">
                    View all organizations
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            )}

            {/* Static Content: Recent Activity */}
            {!isAdmin && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100">
                  <h2 className="text-lg font-bold text-slate-800">Recent Activity</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Your latest interactions and updates</p>
                </div>
                <div className="p-5 space-y-2">
                  <div className="flex items-start gap-4 p-4 rounded-xl border border-teal-100 bg-teal-50/40 hover:bg-teal-50 transition-colors duration-200">
                    <div className="p-2.5 bg-teal-600 rounded-xl flex-shrink-0">
                      <Bell className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">New inquiry received</p>
                      <p className="text-xs text-slate-500 mt-0.5">Someone is interested in your Toyota Camry listing</p>
                      <p className="text-xs text-teal-600 font-medium mt-1.5">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50 transition-colors duration-200">
                    <div className="p-2.5 bg-emerald-600 rounded-xl flex-shrink-0">
                      <Star className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">Ad featured</p>
                      <p className="text-xs text-slate-500 mt-0.5">Your Honda Civic is now featured on the homepage</p>
                      <p className="text-xs text-emerald-600 font-medium mt-1.5">1 day ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-xl border border-orange-100 bg-orange-50/40 hover:bg-orange-50 transition-colors duration-200">
                    <div className="p-2.5 bg-orange-500 rounded-xl flex-shrink-0">
                      <Clock className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">Ad expires soon</p>
                      <p className="text-xs text-slate-500 mt-0.5">Your Nissan Altima listing expires in 3 days</p>
                      <p className="text-xs text-orange-600 font-medium mt-1.5">2 days ago</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-5">
            {/* Quick Actions */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Quick Actions</h3>
              <div className="grid gap-2.5">
                <Link href="/sell/new" className="group flex items-center gap-2.5 px-4 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-medium text-sm shadow-sm shadow-teal-100">
                  <Car className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Create a new listing
                </Link>
                <Link href="/dashboard/ads-manage" className="flex items-center gap-2.5 px-4 py-3 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors font-medium text-sm border border-blue-100 hover:border-blue-200">
                  <TrendingUp className="w-4 h-4" />
                  Boost an ad
                </Link>
                <Link href="/dashboard/ads-manage" className="flex items-center gap-2.5 px-4 py-3 bg-orange-50 text-orange-700 rounded-xl hover:bg-orange-100 transition-colors font-medium text-sm border border-orange-100 hover:border-orange-200">
                  <Star className="w-4 h-4" />
                  Feature an ad
                </Link>
              </div>
            </div>

            {/* Tips for Sellers */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="p-1.5 bg-amber-50 rounded-lg">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                </span>
                Tips for Sellers
              </h3>
              <ul className="space-y-2 text-sm">
                {[
                  "Use high-quality photos to attract more buyers",
                  "Provide detailed descriptions including mileage and condition",
                  "Set competitive prices based on market rates",
                  "Respond quickly to inquiries to build trust",
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2.5 p-3 bg-teal-50/60 rounded-xl border border-teal-100/80 text-slate-600 hover:bg-teal-50 transition-colors">
                    <span className="flex-shrink-0 w-5 h-5 bg-teal-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Help & Resources */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Help & Resources</h3>
              <ul className="space-y-1 text-sm">
                <li>
                  <Link className="flex items-center justify-between p-3 text-slate-600 hover:text-teal-700 hover:bg-teal-50 font-medium rounded-xl transition-all duration-200 group" href="/help/listing-guidelines">
                    <span>Listing guidelines</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                </li>
                <li>
                  <Link className="flex items-center justify-between p-3 text-slate-600 hover:text-teal-700 hover:bg-teal-50 font-medium rounded-xl transition-all duration-200 group" href="/help/fees">
                    <span>Fees & Payments</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                </li>
                <li>
                  <Link className="flex items-center justify-between p-3 text-slate-600 hover:text-teal-700 hover:bg-teal-50 font-medium rounded-xl transition-all duration-200 group" href="/help/contact">
                    <span>Contact support</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
