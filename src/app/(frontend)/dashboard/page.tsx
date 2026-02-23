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
import { useGetUsers } from "@/features/users/api/use-get-users";
import { format } from "date-fns";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 p-6 mb-6 hover:border-teal-200 transition-all duration-300">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 bg-clip-text text-transparent mb-2">Welcome back!</h1>
              <p className="text-slate-600">Manage your listings and grow your business</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/sell/new" className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-xl hover:from-teal-700 hover:to-teal-800 transition-all duration-300 font-medium hover:scale-[1.02]">
                <Car className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                Post New Ad
              </Link>
              <Link href="/profile" className="inline-flex items-center px-6 py-3 border-2 border-slate-200 bg-white text-slate-700 rounded-xl hover:border-teal-300 hover:bg-teal-50 transition-all duration-300 font-medium hover:scale-[1.02]">
                Edit Profile
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Admin Stats Cards - Show for admin users */}
            {isAdmin && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="text-sm font-medium text-slate-500 mb-1">Total Ads</div>
                  <div className="text-3xl font-bold text-slate-800">{data?.pagination?.total ?? "—"}</div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-100 rounded-xl">
                      <Star className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <div className="text-sm font-medium text-slate-500 mb-1">Approved Ads</div>
                  <div className="text-3xl font-bold text-slate-800">{ads.filter(a => a.status === "ACTIVE").length}</div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-yellow-100 rounded-xl">
                      <Clock className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                  <div className="text-sm font-medium text-slate-500 mb-1">Pending Ads</div>
                  <div className="text-3xl font-bold text-slate-800">{ads.filter(a => a.status === "PENDING_REVIEW").length}</div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-100 rounded-xl">
                      <Building2 className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                  <div className="text-sm font-medium text-slate-500 mb-1">Organizations</div>
                  <div className="text-3xl font-bold text-slate-800">{orgsData?.pagination?.total ?? "—"}</div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-orange-100 rounded-xl">
                      <Users className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                  <div className="text-sm font-medium text-slate-500 mb-1">Users</div>
                  <div className="text-3xl font-bold text-slate-800">{usersData?.pagination?.total ?? "—"}</div>
                </div>
              </div>
            )}

            {/* Regular Stats Cards - Show for non-admin users */}
            {!isAdmin && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="group relative bg-gradient-to-br from-teal-500 to-teal-600 p-6 rounded-2xl overflow-hidden hover:scale-[1.02] transition-all duration-300">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-teal-100 uppercase tracking-wider mb-2">Total Ads</div>
                    <div className="text-3xl font-bold text-white">{data?.pagination?.total ?? "—"}</div>
                  </div>
                </div>

                <div className="group relative bg-gradient-to-br from-emerald-500 to-green-600 p-6 rounded-2xl overflow-hidden hover:scale-[1.02] transition-all duration-300">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl group-hover:scale-110 transition-transform">
                        <Star className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-emerald-100 uppercase tracking-wider mb-2">Active Ads</div>
                    <div className="text-3xl font-bold text-white">{ads.filter(a => a.status === "ACTIVE").length}</div>
                  </div>
                </div>

                <div className="group relative bg-gradient-to-br from-orange-500 to-amber-600 p-6 rounded-2xl overflow-hidden hover:scale-[1.02] transition-all duration-300">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl group-hover:scale-110 transition-transform">
                        <Clock className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-orange-100 uppercase tracking-wider mb-2">Drafts</div>
                    <div className="text-3xl font-bold text-white">{ads.filter(a => a.isDraft).length}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Latest Ads */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden hover:border-teal-200 transition-all duration-300">
              <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-teal-50 to-emerald-50">
                <h2 className="text-2xl font-bold text-slate-800">Latest Ads</h2>
                <p className="text-sm text-slate-600 mt-1">Your most recent listings</p>
              </div>

              <div className="p-6">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-200 border-t-teal-700 mx-auto mb-3"></div>
                    <p className="text-slate-600 text-sm">Loading your ads…</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <div className="text-red-500 mb-3 text-3xl">⚠️</div>
                    <p className="text-red-600 font-medium">Failed to load ads</p>
                    <p className="text-slate-500 text-sm mt-1">Please try refreshing the page</p>
                  </div>
                ) : ads.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Car className="w-8 h-8 text-teal-600" />
                    </div>
                    <p className="text-slate-700 font-medium">No ads yet</p>
                    <p className="text-slate-500 text-sm mt-1">Create your first listing to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <ul className="space-y-3">
                      {currentAds.map((ad: any) => (
                        <li key={ad.id} className="group relative rounded-xl hover:bg-gradient-to-r hover:from-teal-50 hover:to-emerald-50 transition-all duration-300 border border-slate-100 hover:border-teal-200">
                          <Link href={`/${ad.id}`} className="flex items-center gap-3 p-2 w-full h-full">
                            <div className="w-16 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                              {ad.media && ad.media.length > 0 && ad.media[0].media?.url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={ad.media[0].media.url} alt={ad.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                  <Car className="w-4 h-4" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div className="truncate pr-4">
                                  <div className="font-semibold text-slate-800 text-sm truncate group-hover:text-teal-700 transition-colors">{ad.title || `${ad.brand} ${ad.model}`}</div>
                                  <div className="text-xs text-slate-500 truncate">{ad.city ?? ad.province ?? "Location not specified"} • {ad.listingType}</div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <div className="text-teal-700 font-bold text-sm group-hover:text-teal-600 transition-colors">
                                    {ad.price
                                      ? <>{`LKR ${Number(ad.price).toLocaleString()}`}{(ad as any).metadata?.isNegotiable && <div className="text-lg font-normal opacity-70"> Negotiable</div>}</>
                                      : ((ad as any).metadata?.isNegotiable ? "Negotiable" : "Price on request")}
                                  </div>
                                  <div className="text-[10px] text-slate-400">{ad.updatedAt ? format(new Date(ad.updatedAt), "MMM d, yyyy") : "—"}</div>
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
                            // Simple logic to show limited page numbers could be added here if needed,
                            // for now showing all as per simple requirement, or we can limit if too many.
                            // Given "10 ads enough for one page" and unlikely to have thousands immediately displayed here,
                            // simple mapping is okay, but let's be safe with a slice if there are many.
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

              <div className="p-5 border-t border-slate-100 bg-slate-50 text-right">
                <Link href="/ads" className="inline-flex items-center text-teal-700 hover:text-teal-600 font-semibold hover:gap-2 transition-all duration-200 text-sm group">
                  View all ads
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Organizations Section - Admin Only */}
            {isAdmin && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Organizations</h2>
                  <p className="text-slate-600">Recent organizations</p>
                </div>

                <div className="p-6">
                  {orgsLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                      <p className="text-slate-500">Loading organizations…</p>
                    </div>
                  ) : organizations.length === 0 ? (
                    <div className="text-center py-12">
                      <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500 font-medium">No organizations yet</p>
                      <p className="text-slate-400 text-sm mt-1">Organizations will appear here</p>
                    </div>
                  ) : (
                    <ul className="space-y-4">
                      {organizations.map((org: any) => (
                        <li key={org.id} className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors duration-200 border border-slate-100">
                          <Avatar className="h-12 w-12 rounded-lg">
                            {org.logo ? (
                              <AvatarImage src={org.logo} alt={org.name} />
                            ) : (
                              <AvatarFallback className="rounded-lg bg-purple-100 text-purple-600">
                                <Building2 className="h-6 w-6" />
                              </AvatarFallback>
                            )}
                          </Avatar>

                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="font-semibold text-slate-800 text-lg">{org.name}</div>
                                <div className="text-sm text-slate-500 mt-1">
                                  {org.createdAt ? format(new Date(org.createdAt), "MMM d, yyyy") : "—"}
                                </div>
                              </div>
                              <Link
                                href={`/dashboard/organizations/${org.id}`}
                                className="text-teal-600 hover:text-teal-700 font-medium text-sm flex items-center gap-1"
                              >
                                View
                                <ArrowRight className="h-4 w-4" />
                              </Link>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="p-6 border-t border-slate-200 text-right">
                  <Link href="/dashboard/organizations" className="inline-flex items-center text-teal-700 hover:text-teal-800 font-medium hover:underline transition-colors duration-200">
                    View all organizations
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            )}

            {/* Users Section - Admin Only */}
            {isAdmin && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Users</h2>
                  <p className="text-slate-600">Recent user activity</p>
                </div>

                <div className="p-6">
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">User management coming soon</p>
                    <p className="text-slate-400 text-sm mt-1">View and manage all users from here</p>
                  </div>
                </div>

                <div className="p-6 border-t border-slate-200 text-right">
                  <Link href="/dashboard/users" className="inline-flex items-center text-teal-700 hover:text-teal-800 font-medium hover:underline transition-colors duration-200">
                    View all users
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            )}

            {/* Static Content: Recent Activity */}
            {!isAdmin && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden hover:border-teal-200 transition-all duration-300">
                <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-teal-50 to-emerald-50">
                  <h2 className="text-2xl font-bold text-slate-800">Recent Activity</h2>
                  <p className="text-sm text-slate-600 mt-1">Your latest interactions and updates</p>
                </div>
                <div className="p-6 space-y-3">
                  <div className="group flex items-start gap-4 p-4 bg-gradient-to-r from-teal-50 to-teal-50/50 rounded-xl hover:from-teal-100 hover:to-teal-50 transition-all duration-300 border border-teal-100">
                    <div className="p-2.5 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl group-hover:scale-110 transition-transform">
                      <Bell className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">New inquiry received</p>
                      <p className="text-xs text-slate-600 mt-1">Someone is interested in your Toyota Camry listing</p>
                      <p className="text-xs text-teal-600 font-medium mt-1">2 hours ago</p>
                    </div>
                  </div>
                  <div className="group flex items-start gap-4 p-4 bg-gradient-to-r from-emerald-50 to-emerald-50/50 rounded-xl hover:from-emerald-100 hover:to-emerald-50 transition-all duration-300 border border-emerald-100">
                    <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl group-hover:scale-110 transition-transform">
                      <Star className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">Ad featured</p>
                      <p className="text-xs text-slate-600 mt-1">Your Honda Civic is now featured on the homepage</p>
                      <p className="text-xs text-emerald-600 font-medium mt-1">1 day ago</p>
                    </div>
                  </div>
                  <div className="group flex items-start gap-4 p-4 bg-gradient-to-r from-orange-50 to-orange-50/50 rounded-xl hover:from-orange-100 hover:to-orange-50 transition-all duration-300 border border-orange-100">
                    <div className="p-2.5 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl group-hover:scale-110 transition-transform">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">Ad expires soon</p>
                      <p className="text-xs text-slate-600 mt-1">Your Nissan Altima listing expires in 3 days</p>
                      <p className="text-xs text-orange-600 font-medium mt-1">2 days ago</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white/20 hover:border-teal-200 transition-all duration-300">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Quick Actions</h3>
              <div className="grid gap-3">
                <Link href="/sell/new" className="group flex items-center px-5 py-3.5 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-xl hover:from-teal-700 hover:to-teal-800 transition-all duration-300 font-medium hover:scale-[1.02]">
                  <Car className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                  Create a new listing
                </Link>
                <Link href="/ads?boost=true" className="flex items-center px-5 py-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 text-teal-700 rounded-xl hover:from-emerald-100 hover:to-teal-100 transition-all duration-300 font-medium border border-teal-200 hover:border-teal-300">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Boost an ad
                </Link>
                <Link href="/ads?featured=true" className="flex items-center px-5 py-3.5 bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 rounded-xl hover:from-orange-100 hover:to-amber-100 transition-all duration-300 font-medium border border-orange-200 hover:border-orange-300">
                  <Star className="w-5 h-5 mr-2" />
                  Feature an ad
                </Link>
              </div>
            </div>

            {/* Static Content: Tips for Sellers */}
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white/20 hover:border-teal-200 transition-all duration-300">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg mr-2">
                  <Lightbulb className="w-5 h-5 text-yellow-600" />
                </div>
                Tips for Sellers
              </h3>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-start p-3 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl border border-teal-100 hover:border-teal-200 transition-colors">
                  <span className="text-teal-600 mr-2 mt-0.5 font-bold">•</span>
                  Use high-quality photos to attract more buyers
                </li>
                <li className="flex items-start p-3 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl border border-teal-100 hover:border-teal-200 transition-colors">
                  <span className="text-teal-600 mr-2 mt-0.5 font-bold">•</span>
                  Provide detailed descriptions including mileage and condition
                </li>
                <li className="flex items-start p-3 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl border border-teal-100 hover:border-teal-200 transition-colors">
                  <span className="text-teal-600 mr-2 mt-0.5 font-bold">•</span>
                  Set competitive prices based on market rates
                </li>
                <li className="flex items-start p-3 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl border border-teal-100 hover:border-teal-200 transition-colors">
                  <span className="text-teal-600 mr-2 mt-0.5 font-bold">•</span>
                  Respond quickly to inquiries to build trust
                </li>
              </ul>
            </div>

            {/* Help & Resources */}
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white/20 hover:border-teal-200 transition-all duration-300">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Help & Resources</h3>
              <ul className="space-y-2 text-sm">
                <li><a className="flex items-center p-3 text-slate-700 hover:text-teal-700 hover:bg-teal-50 font-medium rounded-xl transition-all duration-200 group" href="/help/listing-guidelines">
                  <span className="group-hover:translate-x-1 transition-transform">Listing guidelines</span>
                </a></li>
                <li><a className="flex items-center p-3 text-slate-700 hover:text-teal-700 hover:bg-teal-50 font-medium rounded-xl transition-all duration-200 group" href="/help/fees">
                  <span className="group-hover:translate-x-1 transition-transform">Fees & Payments</span>
                </a></li>
                <li><a className="flex items-center p-3 text-slate-700 hover:text-teal-700 hover:bg-teal-50 font-medium rounded-xl transition-all duration-200 group" href="/help/contact">
                  <span className="group-hover:translate-x-1 transition-transform">Contact support</span>
                </a></li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
