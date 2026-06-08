"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { buildAdUrl } from "@/lib/ad-url";
import { BrandCarouselSection } from "@/components/ui/brand-carousel-section";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { getRelativeTime } from "@/lib/utils";
import { Filter, Loader2, Search, X, Eye, TrendingUp, Star, AlertCircle, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BoostBadges } from "@/features/boost/components/boost-badges";
import { TopAdCard } from "@/features/ads/components/top-ad-card";
import { FeaturedAdCard } from "@/features/ads/components/featured-ad-card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

// Import the existing hook
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGetAds } from "@/features/ads/api/use-get-ads";
import { useGetOrganizations } from "@/features/organizations/api/use-get-orgs";
import { FavoriteButton } from "@/features/saved-ads/components/favorite-button";

import { authClient } from "@/lib/auth-client";

import { useLocations } from "@/hooks/use-locations";
import { vehicleTypeLabels, vehicleMakes } from "@/lib/vehicle-constants";
import { formatAdTitle, shuffleArray, getRotatingSlice, getAdSortTime, interleaveFeaturedAds } from "@/lib/ad-helpers";

// Define filter state interface with updated fields
interface FilterState {
  make: string | null;
  model: string | null;
  vehicleType: string | null;
  city: string | null;
  district: string | null;
  condition: string | null;

  // Advanced filters
  minYear: string | null;
  maxYear: string | null;
  minPrice: string | null;
  maxPrice: string | null;
  fuelType: string | null;
  transmission: string | null;
}

