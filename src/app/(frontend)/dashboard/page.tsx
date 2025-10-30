"use client";

import React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useGetAds } from "@/features/ads/api/use-get-ads";
import { useGetOrganizations } from "@/features/organizations/api/use-get-orgs";
import { useGetUsers } from "@/features/users/api/use-get-users";
import { Car, TrendingUp, Clock, Star, Bell, Lightbulb, Building2, Users, ArrowRight } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function DashboardPage() {
  // Get user session
  const { data: session } = authClient.useSession();
  const isAdmin = (session?.user as any)?.role === "admin";

  // Request all ads for admin view
  const latestAdsQuery = useGetAds({ page: 1, limit: 5, search: "" });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto py-12 px-4">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between">
            <div className="mb-6 lg:mb-0">
              <h1 className="text-4xl font-bold text-slate-800 mb-2">Welcome back!</h1>
              <p className="text-lg text-slate-600">Here's a summary of your activity and latest ads.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/sell/new" className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-xl shadow-lg hover:from-teal-700 hover:to-teal-800 transition-all duration-200 font-medium">
                <Car className="w-5 h-5 mr-2" />
                Post New Ad
              </Link>
              <Link href="/profile" className="inline-flex items-center px-6 py-3 border-2 border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all duration-200 font-medium">
                Edit Profile
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Admin Stats Cards - Show for admin users */}
            {isAdmin && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-shadow duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="text-sm font-medium text-slate-500 mb-1">Total Ads</div>
                  <div className="text-3xl font-bold text-slate-800">{data?.pagination?.total ?? "—"}</div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-shadow duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-100 rounded-xl">
                      <Star className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <div className="text-sm font-medium text-slate-500 mb-1">Active Ads</div>
                  <div className="text-3xl font-bold text-slate-800">{ads.filter(a => a.status === "ACTIVE").length}</div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-shadow duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-100 rounded-xl">
                      <Building2 className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                  <div className="text-sm font-medium text-slate-500 mb-1">Organizations</div>
                  <div className="text-3xl font-bold text-slate-800">{orgsData?.pagination?.total ?? "—"}</div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-shadow duration-200">
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-shadow duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="text-sm font-medium text-slate-500 mb-1">Total Ads</div>
                <div className="text-3xl font-bold text-slate-800">{data?.pagination?.total ?? "—"}</div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-shadow duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <Star className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="text-sm font-medium text-slate-500 mb-1">Active Ads</div>
                <div className="text-3xl font-bold text-slate-800">{ads.filter(a => a.status === "ACTIVE").length}</div>
              </div>

                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-shadow duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-orange-100 rounded-xl">
                      <Clock className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                  <div className="text-sm font-medium text-slate-500 mb-1">Drafts</div>
                  <div className="text-3xl font-bold text-slate-800">{ads.filter(a => a.isDraft).length}</div>
                </div>
              </div>
            )}

            {/* Latest Ads */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Latest Ads</h2>
                <p className="text-slate-600">Your most recent listings</p>
              </div>

              <div className="p-6">
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                    <p className="text-slate-500">Loading your ads…</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <div className="text-red-500 mb-4">⚠️</div>
                    <p className="text-red-600 font-medium">Failed to load ads</p>
                    <p className="text-slate-500 text-sm mt-1">Please try refreshing the page</p>
                  </div>
                ) : ads.length === 0 ? (
                  <div className="text-center py-12">
                    <Car className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">No ads yet</p>
                    <p className="text-slate-400 text-sm mt-1">Create your first listing to get started</p>
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {ads.map((ad: any) => (
                      <li key={ad.id} className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors duration-200 border border-slate-100">
                        <div className="w-20 h-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                          {ad.media && ad.media.length > 0 && ad.media[0].media?.url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={ad.media[0].media.url} alt={ad.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <Car className="w-6 h-6" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-semibold text-slate-800 text-lg">{ad.title || `${ad.brand} ${ad.model}`}</div>
                              <div className="text-sm text-slate-500 mt-1">{ad.city ?? ad.province ?? "Location not specified"} • {ad.listingType}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-teal-700 font-bold text-lg">{ad.price ? `LKR ${Number(ad.price).toLocaleString()}` : "Price on request"}</div>
                              <div className="text-xs text-slate-400 mt-1">{ad.updatedAt ? format(new Date(ad.updatedAt), "MMM d, yyyy") : "—"}</div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="p-6 border-t border-slate-200 text-right">
                <Link href="/ads" className="inline-flex items-center text-teal-700 hover:text-teal-800 font-medium hover:underline transition-colors duration-200">
                  View all ads
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Organizations Section - Admin Only */}
            {isAdmin && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
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
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
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
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Recent Activity</h2>
                <p className="text-slate-600">Your latest interactions and updates</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Bell className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">New inquiry received</p>
                    <p className="text-sm text-slate-500 mt-1">Someone is interested in your Toyota Camry listing</p>
                    <p className="text-xs text-slate-400 mt-2">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Star className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Ad featured</p>
                    <p className="text-sm text-slate-500 mt-1">Your Honda Civic is now featured on the homepage</p>
                    <p className="text-xs text-slate-400 mt-2">1 day ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Ad expires soon</p>
                    <p className="text-sm text-slate-500 mt-1">Your Nissan Altima listing expires in 3 days</p>
                    <p className="text-xs text-slate-400 mt-2">2 days ago</p>
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Quick Actions</h3>
              <div className="grid gap-3">
                <Link href="/sell/new" className="flex items-center px-4 py-3 bg-teal-50 text-teal-700 rounded-xl hover:bg-teal-100 transition-colors duration-200 font-medium">
                  <Car className="w-5 h-5 mr-3" />
                  Create a new listing
                </Link>
                <Link href="/ads?boost=true" className="flex items-center px-4 py-3 bg-slate-50 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors duration-200">
                  <TrendingUp className="w-5 h-5 mr-3" />
                  Boost an ad
                </Link>
                <Link href="/ads?featured=true" className="flex items-center px-4 py-3 bg-slate-50 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors duration-200">
                  <Star className="w-5 h-5 mr-3" />
                  Feature an ad
                </Link>
              </div>
            </div>

            {/* Static Content: Tips for Sellers */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                Tips for Sellers
              </h3>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-start">
                  <span className="text-teal-500 mr-2">•</span>
                  Use high-quality photos to attract more buyers
                </li>
                <li className="flex items-start">
                  <span className="text-teal-500 mr-2">•</span>
                  Provide detailed descriptions including mileage and condition
                </li>
                <li className="flex items-start">
                  <span className="text-teal-500 mr-2">•</span>
                  Set competitive prices based on market rates
                </li>
                <li className="flex items-start">
                  <span className="text-teal-500 mr-2">•</span>
                  Respond quickly to inquiries to build trust
                </li>
              </ul>
            </div>

            {/* Help & Resources */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Help & Resources</h3>
              <ul className="space-y-3 text-sm">
                <li><a className="text-teal-700 hover:text-teal-800 hover:underline transition-colors duration-200" href="/help/listing-guidelines">Listing guidelines</a></li>
                <li><a className="text-teal-700 hover:text-teal-800 hover:underline transition-colors duration-200" href="/help/fees">Fees & Payments</a></li>
                <li><a className="text-teal-700 hover:text-teal-800 hover:underline transition-colors duration-200" href="/help/contact">Contact support</a></li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
