"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { betterFetch } from "@better-fetch/fetch";
import { toast } from "sonner";
import {
  Building2,
  FileText,
  TrendingUp,
  Plus,
  ArrowLeft,
  Calendar,
  LayoutDashboard,
  Car,
  Clock,
  Eye
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PageContainer from "@/components/layouts/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetAds } from "@/features/ads/api/use-get-ads";

interface Organization {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  location?: string;
  createdAt: string;
}

export default function OrganizationDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const organizationId = params.id as string;

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isOrgLoading, setIsOrgLoading] = useState(true);

  // Fetch ads data
  const { data: adsData, isLoading: isAdsLoading } = useGetAds({ page: 1, limit: 10, search: "" });
  const ads = adsData?.ads ?? [];

  // Fetch organization data
  useEffect(() => {
    const fetchOrganization = async () => {
      setIsOrgLoading(true);
      
      try {
        const { data, error } = await betterFetch<Organization>(`/api/organizations/${organizationId}`);
        
        if (error) {
          throw new Error(error.message || "Failed to fetch organization");
        }
        
        if (data) {
          setOrganization(data);
        }
      } catch (error) {
        console.error("Error fetching organization:", error);
        toast.error("Failed to load organization details");
      } finally {
        setIsOrgLoading(false);
      }
    };
    
    if (organizationId) {
      fetchOrganization();
    }
  }, [organizationId]);

  const stats = {
    totalAds: adsData?.pagination?.total ?? 0,
    activeAds: ads.filter(ad => ad.status === "ACTIVE").length,
    draftAds: ads.filter(ad => ad.isDraft).length,
    pendingAds: ads.filter(ad => ad.status === "PENDING").length
  };

  const isLoading = isOrgLoading || isAdsLoading;

  if (isLoading) {
    return (
      <PageContainer scrollable>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!organization) {
    return (
      <PageContainer scrollable>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <h1 className="text-2xl font-semibold mb-2">Organization Not Found</h1>
          <p className="text-muted-foreground mb-6">The organization you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => router.push("/dashboard/organizations")}>Go Back</Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer scrollable>
      <div className="space-y-6 pb-8">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/dashboard/organizations")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Organization Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your organization and view analytics
            </p>
          </div>
        </div>

        {/* Organization Header Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <Avatar className="h-20 w-20 rounded-xl">
                {organization.logo ? (
                  <AvatarImage src={organization.logo} alt={organization.name} />
                ) : (
                  <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-2xl">
                    <Building2 className="h-10 w-10" />
                  </AvatarFallback>
                )}
              </Avatar>

              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{organization.name}</h2>
                    <p className="text-muted-foreground mt-1">
                      {organization.description || "Manage your organization's ads and listings"}
                    </p>
                  </div>
                  <Button asChild>
                    <Link href="/sell/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Ad
                    </Link>
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Created {format(new Date(organization.createdAt), "MMM d, yyyy")}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ads Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Ads</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAds}</div>
              <p className="text-xs text-muted-foreground mt-1">
                All listings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Ads</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activeAds}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Published & live
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Drafts</CardTitle>
              <LayoutDashboard className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.draftAds}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Unpublished
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.pendingAds}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Under review
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Ads Listing */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Ads</CardTitle>
                <CardDescription>Manage your organization's listings</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <Link href="/dashboard/ads">
                    <Eye className="h-4 w-4 mr-2" />
                    View All
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/sell/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Ad
                  </Link>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : ads.length === 0 ? (
              <div className="text-center py-12">
                <Car className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-medium text-lg">No ads yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create your first listing to get started
                </p>
                <Button className="mt-6" asChild>
                  <Link href="/sell/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Ad
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {ads.map((ad: any) => (
                  <Link 
                    key={ad.id} 
                    href={`/dashboard/ads/${ad.id}`}
                    className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors border"
                  >
                    <div className="w-24 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                      {ad.media && ad.media.length > 0 && ad.media[0].media?.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={ad.media[0].media.url} 
                          alt={ad.title} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Car className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">
                            {ad.title || `${ad.brand} ${ad.model}`}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {ad.city ?? ad.province ?? "Location not specified"} • {ad.listingType}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              ad.status === "ACTIVE" 
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                                : ad.isDraft
                                ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            }`}>
                              {ad.isDraft ? "Draft" : ad.status}
                            </span>
                            {ad.featured && (
                              <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                Featured
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-primary font-bold text-lg">
                            {ad.price ? `LKR ${Number(ad.price).toLocaleString()}` : "Price on request"}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {ad.updatedAt ? format(new Date(ad.updatedAt), "MMM d, yyyy") : "—"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