export default function VehicleMarketplace() {
  const { locationData, allCities: sriLankanCities, allDistricts: sriLankanDistricts } = useLocations();
  const [cityQuery, setCityQuery] = useState("");
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("default");

  // Check authentication
  const { data: session } = authClient.useSession();
  const user = session?.user;

  // Initialize filter state (pending filters)
  const [filters, setFilters] = useState<FilterState>({
    make: null,
    model: null,
    vehicleType: null,
    city: null,
    district: null,
    condition: null,
    minYear: null,
    maxYear: null,
    minPrice: null,
    maxPrice: null,
    fuelType: null,
    transmission: null
  });

  // Add new state for active filters (applied filters)
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    make: null,
    model: null,
    vehicleType: null,
    city: null,
    district: null,
    condition: null,
    minYear: null,
    maxYear: null,
    minPrice: null,
    maxPrice: null,
    fuelType: null,
    transmission: null
  });

  // Track if filters are active
  const hasActiveFilters = Object.values(activeFilters).some(
    (value) => value !== null
  );

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [allAds, setAllAds] = useState<any[]>([]);

  // Featured ad rotation (every 1 minute)
  const [featuredRotationIndex, setFeaturedRotationIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setFeaturedRotationIndex((i) => i + 1), 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Must be defined before useGetAds hooks that depend on it
  const isSearchActive = searchQuery.trim().length > 0;

  // 1. Fetch Top Ads Pool (limit: 20, topAdActive)
  const { data: topAdsData } = useGetAds({
    page: 1,
    limit: 20,
    topAdActive: "true",
  }, {
    enabled: sortBy === "default" && !isSearchActive
  });

  // 2. Fetch Featured Ads Pool (limit: 20, featuredActive)
  const { data: featuredAdsData } = useGetAds({
    page: 1,
    limit: 20,
    featuredActive: "true",
  }, {
    enabled: sortBy === "default" && !isSearchActive
  });

  // 3. Fetch Main paginated ads feed with active filters
  const { data, isLoading, error } = useGetAds({
    page: currentPage,
    limit: 12,
    search: searchQuery || undefined,
    listingType: "SELL",
    brand: activeFilters.make || undefined,
    model: activeFilters.model || undefined,
    type: activeFilters.vehicleType || undefined,
    condition: activeFilters.condition || undefined,
    minPrice: activeFilters.minPrice ? parseInt(activeFilters.minPrice) : undefined,
    maxPrice: activeFilters.maxPrice ? parseInt(activeFilters.maxPrice) : undefined,
    minYear: activeFilters.minYear || undefined,
    maxYear: activeFilters.maxYear || undefined,
    fuelType: activeFilters.fuelType || undefined,
    transmission: activeFilters.transmission || undefined,
    city: activeFilters.city || undefined,
    district: activeFilters.district || undefined,
  });

  // Accumulate ads when new data arrives
  useEffect(() => {
    if (data?.ads && data.ads.length >= 0) {
      if (currentPage === 1) {
        // Reset to first page results (even if empty)
        setAllAds(data.ads);
      } else if (currentPage > 1) {
        // Append new ads to existing ones (avoid duplicates)
        setAllAds((prevAds) => {
          const existingIds = new Set(prevAds.map((ad) => ad.id));
          const newAds = data.ads.filter((ad) => !existingIds.has(ad.id));
          if (newAds.length > 0) {
            return [...prevAds, ...newAds];
          }
          return prevAds;
        });
      }
    }
  }, [data, currentPage]);

  // Reset pagination when filters or search change
  useEffect(() => {
    setCurrentPage(1);
    // Don't clear allAds here - let the data fetch update it
  }, [activeFilters, searchQuery]);

  // Handle load more
  const handleLoadMore = () => {
    if (data && data.pagination && currentPage < data.pagination.totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  // Apply filters and search to the accumulated data
  // Also ensure only ACTIVE ads are shown (safety filter in case backend doesn't filter correctly)
  const filteredAds = useMemo(() => {
    if (!allAds || allAds.length === 0) return [];
    return allAds;
  }, [allAds]);

  // Apply sorting to filtered ads
  const sortedAds = useMemo(() => {
    if (!filteredAds || filteredAds.length === 0) return [];
    
    const ads = [...filteredAds];
    const now = Date.now();

    switch (sortBy) {
      case "price-low":
        return ads.sort((a, b) => (a.price || 0) - (b.price || 0));
      case "price-high":
        return ads.sort((a, b) => (b.price || 0) - (a.price || 0));
      case "year":
        return ads.sort((a, b) => (b.manufacturedYear || 0) - (a.manufacturedYear || 0));
      case "newest":
        return ads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case "default":
      default: {
        const isBoosted = (ad: typeof ads[number]) =>
          Boolean((ad as Record<string, unknown>)?.topAdActive || (ad as Record<string, unknown>)?.featuredActive || (ad as Record<string, unknown>)?.bumpActive || (ad as Record<string, unknown>)?.urgentActive);
        return ads.sort((a, b) => {
          if (searchQuery.trim()) {
            const aBoosted = isBoosted(a);
            const bBoosted = isBoosted(b);
            if (aBoosted && !bBoosted) return -1;
            if (!aBoosted && bBoosted) return 1;
          }
          const timeDiff = getAdSortTime(b, now) - getAdSortTime(a, now);
          if (timeDiff !== 0) return timeDiff;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      }
    }
  }, [filteredAds, sortBy, searchQuery]);

  const topAdsPool = useMemo(() => {
    return topAdsData?.ads || [];
  }, [topAdsData]);

  const shuffledTopAdsPool = useMemo(() => shuffleArray(topAdsPool), [topAdsPool]);

  const displayedTopAds = useMemo(() => {
    if (shuffledTopAdsPool.length === 0) return [];
    return getRotatingSlice(shuffledTopAdsPool, featuredRotationIndex, 2);
  }, [shuffledTopAdsPool, featuredRotationIndex]);

  // Featured ads pool (for rotation)
  const featuredAdsPool = useMemo(() => {
    return featuredAdsData?.ads || [];
  }, [featuredAdsData]);

  const shuffledFeaturedAdsPool = useMemo(() => shuffleArray(featuredAdsPool), [featuredAdsPool]);

  // 2 rotating featured ads
  const displayedFeaturedAds = useMemo(() => {
    if (shuffledFeaturedAdsPool.length === 0) return [];
    return getRotatingSlice(shuffledFeaturedAdsPool, featuredRotationIndex, 2);
  }, [shuffledFeaturedAdsPool, featuredRotationIndex]);

  const featuredInsertPool = useMemo(() => {
    return shuffledFeaturedAdsPool.filter((ad) => !(ad as any).topAdActive);
  }, [shuffledFeaturedAdsPool]);

  // isSearchActive is defined earlier (above the useGetAds hooks)

  const baseAds = useMemo(() => {
    if (sortBy !== "default" || isSearchActive) return sortedAds;
    return sortedAds.filter((ad) => !(ad as any).featuredActive && !(ad as any).topAdActive);
  }, [sortedAds, sortBy, isSearchActive]);

  const interleavedAds = useMemo(() => {
    if (baseAds.length === 0) return [];
    if (sortBy !== "default" || isSearchActive || featuredInsertPool.length === 0) return baseAds;
    return interleaveFeaturedAds(baseAds, featuredInsertPool, featuredRotationIndex, 16);
  }, [baseAds, featuredInsertPool, featuredRotationIndex, sortBy, isSearchActive]);

  // Featured Ads Carousel (latest 6 - featured only, no other promotions)
  const featuredBoostedAds = useMemo(() => {
    return allAds
      .filter((ad) => {
        const isFeatured = (ad as any).featuredActive;
        const hasOtherPromotion = (ad as any).topAdActive || (ad as any).bumpActive || (ad as any).urgentActive;
        return isFeatured && !hasOtherPromotion && ad.status === "ACTIVE" && (ad as any).published;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);
  }, [allAds]);

  // Handle filter changes - only updates pending filters
  const handleFilterChange = (
    filterName: keyof FilterState,
    value: string | null
  ) => {
    setFilters((prev) => {
      const newFilters = {
        ...prev,
        [filterName]: value === "any" ? null : value
      };

      // If min year is changed, reset max year if it's less than the new min year
      if (filterName === "minYear" && value && value !== "any") {
        const minYearValue = parseInt(value);
        if (prev.maxYear && parseInt(prev.maxYear) < minYearValue) {
          newFilters.maxYear = null;
        }
      }

      return newFilters;
    });
  };

  // Apply all current filters
  const applyFilters = () => {
    setActiveFilters(filters);
  };

  // Clear all filters
  const clearFilters = () => {
    const emptyFilters = {
      make: null,
      model: null,
      vehicleType: null,
      city: null,
      district: null,
      condition: null,
      minYear: null,
      maxYear: null,
      minPrice: null,
      maxPrice: null,
      fuelType: null,
      transmission: null
    };

    setFilters(emptyFilters);
    setActiveFilters(emptyFilters);
    setSearchQuery(""); // Also clear search query
  };

  // Format price for display
  const formatPrice = (price: number | null, isNegotiable = false) => {
    if (price === null && isNegotiable) return "Negotiable";
    if (price === null) return "Price on request";
    const formatted = `Rs. ${price.toLocaleString()}`;
    if (isNegotiable) {
      return <>{formatted}<div className="text-sm font-normal opacity-70"> Negotiable</div></>;
    }
    return formatted;
  };

  // Generate year options
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 30 }, (_, i) => currentYear - i);
  }, []);

  // Generate filtered max year options based on selected min year
  const maxYearOptions = useMemo(() => {
    if (!filters.minYear) {
      return years;
    }
    const minYearValue = parseInt(filters.minYear);
    return years.filter(year => year >= minYearValue);
  }, [years, filters.minYear]);

  // Derive districts and cities logic
  const availableCities = useMemo(() => {
    if (!filters.district || filters.district === "any") return sriLankanCities;

    // Find province for district
    let districtCities: string[] = [];
    Object.values(locationData).forEach(province => {
      Object.entries(province).forEach(([district, cities]) => {
        if (district.toLowerCase() === filters.district?.toLowerCase()) {
          districtCities = cities;
        }
      });
    });

    return districtCities.length > 0 ? districtCities.sort() : sriLankanCities;
  }, [filters.district]);

  function FeaturedDealers() {
    const [showAllDealers, setShowAllDealers] = useState(false);
    const { data, isLoading, error } = useGetOrganizations({
      limit: 3,
      // Add filter parameters for featured organizations if your API supports it
    });

    // For all organizations in the modal
    const { data: allOrgsData, isLoading: allOrgsLoading } = useGetOrganizations({
      limit: 50, // Fetch more organizations for the modal view
    });

    // Define organization type
    type Organization = {
      id: string;
      name?: string;
      logo?: string | null;
      verified?: boolean;
      _count?: {
        ads: number;
      };
    };

    // Organization card component to reuse in both views
    const OrganizationCard = ({ org }: { org: Organization }) => (
      <div
        className="flex items-center space-x-3 p-3 bg-slate-50/60 hover:bg-teal-50/30 border border-slate-150/40 hover:border-teal-500/10 rounded-xl hover:shadow-[0_4px_12px_rgba(2,73,80,0.03)] hover:scale-[1.01] transition-all duration-200 cursor-pointer group/card"
        onClick={() => window.location.href = `/organizations/${org.id}`}
      >
        <div className="w-11 h-11 bg-gradient-to-br from-teal-50 to-teal-100/50 rounded-full flex items-center justify-center overflow-hidden border border-slate-200/50 relative shadow-inner">
          {org.logo ? (
            <img
              src={org.logo}
              alt={org.name}
              className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
            />
          ) : (
            <span className="text-teal-700 font-bold text-xs uppercase">
              {org.name?.charAt(0) || 'D'}
            </span>
          )}
          {org.verified && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border border-white rounded-full shadow-sm" title="Verified Dealer"></span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-800 text-sm truncate group-hover/card:text-teal-700 transition-colors">
            {org.name || "Unnamed Dealer"}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            {org.verified ? "Verified Partner" : "Dealer"} • {org._count?.ads || 0} listing{org._count?.ads !== 1 ? "s" : ""}
          </div>
        </div>
      </div>
    );

    // Loading state
    if (isLoading) {
      return (
        <Card className="p-5 bg-white rounded-xl border border-slate-100/80">
          <h3 className="font-bold text-slate-800 mb-4 tracking-tight">Featured Dealers</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3 p-3 bg-slate-50/50 rounded-xl animate-pulse">
                <div className="w-11 h-11 bg-slate-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-3.5 bg-slate-200 rounded w-3/4 mb-2"></div>
                  <div className="h-2.5 bg-slate-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      );
    }

    // Error or empty state
    if (error || !data?.organizations || data.organizations.length === 0) {
      return (
        <Card className="p-5 bg-white rounded-xl border border-slate-100/80">
          <h3 className="font-bold text-slate-800 mb-4 tracking-tight">Featured Dealers</h3>
          <div className="p-3 text-center text-slate-500 text-sm">
            No dealers available at the moment
          </div>
        </Card>
      );
    }

    // Success state with real data
    return (
      <>
        <Card className="p-5 bg-white rounded-xl border border-slate-100/80">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 tracking-tight">Featured Dealers</h3>
            <Button
              variant="ghost"
              size="sm"
              className="text-teal-700 hover:text-teal-800 hover:bg-teal-50 text-xs font-semibold rounded-lg"
              onClick={() => setShowAllDealers(true)}
            >
              View All
            </Button>
          </div>

          <div className="space-y-2.5">
            {data.organizations.map((org) => (
              <OrganizationCard key={org.id} org={org} />
            ))}
          </div>
        </Card>

        {/* Modal dialog for all dealers */}
        <Dialog open={showAllDealers} onOpenChange={setShowAllDealers}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-800">All Dealers</DialogTitle>
            </DialogHeader>

            {allOrgsLoading ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
              </div>
            ) : (
              <div className="grid gap-3 py-4">
                {allOrgsData?.organizations?.length ? (
                  allOrgsData.organizations.map((org) => (
                    <OrganizationCard key={org.id} org={org} />
                  ))
                ) : (
                  <div className="text-center text-slate-500 p-4">
                    No more dealers to display
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div>
      {/* Hero Section with Search */}
      <section className="relative py-8 md:py-12 bg-[#024950] text-white">
        <div className="relative container mx-auto px-4 z-10">
          {/* <div className="text-center mb-6 md:mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-2 font-heading tracking-tight text-wrap-balance">
              Find Your Perfect Vehicle
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-teal-100 max-w-2xl mx-auto font-normal text-wrap-balance">
              {`Sri Lanka's largest automobile marketplace`}
            </p>
          </div> */}

          {/* Search Form - Minimalist solid layout */}
          <div className="max-w-3xl mx-auto bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex gap-2 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Search by make, model, city..."
                  className="w-full h-12 pl-12 pr-14 rounded-lg border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus-visible:ring-[#024950] focus-visible:ring-offset-0 text-sm md:text-base focus:border-[#024950]"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                  }}
                />
                {/* Show clear button when there's text */}
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                    }}
                    className="absolute right-14 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
                <Button
                  disabled={isLoading}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 p-0 bg-[#024950] hover:bg-[#024950]/90 rounded-md transition-colors"
                >
                  <Search className="w-4 h-4 text-white" />
                </Button>
              </div>

              <Sheet open={showFilterSheet} onOpenChange={setShowFilterSheet}>
                <SheetTrigger asChild>
                  <button
                    className="inline-flex items-center justify-center h-12 px-4 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:scale-95 transition-all duration-150 gap-2 cursor-pointer shadow-xs"
                    aria-label="Open filters"
                  >
                    <Filter className="w-4 h-4 text-slate-500" aria-hidden="true" />
                    <span className="hidden sm:inline text-xs sm:text-sm font-medium">Filters</span>
                    {hasActiveFilters && (
                      <span
                        className="ml-1.5 bg-[#024950] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-xs"
                      >
                        {Object.values(activeFilters).filter(v => v !== null).length}
                      </span>
                    )}
                  </button>
                </SheetTrigger>
                <SheetContent
                  side="top"
                  className="h-auto max-h-[90vh] rounded-b-3xl p-0 sm:max-h-[95vh] sm:rounded-b-2xl sm:mt-4 left-1/2 -translate-x-1/2"
                  style={{ width: '900px', maxWidth: '95vw' }}
                >
                  <div className="px-4 pt-4 pb-0">
                    <SheetHeader className="pb-0" style={{ marginBottom: 0 }}>
                      <div className="flex items-center justify-between">
                        <SheetTitle className="text-base font-semibold">Filters</SheetTitle>
                        {hasActiveFilters && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            className="text-teal-700 hover:text-teal-800 h-7 text-xs"
                          >
                            Reset
                          </Button>
                        )}
                      </div>
                    </SheetHeader>
                  </div>

                  {/* Filters Container - Layout Updated */}
                  <div className="px-4 pb-24 space-y-4 overflow-y-auto max-h-[calc(85vh-120px)] sm:max-h-[calc(90vh-120px)]">
                    {/* Row 1: Vehicle Type & Make */}
                    <div className="grid grid-cols-2 gap-3 w-full">
                      <div>
                        <label className="text-xs font-medium text-slate-600 mb-1 block">Vehicle Type</label>
                        <Select
                          value={filters.vehicleType || "any"}
                          onValueChange={(value) => handleFilterChange("vehicleType", value)}
                        >
                          <SelectTrigger className="w-full h-9 bg-white text-xs px-3">
                            <SelectValue placeholder="Any Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Any Type</SelectItem>
                            {Object.entries(vehicleTypeLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-600 mb-1 block">Make</label>
                        <Select
                          value={filters.make || "any"}
                          onValueChange={(value) => handleFilterChange("make", value)}
                        >
                          <SelectTrigger className="w-full h-9 bg-white text-xs px-3">
                            <SelectValue placeholder="Any" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[280px]">
                            <SelectItem value="any">Any</SelectItem>
                            {vehicleMakes.map((make) =>
                              make ? (
                                <SelectItem key={make} value={make.toLowerCase()}>
                                  {make}
                                </SelectItem>
                              ) : null
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Row 2: Min Year & Max Year */}
                    <div className="grid grid-cols-2 gap-3 w-full">
                      <div>
                        <label className="text-xs font-medium text-slate-600 mb-1 block">Min Year</label>
                        <Select
                          value={filters.minYear || "any"}
                          onValueChange={(value) => handleFilterChange("minYear", value)}
                        >
                          <SelectTrigger className="w-full h-9 bg-white text-xs px-3">
                            <SelectValue placeholder="Any" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px]">
                            <SelectItem value="any">Any</SelectItem>
                            {years.slice(0, 30).map(year => (
                              <SelectItem key={`min-${year}`} value={year.toString()}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-600 mb-1 block">Max Year</label>
                        <Select
                          value={filters.maxYear || "any"}
                          onValueChange={(value) => handleFilterChange("maxYear", value)}
                        >
                          <SelectTrigger className="w-full h-9 bg-white text-xs px-3">
                            <SelectValue placeholder="Any" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px]">
                            <SelectItem value="any">Any</SelectItem>
                            {maxYearOptions.map(year => (
                              <SelectItem key={`max-${year}`} value={year.toString()}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Row 3: District & City */}
                    <div className="grid grid-cols-2 gap-3 w-full">
                      <div>
                        <label className="text-xs font-medium text-slate-600 mb-1 block">District</label>
                        <Select
                          value={filters.district || "any"}
                          onValueChange={(value) => handleFilterChange("district", value)}
                        >
                          <SelectTrigger className="w-full h-9 bg-white text-xs px-3">
                            <SelectValue placeholder="Any" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px]">
                            <SelectItem value="any">Any</SelectItem>
                             {sriLankanDistricts.map((district: string) => (
                              <SelectItem key={district} value={district.toLowerCase()}>
                                {district}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-600 mb-1 block">City</label>
                        <Select
                          value={filters.city || "any"}
                          onValueChange={(value) => {
                            setCityQuery("");
                            handleFilterChange("city", value === "any" ? null : value);
                          }}
                          onOpenChange={(open) => {
                            if (!open) setCityQuery("");
                          }}
                        >
                          <SelectTrigger className="w-full h-9 bg-white text-xs px-3">
                            <SelectValue placeholder="Any" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[280px]">
                            <div className="px-2 pb-1.5 sticky top-0 bg-white z-10">
                              <input
                                aria-label="Search cities"
                                placeholder="Search..."
                                value={cityQuery}
                                onChange={(e) => setCityQuery(e.target.value)}
                                onKeyDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full rounded-md py-1 px-2 bg-slate-50 border border-slate-200 text-xs"
                              />
                            </div>
                            <SelectItem value="any">Any</SelectItem>
                            {availableCities
                              .filter((c: string) =>
                                cityQuery.trim()
                                  ? c.toLowerCase().includes(cityQuery.toLowerCase())
                                  : true
                              )
                              .map((city: string) => (
                                <SelectItem key={city} value={city.toLowerCase()}>
                                  {city}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Row 4: Price Range */}
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-2 block">
                        Price Range (Rs.)
                      </label>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs text-slate-600">
                          <span>{filters.minPrice ? `Rs. ${parseInt(filters.minPrice).toLocaleString()}` : 'Rs. 0'}</span>
                          <span className="text-slate-400">to</span>
                          <span>{filters.maxPrice ? `Rs. ${parseInt(filters.maxPrice).toLocaleString()}` : 'Rs. 50M+'}</span>
                        </div>

                        <Slider
                          min={0}
                          max={50000000}
                          step={100000}
                          value={[
                            parseInt(filters.minPrice || "0"),
                            parseInt(filters.maxPrice || "50000000")
                          ]}
                          onValueChange={(values) => {
                            handleFilterChange("minPrice", values[0] > 0 ? values[0].toString() : null);
                            handleFilterChange("maxPrice", values[1] < 50000000 ? values[1].toString() : null);
                          }}
                          className="w-full"
                        />

                        <div className="flex flex-wrap gap-1.5">
                          <button
                            onClick={() => {
                              handleFilterChange("minPrice", null);
                              handleFilterChange("maxPrice", "2000000");
                            }}
                            className="px-2 py-1 text-xs rounded-md bg-slate-50 hover:bg-teal-50 hover:text-teal-700 border border-slate-200"
                          >
                            Under 2M
                          </button>
                          <button
                            onClick={() => {
                              handleFilterChange("minPrice", "2000000");
                              handleFilterChange("maxPrice", "5000000");
                            }}
                            className="px-2 py-1 text-xs rounded-md bg-slate-50 hover:bg-teal-50 hover:text-teal-700 border border-slate-200"
                          >
                            2M-5M
                          </button>
                          <button
                            onClick={() => {
                              handleFilterChange("minPrice", "5000000");
                              handleFilterChange("maxPrice", "10000000");
                            }}
                            className="px-2 py-1 text-xs rounded-md bg-slate-50 hover:bg-teal-50 hover:text-teal-700 border border-slate-200"
                          >
                            5M-10M
                          </button>
                          <button
                            onClick={() => {
                              handleFilterChange("minPrice", "10000000");
                              handleFilterChange("maxPrice", null);
                            }}
                            className="px-2 py-1 text-xs rounded-md bg-slate-50 hover:bg-teal-50 hover:text-teal-700 border border-slate-200"
                          >
                            10M+
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Row 5: Condition & Fuel Type */}
                    <div className="grid grid-cols-2 gap-3 w-full">
                      <div>
                        <label className="text-xs font-medium text-slate-600 mb-1 block">Condition</label>
                        <Select
                          value={filters.condition || "any"}
                          onValueChange={(value) => handleFilterChange("condition", value)}
                        >
                          <SelectTrigger className="w-full h-9 bg-white text-xs px-3">
                            <SelectValue placeholder="Any" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Any</SelectItem>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="used">Used</SelectItem>
                            <SelectItem value="antique">Antique</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-600 mb-1 block">Fuel Type</label>
                        <Select
                          value={filters.fuelType || "any"}
                          onValueChange={(value) => handleFilterChange("fuelType", value)}
                        >
                          <SelectTrigger className="w-full h-9 bg-white text-xs px-3">
                            <SelectValue placeholder="Any" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Any</SelectItem>
                            <SelectItem value="Petrol">Petrol</SelectItem>
                            <SelectItem value="Diesel">Diesel</SelectItem>
                            <SelectItem value="Hybrid">Hybrid</SelectItem>
                            <SelectItem value="Electric">Electric</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Bottom action button - Fixed */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-white border-t shadow-lg flex justify-center">
                    <Button
                      className="w-fit min-w-[200px] px-8 h-10 bg-teal-700 hover:bg-teal-600 text-white font-medium rounded-lg text-sm"
                      onClick={() => {
                        applyFilters();
                        setShowFilterSheet(false);
                      }}
                    >
                      Search
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Active filter chips */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mt-4">
                {activeFilters.make && activeFilters.make !== 'any' && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full border border-white/50 text-sm shadow-sm">
                    <span className="text-slate-700 capitalize">{activeFilters.make}</span>
                    <button
                      onClick={() => {
                        handleFilterChange("make", null);
                        applyFilters();
                      }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                {activeFilters.city && activeFilters.city !== 'any' && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full border border-white/50 text-sm shadow-sm">
                    <span className="text-slate-700 capitalize">{activeFilters.city}</span>
                    <button
                      onClick={() => {
                        handleFilterChange("city", null);
                        applyFilters();
                      }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                {activeFilters.vehicleType && activeFilters.vehicleType !== 'any' && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full border border-white/50 text-sm shadow-sm">
                    <span className="text-slate-700">{vehicleTypeLabels[activeFilters.vehicleType as keyof typeof vehicleTypeLabels]}</span>
                    <button
                      onClick={() => {
                        handleFilterChange("vehicleType", null);
                        applyFilters();
                      }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                {(activeFilters.minPrice || activeFilters.maxPrice) && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full border border-white/50 text-sm shadow-sm">
                    <span className="text-slate-700">
                      Rs. {activeFilters.minPrice ? parseInt(activeFilters.minPrice).toLocaleString() : '0'} - {activeFilters.maxPrice ? parseInt(activeFilters.maxPrice).toLocaleString() : '50M+'}
                    </span>
                    <button
                      onClick={() => {
                        handleFilterChange("minPrice", null);
                        handleFilterChange("maxPrice", null);
                        applyFilters();
                      }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                {activeFilters.fuelType && activeFilters.fuelType !== 'any' && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full border border-white/50 text-sm shadow-sm">
                    <span className="text-slate-700 capitalize">{activeFilters.fuelType}</span>
                    <button
                      onClick={() => {
                        handleFilterChange("fuelType", null);
                        applyFilters();
                      }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                {activeFilters.transmission && activeFilters.transmission !== 'any' && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full border border-white/50 text-sm shadow-sm">
                    <span className="text-slate-700 capitalize">{activeFilters.transmission}</span>
                    <button
                      onClick={() => {
                        handleFilterChange("transmission", null);
                        applyFilters();
                      }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                {(activeFilters.minYear || activeFilters.maxYear) && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full border border-white/50 text-sm shadow-sm">
                    <span className="text-slate-700">
                      Year: {activeFilters.minYear || 'Any'} - {activeFilters.maxYear || 'Any'}
                    </span>
                    <button
                      onClick={() => {
                        handleFilterChange("minYear", null);
                        handleFilterChange("maxYear", null);
                        applyFilters();
                      }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-white hover:text-teal-100 text-sm font-medium"
                >
                  Clear all
                </button>
              </div>
            )}
            {/* Quick Category Text Pills */}
            <div className="flex flex-wrap justify-center gap-2 mt-5">
              {[
                { type: "CAR", label: "Cars" },
                { type: "SUV_JEEP", label: "SUVs" },
                { type: "VAN", label: "Vans" },
                { type: "MOTORCYCLE", label: "Bikes" },
                { type: "THREE_WHEEL", label: "Three Wheelers" },
                { type: "AUTO_PARTS", label: "Auto Parts" }
              ].map((cat) => {
                const isActive = activeFilters.vehicleType === cat.type;
                return (
                  <button
                    key={cat.type}
                    onClick={() => {
                      if (isActive) {
                        handleFilterChange("vehicleType", null);
                        setActiveFilters(prev => ({ ...prev, vehicleType: null }));
                      } else {
                        handleFilterChange("vehicleType", cat.type);
                        setActiveFilters(prev => ({ ...prev, vehicleType: cat.type }));
                      }
                    }}
                    className={`px-4 py-1.5 rounded-full border text-xs font-semibold transition-colors cursor-pointer shadow-xs ${
                      isActive
                        ? "bg-[#024950] text-white border-transparent"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="bg-slate-50 py-4 md:py-6">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Vehicle Listings */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-3 md:mb-0">
                  Browse Vehicles
                </h2>
                <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
                  <span className="text-slate-600 text-sm">
                    {data?.pagination
                      ? `Showing 1-${data.ads.length} of ${data.pagination.total} results`
                      : "Loading results..."}
                  </span>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full md:w-44 h-10 rounded-lg bg-white border-slate-200">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="price-low">
                        Price: Low to High
                      </SelectItem>
                      <SelectItem value="price-high">
                        Price: High to Low
                      </SelectItem>
                      <SelectItem value="year">Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Top Ad Section */}
              {!isLoading && sortBy === "default" && !isSearchActive && displayedTopAds.length > 0 && (
                <div className="mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {displayedTopAds.map((vehicle) => (
                      <TopAdCard key={vehicle.id} vehicle={vehicle} vehicleTypeLabels={vehicleTypeLabels} formatPrice={formatPrice} formatAdTitle={formatAdTitle} />
                    ))}
                  </div>
                </div>
              )}

              {/* Featured Ad Section */}
              {!isLoading && sortBy === "default" && !isSearchActive && displayedFeaturedAds.length > 0 && (
                <div className="mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {displayedFeaturedAds.map((vehicle) => (
                        <FeaturedAdCard
                          key={vehicle.id}
                          vehicle={vehicle}
                          vehicleTypeLabels={vehicleTypeLabels}
                          formatPrice={formatPrice}
                          formatAdTitle={formatAdTitle}
                          isBump={(vehicle as any).bumpActive}
                          isTopAd={(vehicle as any).topAdActive}
                          isUrgent={(vehicle as any).urgentActive}
                        />
                      ))}
                  </div>
                </div>
              )}

              {/* Loading state with shimmer effect */}
              {isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...Array(6)].map((_, index) => (
                    <div key={index} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                      <div className="p-3">
                        {/* Title shimmer */}
                        <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto mb-3 animate-pulse"></div>

                        <div className="flex">
                          {/* Image shimmer */}
                          <div className="w-32 h-20 flex-shrink-0 bg-slate-200 rounded-md animate-pulse"></div>

                          {/* Details shimmer */}
                          <div className="flex-1 pl-3 flex flex-col justify-between">
                            <div>
                              <div className="h-2 bg-slate-200 rounded w-1/2 mb-2 animate-pulse"></div>
                              <div className="h-3 bg-slate-200 rounded w-1/3 mb-2 animate-pulse"></div>
                              <div className="h-2 bg-slate-200 rounded w-1/4 animate-pulse"></div>
                            </div>
                            <div className="h-2 bg-slate-200 rounded w-1/3 mt-1 animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Error state - only show if no data at all */}
              {error && !data?.ads && allAds.length === 0 && !isLoading && (
                <div className="p-8 text-center bg-white rounded-xl shadow-sm">
                  <p className="text-red-500 font-medium">
                    Failed to load vehicle listings
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Please try again later
                  </p>
                </div>
              )}

              {/* No results */}
              {data?.ads?.length === 0 && !isLoading && (
                <div className="p-12 text-center border rounded-xl bg-white shadow-sm">
                  <p className="text-slate-600 mb-2">No vehicles found</p>
                  <Button className="mt-4 bg-teal-700 hover:bg-teal-600">
                    Create Your First Listing
                  </Button>
                </div>
              )}

              {/* No results */}
              {filteredAds.length === 0 && !isLoading && data?.ads && (
                <div className="p-12 text-center border rounded-xl bg-white shadow-sm">
                  {hasActiveFilters ? (
                    <>
                      <p className="text-slate-600 mb-2">
                        No vehicles match your filter criteria
                      </p>
                      <Button
                        className="mt-4 bg-teal-700 hover:bg-teal-600"
                        onClick={clearFilters}
                      >
                        Clear Filters
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-slate-600 mb-2">No vehicles found</p>
                      <Button className="mt-4 bg-teal-700 hover:bg-teal-600">
                        Create Your First Listing
                      </Button>
                    </>
                  )}
                </div>
              )}

              {/* Vehicle Grid - Using Real Data */}
              {interleavedAds.length > 0 && !isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {interleavedAds.map((vehicle) => {
                    const isFeatured = (vehicle as any).featuredActive;

                    if (isFeatured) {
                      return (
                        <FeaturedAdCard
                          key={`featured-${vehicle.id}`}
                          vehicle={vehicle}
                          vehicleTypeLabels={vehicleTypeLabels}
                          formatPrice={formatPrice}
                          formatAdTitle={formatAdTitle}
                          isBump={(vehicle as any).bumpActive}
                          isTopAd={(vehicle as any).topAdActive}
                          isUrgent={(vehicle as any).urgentActive}
                        />
                      );
                    }

                    return (
                      <div
                        key={vehicle.id}
                        className="rounded-sm border bg-white border-slate-200 hover:border-slate-350 transition-colors cursor-pointer group relative overflow-hidden"
                        onClick={() => (window.location.href = buildAdUrl(vehicle))}
                      >
                        {/* Favorite Button */}
                        <div className="absolute top-2 right-2 z-20 opacity-90 scale-90">
                          <FavoriteButton adId={vehicle.id} />
                        </div>

                        {((vehicle as any).bumpActive || (vehicle as any).urgentActive || (vehicle as any).topAdActive || (vehicle as any).featuredActive) && (
                          <div className="absolute bottom-2 right-2 z-10 scale-90">
                            <BoostBadges bumpActive={(vehicle as any).bumpActive} urgentActive={(vehicle as any).urgentActive} topAdActive={(vehicle as any).topAdActive} featuredActive={(vehicle as any).featuredActive} />
                          </div>
                        )}

                        <div className="p-2">
                          <div className="flex gap-3">
                            {/* Vehicle Image Container - Ultra compact */}
                            <div className="w-24 sm:w-28 h-18 sm:h-20 flex-shrink-0 rounded-sm overflow-hidden bg-slate-55 border border-slate-100 relative">
                              {vehicle?.media && vehicle.media.length > 0 && vehicle.media[0]?.media?.url ? (
                                <img
                                  src={vehicle.media[0].media.url}
                                  alt={vehicle.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <img
                                  src="/placeholder-image.jpg"
                                  alt={vehicle.title}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>

                            {/* Vehicle Details */}
                            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                              <div>
                                {/* Category Badge */}
                                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block mb-0.5">
                                  {vehicle.type === 'AUTO_PARTS' 
                                    ? (vehicle as any).partCategory?.name || 'Auto Part'
                                    : vehicleTypeLabels[vehicle.type] || vehicle.type}
                                </span>

                                {/* Vehicle Title */}
                                <h3 className="font-semibold text-slate-800 text-xs sm:text-sm group-hover:text-teal-700 transition-colors line-clamp-1 leading-tight">
                                  {formatAdTitle(vehicle)}
                                </h3>

                                <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                                  {vehicle.city || vehicle.location || ""}
                                </div>
                              </div>

                              <div className="flex items-end justify-between mt-1">
                                <div className="text-xs sm:text-sm font-bold text-teal-700 leading-none">
                                  {formatPrice(vehicle.price, (vehicle as any).metadata?.isNegotiable)}
                                </div>

                                {/* Views and relative time */}
                                <div className="flex items-center gap-2 text-[9px] sm:text-[10px] text-slate-400 pr-1">
                                  <span>{getRelativeTime(vehicle.createdAt)}</span>
                                  <span className="flex items-center gap-0.5">
                                    <Eye className="h-3 w-3" />
                                    {(vehicle as any).analytics?.views || 0}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Load More */}
              {interleavedAds.length > 0 && (
                <div className="text-center mt-8">
                  {data?.pagination && currentPage < data.pagination.totalPages ? (
                    <Button
                      size="lg"
                      variant="outline"
                      className="px-8 py-5 border-teal-700 text-teal-700 hover:bg-teal-700 hover:text-white transition-all duration-300 rounded-sm"
                      onClick={handleLoadMore}
                      disabled={isLoading}
                    >
                      {isLoading ? "Loading..." : "Load More Vehicles"}
                    </Button>
                  ) : interleavedAds.length > 12 ? (
                    <p className="text-slate-500 text-sm">No more vehicles to load</p>
                  ) : null}
                </div>
              )}
            </div>

            {/* Right Sidebar - Ad Space */}
            <div className="w-full lg:w-80 space-y-6 mt-6 lg:mt-0">
              {/* Google Ad Space 1 */}
              <Card className="p-4 bg-white border border-slate-100 rounded-xl overflow-hidden shadow-none">
                <div className="text-center text-slate-500">

                  <Link href="/search" className="block cursor-pointer">
                    <div className="bg-slate-100 h-64 flex items-center justify-center rounded-lg overflow-hidden">
                      <img
                        src="/assets/Sidebar 01 new.jpg"
                        alt="Advertisement"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </Link>
                </div>
              </Card>

              {/* Featured Dealers */}
              <FeaturedDealers />

              {/* Google Ad Space 2 */}
              <Card className="p-4 bg-white border border-slate-100 rounded-xl overflow-hidden shadow-none">
                <div className="text-center text-slate-500">

                  <Link href="/compare" className="block cursor-pointer">
                    <div className="bg-slate-100 h-48 flex items-center justify-center rounded-lg overflow-hidden">
                      <img
                        src="/assets/Sidebar 02.jpg"
                        alt="Advertisement"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Ads Carousel Section */}
      {!isLoading && featuredBoostedAds.length > 0 && (
        <section className="bg-white py-6 md:py-8 border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-4">
            <Carousel
              opts={{
                align: "start",
                loop: true,
                slidesToScroll: 1,
              }}
              plugins={[
                Autoplay({
                  delay: 4000,
                  stopOnInteraction: false,
                  stopOnMouseEnter: false,
                }),
              ]}
              className="w-full"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <h2 className="text-lg sm:text-xl font-bold text-slate-800">Featured Ads</h2>
                </div>
                <div className="flex items-center gap-2">
                  <CarouselPrevious className="static translate-y-0 h-8 w-8" />
                  <CarouselNext className="static translate-y-0 h-8 w-8" />
                </div>
              </div>
              <CarouselContent>
                {featuredBoostedAds.map((vehicle) => (
                  <CarouselItem key={vehicle.id} className="basis-[85%] sm:basis-[49%]">
                    <FeaturedAdCard
                      vehicle={vehicle}
                      vehicleTypeLabels={vehicleTypeLabels}
                      formatPrice={formatPrice}
                      formatAdTitle={formatAdTitle}
                      titleClampClass="line-clamp-1"
                      isBump={(vehicle as any).bumpActive}
                      isTopAd={(vehicle as any).topAdActive}
                      isUrgent={(vehicle as any).urgentActive}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        </section>
      )}

      {/* Trending Vehicles Section */}
      <section className="bg-white py-6 md:py-8 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4">
          {/* Trending Vehicles */}
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-3">Trending Vehicles</h2>
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="bg-slate-100 rounded-lg border border-slate-200 overflow-hidden animate-pulse">
                    <div className="w-full h-40 bg-slate-200"></div>
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {allAds
                  .filter(ad => ad.status === "ACTIVE" && (ad as any).published === true)
                  .sort((a, b) => ((b as any).analytics?.views || 0) - ((a as any).analytics?.views || 0))
                  .slice(0, 6)
                  .map((vehicle) => {
                    const isFeatured = (vehicle as any).featuredActive;
                    return (
                      <div
                        key={vehicle.id}
                        className={`rounded-lg border overflow-hidden hover:border-slate-350 transition-colors cursor-pointer group relative bg-white border-slate-200 ${isFeatured ? 'bg-yellow-50/30' : ''}`}
                        onClick={() => (window.location.href = buildAdUrl(vehicle))}
                      >
                        {/* Vehicle Image */}
                        <div className="w-full h-32 overflow-hidden bg-slate-50 relative border-b border-slate-100">
                          {vehicle?.media && vehicle.media.length > 0 && vehicle.media[0]?.media?.url ? (
                            <img
                              src={vehicle.media[0].media.url}
                              alt={vehicle.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <img
                              src="/placeholder-image.jpg"
                              alt={vehicle.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                          
                          {/* Badge for Trending */}
                          <div className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shadow-sm z-10">
                            <TrendingUp className="w-3 h-3 inline-block mr-0.5" />
                            <span>Trending</span>
                          </div>
                        </div>

                        {/* Boost Badges */}
                        {((vehicle as any).bumpActive || (vehicle as any).urgentActive || (vehicle as any).topAdActive || (vehicle as any).featuredActive) && (
                          <div className="absolute top-2 right-2 z-10 scale-90">
                            <BoostBadges
                              bumpActive={(vehicle as any).bumpActive}
                              urgentActive={(vehicle as any).urgentActive}
                              topAdActive={(vehicle as any).topAdActive}
                              featuredActive={(vehicle as any).featuredActive}
                            />
                          </div>
                        )}

                        {/* Vehicle Details */}
                        <div className="p-2.5 flex flex-col justify-between flex-1 min-h-[100px]">
                          <div>
                            {/* Category Tag */}
                            <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block mb-0.5">
                              {vehicle.type === 'AUTO_PARTS' 
                                ? (vehicle as any).partCategory?.name || 'Auto Part'
                                : vehicleTypeLabels[vehicle.type] || vehicle.type}
                            </span>
                            
                            {/* Title */}
                            <h3 className="font-semibold text-xs text-slate-800 line-clamp-1 group-hover:text-teal-700 transition-colors leading-tight">
                              {formatAdTitle(vehicle)}
                            </h3>

                            <div className="text-[10px] text-slate-500 mt-0.5 truncate">{vehicle.city || vehicle.location || ""}</div>
                          </div>

                          <div className="flex items-end justify-between mt-2 pt-1.5 border-t border-slate-100">
                            <div className="text-xs sm:text-sm font-bold text-teal-700 leading-none">
                              {formatPrice(vehicle.price, (vehicle as any).metadata?.isNegotiable)}
                            </div>

                            {/* Views and relative time */}
                            <div className="flex items-center gap-1.5 text-[9px] text-slate-400">
                              <span>{getRelativeTime(vehicle.createdAt)}</span>
                              <span className="flex items-center gap-0.5">
                                <Eye className="h-3 w-3" />
                                {(vehicle as any).analytics?.views || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Brand Carousel Section */}
      <BrandCarouselSection />

      {/* Banner Ad Space */}
      <div className="bg-white py-6">
        <div className="max-w-6xl mx-auto px-4">
          <Card className="p-0 bg-white border border-slate-100 rounded-xl overflow-hidden shadow-none">
            <div className="text-center text-slate-500">
              <Link href="/sell/new" className="block">
                {/* Desktop View Banner */}
                <div className="hidden sm:flex bg-slate-100 h-24 items-center justify-center rounded-lg overflow-hidden">
                  <img
                    src="/assets/Bottom Banner.jpg"
                    alt="Free Advertisement"
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Mobile View Banner - Added new slot for mobile and fixed alignment */}
                <div className="flex sm:hidden bg-slate-100 h-32 items-center justify-center rounded-lg overflow-hidden">
                  <img
                    src="/assets/Bottom Banner - Mobile New.jpg"
                    alt="Free Advertisement"
                    className="w-full h-full object-cover object-center"
                  />
                </div>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}