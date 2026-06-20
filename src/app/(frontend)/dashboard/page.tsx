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
import { Bell, Car, Clock, Lightbulb, Building2, Users, ArrowRight, Star, TrendingUp, FileText, CheckCircle } from "lucide-react";
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
    <div className="min-h-screen bg-[#fafbfc]">
      <div className="max-w-7xl mx-auto py-8 px-4">

        {/* Header Section */}
        <div className="bg-white rounded-xl border border-slate-200/60 p-6 mb-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-teal-600 mb-1">Dashboard</p>
              <h1 className="text-2xl font-bold text-slate-900 mb-0.5">Welcome back!</h1>
              <p className="text-slate-500 text-xs">Manage your listings and grow your business</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Link
                href="/sell/new"
                className="group inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-semibold text-xs"
              >
                <Car className="w-3.5 h-3.5 group-hover:scale-105 transition-transform" />
                Post New Ad
              </Link>
              <Link
                href="/profile"
                className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white text-slate-600 rounded-lg hover:border-teal-300 hover:text-teal-700 hover:bg-teal-50 transition-all font-semibold text-xs"
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
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <Link href="/dashboard/ads-manage" className="group bg-white p-5 rounded-xl border border-slate-200/60 transition-colors hover:border-blue-500/40">
                  <div className="flex items-center justify-between mb-3 text-slate-400 group-hover:text-blue-600 transition-colors">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Ads</div>
                  <div className="text-2xl font-bold text-slate-800 tracking-tight">{data?.pagination?.total ?? "—"}</div>
                </Link>

                <Link href="/dashboard/ads-manage?status=ACTIVE" className="group bg-white p-5 rounded-xl border border-slate-200/60 transition-colors hover:border-green-500/40">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-slate-400 group-hover:text-green-600 transition-colors">
                      <Star className="w-5 h-5" />
                    </div>
                    <span className="relative flex h-2 w-2 mr-0.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Live Ads</div>
                  <div className="text-2xl font-bold text-slate-800 tracking-tight">{ads.filter(a => a.status === "ACTIVE").length}</div>
                </Link>

                <Link href="/dashboard/ads-manage?status=PENDING_REVIEW" className="group bg-white p-5 rounded-xl border border-slate-200/60 transition-colors hover:border-amber-500/40">
                  <div className="flex items-center justify-between mb-3 text-slate-400 group-hover:text-amber-500 transition-colors">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Pending</div>
                  <div className="text-2xl font-bold text-slate-800 tracking-tight">{ads.filter(a => a.status === "PENDING_REVIEW").length}</div>
                </Link>

                <div className="bg-white p-5 rounded-xl border border-slate-200/60 transition-colors hover:border-purple-500/40 group cursor-default">
                  <div className="flex items-center justify-between mb-3 text-slate-400 group-hover:text-purple-600 transition-colors">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Orgs</div>
                  <div className="text-2xl font-bold text-slate-800 tracking-tight">{orgsData?.pagination?.total ?? "—"}</div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200/60 transition-colors hover:border-orange-500/40 group cursor-default">
                  <div className="flex items-center justify-between mb-3 text-slate-400 group-hover:text-orange-500 transition-colors">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Users</div>
                  <div className="text-2xl font-bold text-slate-800 tracking-tight">{usersData?.pagination?.total ?? "—"}</div>
                </div>
              </div>
            )}

            {/* Regular Stats Cards */}
            {!isAdmin && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="group bg-white p-5 rounded-xl border border-slate-200/60 transition-colors hover:border-teal-500/40">
                  <div className="flex items-center justify-between mb-3 text-slate-400 group-hover:text-teal-600 transition-colors">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Ads</div>
                  <div className="text-2xl font-bold text-slate-800 tracking-tight">{data?.pagination?.total ?? "—"}</div>
                </div>

                <div className="group bg-white p-5 rounded-xl border border-slate-200/60 transition-colors hover:border-green-500/40">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-slate-400 group-hover:text-green-600 transition-colors">
                      <Star className="w-5 h-5" />
                    </div>
                    <span className="relative flex h-2 w-2 mr-0.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Live Ads</div>
                  <div className="text-2xl font-bold text-slate-800 tracking-tight">{ads.filter(a => a.status === "ACTIVE").length}</div>
                </div>

                <div className="group bg-white p-5 rounded-xl border border-slate-200/60 transition-colors hover:border-orange-500/40">
                  <div className="flex items-center justify-between mb-3 text-slate-400 group-hover:text-orange-500 transition-colors">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Drafts</div>
                  <div className="text-2xl font-bold text-slate-800 tracking-tight">{ads.filter(a => a.isDraft).length}</div>
                </div>
              </div>
            )}

            {/* Latest Ads */}
            <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-200/60 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Latest Ads</h2>
                  <p className="text-[10px] text-slate-400 mt-0.5">Your most recent listings</p>
                </div>
              </div>

              <div className="p-5">
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-teal-600 mx-auto mb-3"></div>
                    <p className="text-slate-400 text-xs">Loading your ads…</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <div className="w-10 h-10 border border-slate-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <span className="text-red-400 text-lg">!</span>
                    </div>
                    <p className="text-slate-700 font-semibold text-xs">Failed to load ads</p>
                    <p className="text-slate-400 text-[10px] mt-1">Please try refreshing the page</p>
                  </div>
                ) : ads.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 border border-slate-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Car className="w-6 h-6 text-teal-600" />
                    </div>
                    <p className="text-slate-700 font-semibold text-xs">No ads yet</p>
                    <p className="text-slate-400 text-[10px] mt-1">Create your first listing to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <ul className="space-y-2">
                      {currentAds.map((ad: any) => (
                        <li key={ad.id} className="group rounded-lg border border-slate-200/60 hover:border-teal-500/40 transition-all duration-200 bg-white">
                          <Link href={buildAdUrl(ad)} className="flex items-center gap-3 p-2 w-full h-full">
                            <div className="w-24 h-20 bg-slate-50 rounded-lg overflow-hidden flex-shrink-0 border border-slate-100">
                              {ad.media && ad.media.length > 0 && ad.media[0].media?.url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={ad.media[0].media.url} alt={ad.title} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                  <Car className="w-5 h-5" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-3">
                                <div className="truncate">
                                  <div className="font-semibold text-slate-800 text-xs truncate group-hover:text-teal-700 transition-colors">
                                    {ad.title || `${ad.brand} ${ad.model}`}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-slate-400 truncate">{ad.city ?? ad.province ?? "Location not specified"}</span>
                                    <span className="w-1 h-1 bg-slate-300 rounded-full flex-shrink-0" />
                                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
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
                                  <div className="text-teal-700 font-bold text-xs">
                                    {ad.price
                                      ? <>{`LKR ${Number(ad.price).toLocaleString()}`}{(ad as any).metadata?.isNegotiable && <div className="text-[9px] font-normal opacity-70"> Negotiable</div>}</>
                                      : ((ad as any).metadata?.isNegotiable ? "Negotiable" : "Price on request")}
                                  </div>
                                  <div className="text-[9px] text-slate-400 mt-0.5">{ad.updatedAt ? getRelativeTime(ad.updatedAt) : "—"}</div>
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

              <div className="px-6 py-4 border-t border-slate-200/60 bg-slate-50/20">
                <Link href="/ads" className="inline-flex items-center gap-1.5 text-teal-700 hover:text-teal-600 font-semibold text-xs group">
                  View all ads
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Organizations Section - Admin Only */}
            {isAdmin && (
              <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-200/60">
                  <h2 className="text-base font-bold text-slate-800">Organizations</h2>
                  <p className="text-[10px] text-slate-400 mt-0.5">Recent organizations</p>
                </div>

                <div className="p-5">
                  {orgsLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-teal-600 mx-auto mb-3"></div>
                      <p className="text-slate-400 text-xs">Loading organizations…</p>
                    </div>
                  ) : organizations.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-12 h-12 border border-slate-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Building2 className="w-6 h-6 text-purple-600" />
                      </div>
                      <p className="text-slate-700 font-semibold text-xs">No organizations yet</p>
                      <p className="text-slate-400 text-[10px] mt-1">Organizations will appear here</p>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {organizations.map((org: any) => (
                        <li key={org.id} className="flex items-center gap-4 p-4 rounded-lg border border-slate-200/60 hover:border-slate-300 transition-colors duration-200">
                          <Avatar className="h-10 w-10 rounded-lg flex-shrink-0 border border-slate-100">
                            {org.logo ? (
                              <AvatarImage src={org.logo} alt={org.name} />
                            ) : (
                              <AvatarFallback className="rounded-lg bg-slate-50 text-slate-400 border border-slate-200/50">
                                <Building2 className="h-4 w-4" />
                              </AvatarFallback>
                            )}
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-800 text-xs truncate">{org.name}</div>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  {org.createdAt ? getRelativeTime(org.createdAt) : "—"}
                                </div>
                              </div>
                              <Link
                                href={`/dashboard/organizations/${org.id}`}
                                className="flex-shrink-0 inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 font-medium text-xs bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/50 transition-colors"
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

                <div className="px-6 py-4 border-t border-slate-200/60 bg-slate-50/20">
                  <Link href="/dashboard/organizations" className="inline-flex items-center gap-1.5 text-teal-700 hover:text-teal-600 font-semibold text-xs group">
                    View all organizations
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            )}

            {/* Static Content: Recent Activity */}
            {!isAdmin && (
              <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-200/60">
                  <h2 className="text-base font-bold text-slate-800">Recent Activity</h2>
                  <p className="text-[10px] text-slate-400 mt-0.5">Your latest interactions and updates</p>
                </div>
                <div className="p-5 space-y-2">
                  <div className="flex items-start gap-4 p-4 rounded-lg border border-slate-200/60 hover:border-teal-500/30 transition-colors duration-200 bg-white">
                    <div className="text-teal-600 flex-shrink-0 mt-0.5">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-xs">New inquiry received</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Someone is interested in your Toyota Camry listing</p>
                      <p className="text-[10px] text-teal-600 font-medium mt-1.5">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-lg border border-slate-200/60 hover:border-green-500/30 transition-colors duration-200 bg-white">
                    <div className="text-green-600 flex-shrink-0 mt-0.5">
                      <Star className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-xs">Ad featured</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Your Honda Civic is now featured on the homepage</p>
                      <p className="text-[10px] text-green-600 font-medium mt-1.5">1 day ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-lg border border-slate-200/60 hover:border-orange-500/30 transition-colors duration-200 bg-white">
                    <div className="text-orange-500 flex-shrink-0 mt-0.5">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-xs">Ad expires soon</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Your Nissan Altima listing expires in 3 days</p>
                      <p className="text-[10px] text-orange-600 font-medium mt-1.5">2 days ago</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-5">
            {/* Quick Actions */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/60">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">Quick Actions</h3>
              <div className="grid gap-2">
                <Link href="/sell/new" className="group flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-semibold text-xs">
                  <Car className="w-4 h-4 group-hover:scale-105 transition-transform" />
                  Create a new listing
                </Link>
                <Link href="/dashboard/ads-manage" className="flex items-center gap-2 px-4 py-2.5 bg-white text-blue-700 rounded-lg hover:bg-slate-50 border border-slate-200 transition-colors font-semibold text-xs">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  Boost an ad
                </Link>
                <Link href="/dashboard/ads-manage" className="flex items-center gap-2 px-4 py-2.5 bg-white text-orange-700 rounded-lg hover:bg-slate-50 border border-slate-200 transition-colors font-semibold text-xs">
                  <Star className="w-4 h-4 text-orange-500" />
                  Feature an ad
                </Link>
              </div>
            </div>

            {/* Tips for Sellers */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/60">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                Tips for Sellers
              </h3>
              <ul className="space-y-2 text-xs">
                {[
                  "Use high-quality photos to attract more buyers",
                  "Provide detailed descriptions including mileage and condition",
                  "Set competitive prices based on market rates",
                  "Respond quickly to inquiries to build trust",
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2.5 p-3 border border-slate-200/60 rounded-lg text-slate-600 hover:border-teal-500/30 transition-colors bg-white">
                    <span className="flex-shrink-0 w-4 h-4 border border-slate-300 text-slate-500 rounded-full text-[9px] font-semibold flex items-center justify-center mt-0.5">{i + 1}</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Help & Resources */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/60">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">Help & Resources</h3>
              <ul className="space-y-1 text-xs">
                <li>
                  <Link className="flex items-center justify-between p-2.5 text-slate-600 hover:text-teal-700 hover:bg-teal-50/50 font-medium rounded-lg transition-all duration-200 group" href="/help/listing-guidelines">
                    <span>Listing guidelines</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                </li>
                <li>
                  <Link className="flex items-center justify-between p-2.5 text-slate-600 hover:text-teal-700 hover:bg-teal-50/50 font-medium rounded-lg transition-all duration-200 group" href="/help/fees">
                    <span>Fees & Payments</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                </li>
                <li>
                  <Link className="flex items-center justify-between p-2.5 text-slate-600 hover:text-teal-700 hover:bg-teal-50/50 font-medium rounded-lg transition-all duration-200 group" href="/help/contact">
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
