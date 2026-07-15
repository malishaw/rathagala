"use client"

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, ChevronUp, MapPin, TrendingUp, Sparkles, Loader2, Car, Search, Filter, Eye, Star, AlertCircle, Zap } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { BoostBadges } from "@/features/boost/components/boost-badges";
import { TopAdCard } from "@/features/ads/components/top-ad-card";
import { FeaturedAdCard } from "@/features/ads/components/featured-ad-card";
import { getRelativeTime } from "@/lib/utils";
import { useGetAds } from "@/features/ads/api/use-get-ads";
import { FavoriteButton } from "@/features/saved-ads/components/favorite-button";
import { authClient } from "@/lib/auth-client";
import { buildAdUrl } from "@/lib/ad-url";
import { useLocations } from "@/hooks/use-locations";

import { vehicleTypeLabels, listingTypeLabels, vehicleMakes } from "@/lib/vehicle-constants";
import { formatAdTitle, shuffleArray, getRotatingSlice, getAdSortTime, interleaveFeaturedAds } from "@/lib/ad-helpers";


// Search filter interface
interface SearchFilters {
  query: string;
  globalSearch: string;
  listingType: string;
  vehicleType: string;
  brand: string;
  model: string;
  grade: string;
  condition: string;
  minPrice: string;
  maxPrice: string;
  minYear: string;
  maxYear: string;
  fuelType: string;
  transmission: string;
  district: string;
  city: string;
  seller: string;
  urgentOnly: boolean;
  page: number;
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = authClient.useSession();
  const { locationData, allCities: sriLankanCities, allDistricts: sriLankanDistricts } = useLocations();

  // Initialize filters from URL params
  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams.get('q') || '',
    globalSearch: '',
    listingType: searchParams.get('listingType') || 'all',
    vehicleType: searchParams.get('type') || 'all',
    brand: searchParams.get('brand') || 'all',
    model: searchParams.get('model') || '',
    grade: searchParams.get('grade') || 'all',
    condition: searchParams.get('condition') || 'all',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    minYear: searchParams.get('minYear') || 'any',
    maxYear: searchParams.get('maxYear') || 'any',
    fuelType: searchParams.get('fuelType') || 'all',
    transmission: searchParams.get('transmission') || 'all',
    district: searchParams.get('district') || 'all',
    city: searchParams.get('city') || 'all',
    seller: searchParams.get('seller') || 'all',
    urgentOnly: searchParams.get('urgent') === 'true',
    page: parseInt(searchParams.get('page') || '1')
  });

  // Search states for dropdown filtering
  const [districtSearch, setDistrictSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [vehicleTypeSearch, setVehicleTypeSearch] = useState('');
  const [brandSearch, setBrandSearch] = useState('');
  const [availableGrades, setAvailableGrades] = useState<{ id: string; name: string }[]>([]);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [availableModels, setAvailableModels] = useState<{ id: string; name: string }[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  const [gradeSearch, setGradeSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(12);
  const [allAds, setAllAds] = useState<any[]>([]);

  // Fetch available models when brand changes
  useEffect(() => {
    const fetchModels = async () => {
      if (!filters.brand || filters.brand === 'all') {
        setAvailableModels([]);
        return;
      }

      setLoadingModels(true);
      try {
        const params = new URLSearchParams({ limit: "500", isActive: "true", brand: filters.brand, includeUserModels: "true" });
        const res = await fetch(`/api/vehicle-model?${params}`);
        if (res.ok) {
          const data = await res.json() as { models: { id: string; name: string; isActive?: boolean }[] };
          setAvailableModels(data.models.filter((m) => m.isActive !== false));
        }
      } catch (error) {
        console.error("Failed to fetch models:", error);
      } finally {
        setLoadingModels(false);
      }
    };

    fetchModels();
  }, [filters.brand]);

  // Fetch available grades when brand or model changes
  useEffect(() => {
    const fetchGrades = async () => {
      if (!filters.brand || filters.brand === 'all') {
        setAvailableGrades([]);
        return;
      }

      setLoadingGrades(true);
      try {
        const params = new URLSearchParams({ limit: "500", isActive: "true", includeUserGrades: "true" });
        if (filters.brand && filters.brand !== 'all') {
          params.set("brand", filters.brand);
        }
        if (filters.model) {
          params.set("model", filters.model);
        }
        const url = `/api/vehicle-grade?${params}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json() as { grades: { id: string; name: string; isActive?: boolean }[] };
          setAvailableGrades(data.grades.filter((g) => g.isActive !== false));
        }
      } catch (error) {
        console.error("Failed to fetch grades:", error);
      } finally {
        setLoadingGrades(false);
      }
    };

    fetchGrades();
  }, [filters.brand, filters.model]);

  // Mobile sidebar state
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);

  // Keep filters in sync with URL search params
  useEffect(() => {
    const lt = searchParams.get('listingType') || 'all';
    setFilters((prev) => {
      // Only update if listingType changed
      if (prev.listingType !== lt) {
        return { ...prev, listingType: lt, page: 1 };
      }
      return prev;

    });
  }, [searchParams]);

  // Derive available cities based on district selection
  const availableCities = useMemo(() => {
    if (!filters.district || filters.district === "all" || filters.district === "any") return sriLankanCities;

    // Find province for district
    let districtCities: string[] = [];
    Object.values(locationData).forEach(province => {
      Object.entries(province).forEach(([district, cities]) => {
        if (district.toLowerCase() === filters.district.toLowerCase()) {
          districtCities = cities;
        }
      });
    });

    return districtCities.length > 0 ? districtCities.sort() : sriLankanCities;
  }, [filters.district]);

  // Filter districts based on search input
  const filteredDistricts = useMemo(() => {
    const list = !districtSearch ? sriLankanDistricts : sriLankanDistricts.filter(district =>
      district.toLowerCase().includes(districtSearch.toLowerCase())
    );
    return [...list].sort((a, b) => a.localeCompare(b));
  }, [districtSearch, sriLankanDistricts]);

  // Filter cities based on search input
  const filteredCities = useMemo(() => {
    const list = !citySearch ? availableCities : availableCities.filter(city =>
      city.toLowerCase().includes(citySearch.toLowerCase())
    );
    return [...list].sort((a, b) => a.localeCompare(b));
  }, [citySearch, availableCities]);

  // Filter vehicle types based on search input
  const filteredVehicleTypes = useMemo(() => {
    const list = !vehicleTypeSearch ? Object.entries(vehicleTypeLabels) : Object.entries(vehicleTypeLabels).filter(([_, label]) =>
      label.toLowerCase().includes(vehicleTypeSearch.toLowerCase())
    );
    return [...list].sort((a, b) => a[1].localeCompare(b[1]));
  }, [vehicleTypeSearch]);

  // Filter brands based on search input
  const filteredBrands = useMemo(() => {
    const list = !brandSearch ? vehicleMakes : vehicleMakes.filter(brand =>
      brand.toLowerCase().includes(brandSearch.toLowerCase())
    );
    return [...list].sort((a, b) => a.localeCompare(b));
  }, [brandSearch]);

  // Filter models based on search input
  const filteredModels = useMemo(() => {
    const list = !modelSearch ? availableModels : availableModels.filter(m =>
      m.name.toLowerCase().includes(modelSearch.toLowerCase())
    );
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [modelSearch, availableModels]);

  // Filter grades based on search input
  const filteredGrades = useMemo(() => {
    const list = !gradeSearch ? availableGrades : availableGrades.filter(g =>
      g.name.toLowerCase().includes(gradeSearch.toLowerCase())
    );
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [gradeSearch, availableGrades]);

  // 1. Fetch Top Ads for search (limit: 10)
  const { data: topAdsData } = useGetAds({
    page: 1,
    limit: 10,
    topAdActive: "true",
    search: [filters.query, filters.globalSearch].filter(Boolean).join(" ") || undefined,
    listingType: filters.listingType !== "all" ? filters.listingType : undefined,
    brand: filters.brand !== "all" ? filters.brand : undefined,
    model: filters.model || undefined,
    grade: filters.grade !== "all" ? filters.grade : undefined,
    type: filters.vehicleType !== "all" ? filters.vehicleType : undefined,
    condition: filters.condition !== "all" ? filters.condition : undefined,
    minPrice: filters.minPrice ? parseInt(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice ? parseInt(filters.maxPrice) : undefined,
    minYear: filters.minYear !== "any" && filters.minYear !== "all" ? filters.minYear : undefined,
    maxYear: filters.maxYear !== "any" && filters.maxYear !== "all" ? filters.maxYear : undefined,
    fuelType: filters.fuelType !== "all" ? filters.fuelType : undefined,
    transmission: filters.transmission !== "all" ? filters.transmission : undefined,
    city: filters.city !== "all" && filters.city !== "any" ? filters.city : undefined,
    district: filters.district !== "all" && filters.district !== "any" ? filters.district : undefined,
    urgentActive: filters.urgentOnly ? "true" : undefined,
    seller: filters.seller !== "all" ? filters.seller : undefined,
  });

  // 2. Fetch Featured Ads for search (limit: 10)
  const { data: featuredAdsData } = useGetAds({
    page: 1,
    limit: 10,
    featuredActive: "true",
    search: [filters.query, filters.globalSearch].filter(Boolean).join(" ") || undefined,
    listingType: filters.listingType !== "all" ? filters.listingType : undefined,
    brand: filters.brand !== "all" ? filters.brand : undefined,
    model: filters.model || undefined,
    grade: filters.grade !== "all" ? filters.grade : undefined,
    type: filters.vehicleType !== "all" ? filters.vehicleType : undefined,
    condition: filters.condition !== "all" ? filters.condition : undefined,
    minPrice: filters.minPrice ? parseInt(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice ? parseInt(filters.maxPrice) : undefined,
    minYear: filters.minYear !== "any" && filters.minYear !== "all" ? filters.minYear : undefined,
    maxYear: filters.maxYear !== "any" && filters.maxYear !== "all" ? filters.maxYear : undefined,
    fuelType: filters.fuelType !== "all" ? filters.fuelType : undefined,
    transmission: filters.transmission !== "all" ? filters.transmission : undefined,
    city: filters.city !== "all" && filters.city !== "any" ? filters.city : undefined,
    district: filters.district !== "all" && filters.district !== "any" ? filters.district : undefined,
    urgentActive: filters.urgentOnly ? "true" : undefined,
    seller: filters.seller !== "all" ? filters.seller : undefined,
  });

  // 3. Fetch Main paginated search results
  const { data, isLoading, error } = useGetAds({
    page: filters.page,
    limit: 12,
    search: [filters.query, filters.globalSearch].filter(Boolean).join(" ") || undefined,
    listingType: filters.listingType !== "all" ? filters.listingType : undefined,
    brand: filters.brand !== "all" ? filters.brand : undefined,
    model: filters.model || undefined,
    grade: filters.grade !== "all" ? filters.grade : undefined,
    type: filters.vehicleType !== "all" ? filters.vehicleType : undefined,
    condition: filters.condition !== "all" ? filters.condition : undefined,
    minPrice: filters.minPrice ? parseInt(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice ? parseInt(filters.maxPrice) : undefined,
    minYear: filters.minYear !== "any" && filters.minYear !== "all" ? filters.minYear : undefined,
    maxYear: filters.maxYear !== "any" && filters.maxYear !== "all" ? filters.maxYear : undefined,
    fuelType: filters.fuelType !== "all" ? filters.fuelType : undefined,
    transmission: filters.transmission !== "all" ? filters.transmission : undefined,
    city: filters.city !== "all" && filters.city !== "any" ? filters.city : undefined,
    district: filters.district !== "all" && filters.district !== "any" ? filters.district : undefined,
    urgentActive: filters.urgentOnly ? "true" : undefined,
    seller: filters.seller !== "all" ? filters.seller : undefined,
  });

  // Accumulate ads when new data arrives
  useEffect(() => {
    if (data?.ads && data.ads.length >= 0) {
      if (filters.page === 1) {
        setAllAds(data.ads);
      } else {
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
  }, [data, filters.page]);

  // Reset pagination accumulator when search query or major filters change
  useEffect(() => {
    setFilters(prev => ({ ...prev, page: 1 }));
  }, [filters.query, filters.globalSearch, filters.listingType, filters.brand, filters.model, filters.condition, filters.grade, filters.minPrice, filters.maxPrice, filters.minYear, filters.maxYear, filters.fuelType, filters.transmission, filters.district, filters.city, filters.seller, filters.urgentOnly]);

  const filteredAds = useMemo(() => {
    return allAds;
  }, [allAds]);

  // Handle filter changes
  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value, page: key === 'page' ? (value as number) : 1 };

      // Reset dependent fields when parent fields change to avoid invalid combinations
      if (key === 'brand') {
        newFilters.model = '';
        newFilters.grade = 'all';
      }
      if (key === 'model') {
        newFilters.grade = 'all';
      }
      if (key === 'district') {
        newFilters.city = 'all';
      }

      // Auto-correct Year Range logic
      if (key === 'minYear' && value !== 'any') {
        if (prev.maxYear && prev.maxYear !== 'any' && parseInt(prev.maxYear) < parseInt(value)) {
          newFilters.maxYear = 'any'; // Reset max year if invalid
        }
      }
      if (key === 'maxYear' && value !== 'any') {
        if (prev.minYear && prev.minYear !== 'any' && parseInt(prev.minYear) > parseInt(value)) {
          newFilters.minYear = 'any'; // Reset min year if invalid
        }
      }

      return newFilters;
    });
    if (key !== 'page') {
      setVisibleCount(12);
    }

    // Smoothly scroll back to the top of the search results grid
    if (typeof window !== "undefined") {
      const resultsElement = document.getElementById("search-results-start");
      if (resultsElement) {
        resultsElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      query: '',
      globalSearch: '',
      listingType: 'all',
      vehicleType: 'all',
      brand: 'all',
      model: '',
      grade: 'all',
      condition: 'all',
      minPrice: '',
      maxPrice: '',
      minYear: 'any',
      maxYear: 'any',
      fuelType: 'all',
      transmission: 'all',
      district: 'all',
      city: 'all',
      seller: 'all',
      urgentOnly: false,
      page: 1
    });
  };

  // Count active filters
  const activeFilterCount = Object.entries(filters).filter(([key, value]) =>
    key !== 'page' && value && value.toString().trim() !== '' &&
    value !== 'all' && value !== 'any'
  ).length;

  // Format price
  const formatPrice = (price: number | null, isNegotiable = false) => {
    if (!price && isNegotiable) return "Negotiable";
    if (!price) return "Negotiable";
    const formatted = `Rs. ${price.toLocaleString()}`;
    if (isNegotiable) {
      return <>{formatted}<span className="text-[10px] font-normal opacity-70 ml-1">Negotiable</span></>;
    }
    return formatted;
  };

  // Generate years
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 30 }, (_, i) => currentYear - i);
  }, []);

  // Generate filtered max year options based on selected min year
  const maxYearOptions = useMemo(() => {
    if (!filters.minYear || filters.minYear === 'any') {
      return years;
    }
    const minYearValue = parseInt(filters.minYear);
    return years.filter(year => year >= minYearValue);
  }, [years, filters.minYear]);

  // Top Ad rotation state (1 minute)
  const [topAdRotationIndex, setTopAdRotationIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTopAdRotationIndex((i) => i + 1);
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Featured ad rotation (1 minute)
  const [featuredRotationIndex, setFeaturedRotationIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setFeaturedRotationIndex((i) => i + 1);
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const sortedAds = useMemo(() => {
    if (!filteredAds.length) return [];

    const ads = [...filteredAds];
    const now = Date.now();

    return ads.sort((a, b) => {
      const timeDiff = getAdSortTime(b, now) - getAdSortTime(a, now);
      if (timeDiff !== 0) return timeDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [filteredAds]);

  const topAdsPool = useMemo(() => {
    return topAdsData?.ads || [];
  }, [topAdsData]);

  const shuffledTopAdsPool = useMemo(() => shuffleArray(topAdsPool), [topAdsPool]);

  const displayedTopAds = useMemo(() => {
    if (shuffledTopAdsPool.length === 0) return [];
    return getRotatingSlice(shuffledTopAdsPool, topAdRotationIndex, 2);
  }, [shuffledTopAdsPool, topAdRotationIndex]);

  const featuredAdsPool = useMemo(() => {
    return featuredAdsData?.ads || [];
  }, [featuredAdsData]);

  const shuffledFeaturedAdsPool = useMemo(() => shuffleArray(featuredAdsPool), [featuredAdsPool]);

  const displayedFeaturedAds = useMemo(() => {
    if (shuffledFeaturedAdsPool.length === 0) return [];
    return getRotatingSlice(shuffledFeaturedAdsPool, featuredRotationIndex, 2);
  }, [shuffledFeaturedAdsPool, featuredRotationIndex]);

  const featuredInsertPool = useMemo(() => {
    return shuffledFeaturedAdsPool.filter((ad) => !(ad as any).topAdActive);
  }, [shuffledFeaturedAdsPool]);

  const baseAds = useMemo(() => {
    return sortedAds.filter((ad) => !(ad as any).featuredActive && !(ad as any).topAdActive);
  }, [sortedAds]);

  const interleavedAds = useMemo(() => {
    return interleaveFeaturedAds(baseAds, featuredInsertPool, featuredRotationIndex, 16);
  }, [baseAds, featuredInsertPool, featuredRotationIndex]);

  // Validate price range
  const isPriceRangeInvalid = useMemo(() => {
    if (filters.minPrice && filters.maxPrice) {
      const min = parseInt(filters.minPrice);
      const max = parseInt(filters.maxPrice);
      if (!isNaN(min) && !isNaN(max) && min > max) {
        return true;
      }
    }
    return false;
  }, [filters.minPrice, filters.maxPrice]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="text-slate-600 hover:text-slate-900"
            >
              ← Back
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900">Search Vehicles</h1>
              <p className="text-slate-600">
                {filteredAds.length} results found
                {activeFilterCount > 0 && ` with ${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} applied`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar - Search Filters */}
          <div className="w-full lg:w-72 flex-shrink-0">
            <Card className="p-4 shadow-none border border-slate-200/80 rounded-xl bg-white">
              <div
                className="flex items-center justify-between mb-4 cursor-pointer lg:cursor-default"
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              >
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Filter className="h-5 w-5 text-teal-600" />
                  Filters
                </h2>
                <div className="flex items-center gap-2">
                  {activeFilterCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFilters();
                      }}
                      className="text-xs text-teal-600 hover:text-teal-700 h-7 px-2"
                    >
                      Clear
                    </Button>
                  )}
                  {/* Mobile Toggle Icon */}
                  <div className="lg:hidden text-slate-400">
                    {isFiltersOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                </div>
              </div>
              <div className={`${isFiltersOpen ? 'block' : 'hidden'} lg:block space-y-4`}>
                {/* Global Search Bar */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                    <Search className="h-4 w-4 inline mr-1" />
                    Search
                  </label>
                  <Input
                    placeholder="Search by ID, make, model..."
                    value={filters.globalSearch}
                    onChange={(e) => handleFilterChange('globalSearch', e.target.value)}
                    className="h-10 text-sm border-slate-200 bg-white rounded-lg shadow-none focus:ring-teal-500 focus:border-teal-500"
                  />
                 </div>

                <Separator className="my-3" />

                {/* District & City – moved to top for quick location filtering */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                      District
                    </label>
                    <Select
                      value={filters.district}
                      onValueChange={(value) => {
                        handleFilterChange('district', value);
                        setDistrictSearch('');
                      }}
                    >
                      <SelectTrigger className="h-10 text-sm border-slate-200 bg-white rounded-lg shadow-none focus:ring-teal-500 focus:border-teal-500">
                        <SelectValue placeholder="All Districts" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        <div className="p-2 border-b sticky top-0 bg-white z-10">
                          <Input
                            autoFocus
                            placeholder="Search districts..."
                            value={districtSearch}
                            onChange={(e) => setDistrictSearch(e.target.value)}
                            className="h-8 text-sm"
                            onMouseDown={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          />
                        </div>
                        <SelectItem value="all">All</SelectItem>
                        {filteredDistricts.map((district) => (
                          <SelectItem key={district} value={district}>{district}</SelectItem>
                        ))}
                        {filteredDistricts.length === 0 && (
                          <div className="p-2 text-sm text-slate-550 text-center">No districts found</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                      City
                    </label>
                    <Select
                      value={filters.city}
                      onValueChange={(value) => {
                        handleFilterChange('city', value);
                        setCitySearch('');
                      }}
                    >
                      <SelectTrigger className="h-10 text-sm border-slate-200 bg-white rounded-lg shadow-none focus:ring-teal-500 focus:border-teal-500">
                        <SelectValue placeholder="All Cities" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        <div className="p-2 border-b sticky top-0 bg-white z-10">
                          <Input
                            autoFocus
                            placeholder="Search cities..."
                            value={citySearch}
                            onChange={(e) => setCitySearch(e.target.value)}
                            className="h-8 text-sm"
                            onMouseDown={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          />
                        </div>
                        <SelectItem value="all">All</SelectItem>
                        {filteredCities.map((city) => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                        {filteredCities.length === 0 && (
                          <div className="p-2 text-sm text-slate-550 text-center">No cities found</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator className="my-3" />

                {/* Row 1: Brand & Model */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">
                      Brand
                    </label>
                    <Select
                      value={filters.brand}
                      onValueChange={(value) => {
                        handleFilterChange('brand', value);
                        setBrandSearch('');
                      }}
                    >
                      <SelectTrigger className="h-10 text-sm border-slate-200 bg-white rounded-lg shadow-none focus:ring-teal-500 focus:border-teal-500">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[250px]">
                        <div className="p-2 border-b sticky top-0 bg-white z-10">
                          <Input
                            autoFocus
                            placeholder="Search brands..."
                            value={brandSearch}
                            onChange={(e) => setBrandSearch(e.target.value)}
                            className="h-8 text-sm"
                            onMouseDown={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          />
                        </div>
                        <SelectItem value="all">All</SelectItem>
                        {filteredBrands.map((make) => (
                          <SelectItem key={make} value={make}>{make}</SelectItem>
                        ))}
                        {filteredBrands.length === 0 && (
                          <div className="p-2 text-sm text-slate-550 text-center">No brands found</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">
                      Model
                    </label>
                    <Select
                      value={filters.model || 'all'}
                      onValueChange={(value) => {
                        handleFilterChange('model', value === 'all' ? '' : value);
                        setModelSearch('');
                      }}
                      disabled={!filters.brand || filters.brand === 'all' || loadingModels}
                    >
                      <SelectTrigger className="h-10 text-sm border-slate-200 bg-white rounded-lg shadow-none focus:ring-teal-500 focus:border-teal-500">
                        <SelectValue placeholder={loadingModels ? "Loading..." : "All"} />
                      </SelectTrigger>
                      <SelectContent className="max-h-62.5">
                        <div className="p-2 border-b sticky top-0 bg-white z-10">
                          <Input
                            autoFocus
                            placeholder="Search models..."
                            value={modelSearch}
                            onChange={(e) => setModelSearch(e.target.value)}
                            className="h-8 text-sm"
                            onMouseDown={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          />
                        </div>
                        <SelectItem value="all">All</SelectItem>
                        {filteredModels.map((m) => (
                          <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                        ))}
                        {filteredModels.length === 0 && (
                          <div className="p-2 text-sm text-slate-550 text-center">No models found</div>
                        )}
                      </SelectContent>
                    </Select>
                    {(!filters.brand || filters.brand === 'all') && (
                      <p className="text-xs text-muted-foreground mt-1">Select a brand first</p>
                    )}
                  </div>
                </div>

                <Separator className="my-3" />

                {/* Row 2: Listing Type & Vehicle Type */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">
                      Listing Type
                    </label>
                    <Select
                      value={filters.listingType}
                      onValueChange={(value) => handleFilterChange('listingType', value)}
                    >
                      <SelectTrigger className="h-10 text-sm border-slate-200 bg-white rounded-lg shadow-none focus:ring-teal-500 focus:border-teal-500">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="SELL">For Sale</SelectItem>
                        <SelectItem value="WANT">Want to Buy</SelectItem>
                        <SelectItem value="RENT">For Rent</SelectItem>
                        <SelectItem value="HIRE">For Hire</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">
                      Vehicle Type
                    </label>
                    <Select
                      value={filters.vehicleType}
                      onValueChange={(value) => {
                        handleFilterChange('vehicleType', value);
                        setVehicleTypeSearch('');
                      }}
                    >
                      <SelectTrigger className="h-10 text-sm border-slate-200 bg-white rounded-lg shadow-none focus:ring-teal-500 focus:border-teal-500">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        <div className="p-2 border-b sticky top-0 bg-white z-10">
                          <Input
                            autoFocus
                            placeholder="Search types..."
                            value={vehicleTypeSearch}
                            onChange={(e) => setVehicleTypeSearch(e.target.value)}
                            className="h-8 text-sm"
                            onMouseDown={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          />
                        </div>
                        <SelectItem value="all">All</SelectItem>
                        {filteredVehicleTypes.map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                        {filteredVehicleTypes.length === 0 && (
                          <div className="p-2 text-sm text-slate-550 text-center">No types found</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator className="my-3" />

                {/* Row 3: Grade & Condition */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">
                      Grade
                    </label>
                    <Select
                      value={filters.grade}
                      onValueChange={(value) => {
                        handleFilterChange('grade', value);
                        setGradeSearch('');
                      }}
                      disabled={!filters.brand || filters.brand === 'all' || loadingGrades}
                    >
                      <SelectTrigger className="h-10 text-sm border-slate-200 bg-white rounded-lg shadow-none focus:ring-teal-500 focus:border-teal-500">
                        <SelectValue placeholder={loadingGrades ? "Loading..." : "All"} />
                      </SelectTrigger>
                      <SelectContent className="max-h-[250px]">
                        <div className="p-2 border-b sticky top-0 bg-white z-10">
                          <Input
                            autoFocus
                            placeholder="Search grades..."
                            value={gradeSearch}
                            onChange={(e) => setGradeSearch(e.target.value)}
                            className="h-8 text-sm"
                            onMouseDown={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          />
                        </div>
                        <SelectItem value="all">All</SelectItem>
                        {filteredGrades.map((grade) => (
                          <SelectItem key={grade.id} value={grade.name}>
                            {grade.name}
                          </SelectItem>
                        ))}
                        {filteredGrades.length === 0 && (
                          <div className="p-2 text-sm text-slate-550 text-center">No grades found</div>
                        )}
                      </SelectContent>
                    </Select>
                    {(!filters.brand || filters.brand === 'all') && (
                      <p className="text-xs text-muted-foreground mt-1">Select a brand first</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">
                      Condition
                    </label>
                    <Select
                      value={filters.condition}
                      onValueChange={(value) => handleFilterChange('condition', value)}
                    >
                      <SelectTrigger className="h-10 text-sm border-slate-200 bg-white rounded-lg shadow-none focus:ring-teal-500 focus:border-teal-500">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="New">Brand New</SelectItem>
                        <SelectItem value="Reconditioned">Reconditioned</SelectItem>
                        <SelectItem value="Used">Used</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator className="my-3" />

                {/* Row 4: Fuel Type & Transmission */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">
                      Fuel Type
                    </label>
                    <Select
                      value={filters.fuelType}
                      onValueChange={(value) => handleFilterChange('fuelType', value)}
                    >
                      <SelectTrigger className="h-10 text-sm border-slate-200 bg-white rounded-lg shadow-none focus:ring-teal-500 focus:border-teal-500">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="PETROL">Petrol</SelectItem>
                        <SelectItem value="DIESEL">Diesel</SelectItem>
                        <SelectItem value="HYBRID">Hybrid</SelectItem>
                        <SelectItem value="ELECTRIC">Electric</SelectItem>
                        <SelectItem value="GAS">Gas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">
                      Transmission
                    </label>
                    <Select
                      value={filters.transmission}
                      onValueChange={(value) => handleFilterChange('transmission', value)}
                    >
                      <SelectTrigger className="h-10 text-sm border-slate-200 bg-white rounded-lg shadow-none focus:ring-teal-500 focus:border-teal-500">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="Automatic">Automatic</SelectItem>
                        <SelectItem value="Manual">Manual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator className="my-3" />

                {/* Row 5: Price Range */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">
                    Price Range (Rs.)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Min"
                      type="number"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                      className={`h-10 text-sm border-slate-200 bg-white rounded-lg shadow-none focus:ring-teal-500 focus:border-teal-500 ${isPriceRangeInvalid ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    />
                    <Input
                      placeholder="Max"
                      type="number"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                      className={`h-10 text-sm border-slate-200 bg-white rounded-lg shadow-none focus:ring-teal-500 focus:border-teal-500 ${isPriceRangeInvalid ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    />
                  </div>
                  {isPriceRangeInvalid && (
                    <p className="text-xs text-red-550 mt-1">Min cannot exceed Max</p>
                  )}
                </div>

                <Separator className="my-3" />

                {/* Row 6: Manufacture Year */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">
                    Manufacture Year
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <Select
                      value={filters.minYear}
                      onValueChange={(value) => handleFilterChange('minYear', value)}
                    >
                      <SelectTrigger className="h-10 text-sm border-slate-200 bg-white rounded-lg shadow-none focus:ring-teal-500 focus:border-teal-500">
                        <SelectValue placeholder="Min" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={filters.maxYear}
                      onValueChange={(value) => handleFilterChange('maxYear', value)}
                    >
                      <SelectTrigger className="h-10 text-sm border-slate-200 bg-white rounded-lg shadow-none focus:ring-teal-500 focus:border-teal-500">
                        <SelectValue placeholder="Max" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        {maxYearOptions.map((year) => (
                          <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator className="my-3" />

                {/* Urgent Filter */}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="urgentOnly"
                    checked={filters.urgentOnly}
                    onCheckedChange={(checked) => handleFilterChange('urgentOnly', !!checked)}
                  />
                  <label htmlFor="urgentOnly" className="text-sm font-medium text-red-600 cursor-pointer flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Urgent Ads Only
                  </label>
                </div>
              </div>
            </Card>
          </div>
          <div id="search-results-start" className="flex-1 min-w-0">
            {/* Seller Name Display */}
            {filters.seller && filters.seller !== 'all' && filteredAds.length > 0 && (
              <div className="mb-6 pb-4 border-b border-slate-200">
                <h3 className="text-xl font-bold text-slate-900">
                  {filteredAds[0] && ((filteredAds[0] as any).creator?.name || (filteredAds[0] as any).seller?.name || 'Seller')}'s Listings
                </h3>
                <p className="text-slate-600 text-sm mt-1">
                  {filteredAds.length} vehicle{filteredAds.length !== 1 ? 's' : ''} available
                </p>
              </div>
            )}

            {/* Active Filters Display */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="text-sm font-semibold text-slate-500 mr-1">Active filters:</span>
                {filters.globalSearch && (
                  <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200 py-1 pl-2.5 pr-1.5 rounded-full flex items-center gap-1 shadow-none">
                    Search: "{filters.globalSearch}"
                    <button onClick={() => handleFilterChange('globalSearch', '')} className="text-slate-400 hover:text-slate-700 w-4 h-4 rounded-full flex items-center justify-center hover:bg-slate-350/40 transition-colors font-medium">✕</button>
                  </Badge>
                )}
                {filters.listingType && filters.listingType !== 'all' && (
                  <Badge variant="secondary" className="bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-100 py-1 pl-2.5 pr-1.5 rounded-full flex items-center gap-1 shadow-none">
                    Type: {listingTypeLabels[filters.listingType]}
                    <button onClick={() => handleFilterChange('listingType', 'all')} className="text-teal-400 hover:text-teal-700 w-4 h-4 rounded-full flex items-center justify-center hover:bg-teal-300/40 transition-colors font-medium">✕</button>
                  </Badge>
                )}
                {filters.brand && filters.brand !== 'all' && (
                  <Badge variant="secondary" className="bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-100 py-1 pl-2.5 pr-1.5 rounded-full flex items-center gap-1 shadow-none">
                    Brand: {filters.brand}
                    <button onClick={() => handleFilterChange('brand', 'all')} className="text-teal-400 hover:text-teal-700 w-4 h-4 rounded-full flex items-center justify-center hover:bg-teal-300/40 transition-colors font-medium">✕</button>
                  </Badge>
                )}
                {filters.model && (
                  <Badge variant="secondary" className="bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-100 py-1 pl-2.5 pr-1.5 rounded-full flex items-center gap-1 shadow-none">
                    Model: {filters.model}
                    <button onClick={() => handleFilterChange('model', '')} className="text-teal-400 hover:text-teal-700 w-4 h-4 rounded-full flex items-center justify-center hover:bg-teal-300/40 transition-colors font-medium">✕</button>
                  </Badge>
                )}
                {filters.grade && filters.grade !== 'all' && (
                  <Badge variant="secondary" className="bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-100 py-1 pl-2.5 pr-1.5 rounded-full flex items-center gap-1 shadow-none">
                    Grade: {filters.grade}
                    <button onClick={() => handleFilterChange('grade', 'all')} className="text-teal-400 hover:text-teal-700 w-4 h-4 rounded-full flex items-center justify-center hover:bg-teal-300/40 transition-colors font-medium">✕</button>
                  </Badge>
                )}
                {filters.condition && filters.condition !== 'all' && (
                  <Badge variant="secondary" className="bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-100 py-1 pl-2.5 pr-1.5 rounded-full flex items-center gap-1 shadow-none">
                    Condition: {filters.condition}
                    <button onClick={() => handleFilterChange('condition', 'all')} className="text-teal-400 hover:text-teal-700 w-4 h-4 rounded-full flex items-center justify-center hover:bg-teal-300/40 transition-colors font-medium">✕</button>
                  </Badge>
                )}
                {filters.vehicleType && filters.vehicleType !== 'all' && (
                  <Badge variant="secondary" className="bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-100 py-1 pl-2.5 pr-1.5 rounded-full flex items-center gap-1 shadow-none">
                    Vehicle: {vehicleTypeLabels[filters.vehicleType] || filters.vehicleType}
                    <button onClick={() => handleFilterChange('vehicleType', 'all')} className="text-teal-400 hover:text-teal-700 w-4 h-4 rounded-full flex items-center justify-center hover:bg-teal-300/40 transition-colors font-medium">✕</button>
                  </Badge>
                )}
                {filters.district && filters.district !== 'all' && (
                  <Badge variant="secondary" className="bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-100 py-1 pl-2.5 pr-1.5 rounded-full flex items-center gap-1 shadow-none">
                    District: {filters.district}
                    <button onClick={() => handleFilterChange('district', 'all')} className="text-teal-400 hover:text-teal-700 w-4 h-4 rounded-full flex items-center justify-center hover:bg-teal-300/40 transition-colors font-medium">✕</button>
                  </Badge>
                )}
                {filters.city && filters.city !== 'all' && (
                  <Badge variant="secondary" className="bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-100 py-1 pl-2.5 pr-1.5 rounded-full flex items-center gap-1 shadow-none">
                    City: {filters.city}
                    <button onClick={() => handleFilterChange('city', 'all')} className="text-teal-400 hover:text-teal-700 w-4 h-4 rounded-full flex items-center justify-center hover:bg-teal-300/40 transition-colors font-medium">✕</button>
                  </Badge>
                )}
                {filters.fuelType && filters.fuelType !== 'all' && (
                  <Badge variant="secondary" className="bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-100 py-1 pl-2.5 pr-1.5 rounded-full flex items-center gap-1 shadow-none">
                    Fuel: {filters.fuelType}
                    <button onClick={() => handleFilterChange('fuelType', 'all')} className="text-teal-400 hover:text-teal-700 w-4 h-4 rounded-full flex items-center justify-center hover:bg-teal-300/40 transition-colors font-medium">✕</button>
                  </Badge>
                )}
                {filters.transmission && filters.transmission !== 'all' && (
                  <Badge variant="secondary" className="bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-100 py-1 pl-2.5 pr-1.5 rounded-full flex items-center gap-1 shadow-none">
                    Trans: {filters.transmission}
                    <button onClick={() => handleFilterChange('transmission', 'all')} className="text-teal-400 hover:text-teal-700 w-4 h-4 rounded-full flex items-center justify-center hover:bg-teal-300/40 transition-colors font-medium">✕</button>
                  </Badge>
                )}
                {(filters.minPrice || filters.maxPrice) && (
                  <Badge variant="secondary" className="bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-100 py-1 pl-2.5 pr-1.5 rounded-full flex items-center gap-1 shadow-none">
                    Price: {filters.minPrice ? `Rs. ${parseInt(filters.minPrice).toLocaleString()}` : 'Any'} - {filters.maxPrice ? `Rs. ${parseInt(filters.maxPrice).toLocaleString()}` : 'Any'}
                    <button onClick={() => { handleFilterChange('minPrice', ''); handleFilterChange('maxPrice', ''); }} className="text-teal-400 hover:text-teal-700 w-4 h-4 rounded-full flex items-center justify-center hover:bg-teal-300/40 transition-colors font-medium">✕</button>
                  </Badge>
                )}
                {(filters.minYear !== 'any' || filters.maxYear !== 'any') && (
                  <Badge variant="secondary" className="bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-100 py-1 pl-2.5 pr-1.5 rounded-full flex items-center gap-1 shadow-none">
                    Year: {filters.minYear} - {filters.maxYear}
                    <button onClick={() => { handleFilterChange('minYear', 'any'); handleFilterChange('maxYear', 'any'); }} className="text-teal-400 hover:text-teal-700 w-4 h-4 rounded-full flex items-center justify-center hover:bg-teal-300/40 transition-colors font-medium">✕</button>
                  </Badge>
                )}
                {filters.urgentOnly && (
                  <Badge variant="secondary" className="bg-red-50 text-red-700 hover:bg-red-100 border-red-100 py-1 pl-2.5 pr-1.5 rounded-full flex items-center gap-1 shadow-none">
                    Urgent Only
                    <button onClick={() => handleFilterChange('urgentOnly', false)} className="text-red-400 hover:text-red-700 w-4 h-4 rounded-full flex items-center justify-center hover:bg-slate-350/40 transition-colors font-medium">✕</button>
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 h-7 px-2.5 rounded-full font-medium"
                >
                  Clear all
                </Button>
              </div>
            )}

            {/* Skeleton Loaders (Active during fetching) */}
            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-200/60 p-3 bg-white flex gap-3 animate-pulse">
                    <div className="w-24 sm:w-28 h-18 sm:h-20 bg-slate-100 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-2.5 bg-slate-100 rounded w-1/4" />
                      <div className="h-4 bg-slate-100 rounded w-3/4" />
                      <div className="h-3 bg-slate-100 rounded w-1/2" />
                      <div className="h-4 bg-slate-100 rounded w-1/3 mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Top Ad Slots */}
            {!isLoading && displayedTopAds.length > 0 && (
              <div className="mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayedTopAds.map((vehicle) => (
                    <TopAdCard
                      key={vehicle.id}
                      vehicle={vehicle}
                      vehicleTypeLabels={vehicleTypeLabels}
                      formatPrice={formatPrice}
                      formatAdTitle={formatAdTitle}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Featured Ad Slots - 2 rotating, shown after top ads */}
            {!isLoading && displayedFeaturedAds.length > 0 && (
              <div className="mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayedFeaturedAds.map((vehicle) => (
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
                  ))}
                </div>
              </div>
            )}

            {/* Results Grid */}
            {!isLoading && !error && interleavedAds.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {interleavedAds.map((vehicle) => {
                    const isFeatured = (vehicle as any).featuredActive;
                    const isUrgent = (vehicle as any).urgentActive;
                    const isBump = (vehicle as any).bumpActive;
                    const isTopAd = (vehicle as any).topAdActive;

                    if (isFeatured) {
                      return (
                        <FeaturedAdCard
                          key={`featured-${vehicle.id}`}
                          vehicle={vehicle}
                          vehicleTypeLabels={vehicleTypeLabels}
                          formatPrice={formatPrice}
                          formatAdTitle={formatAdTitle}
                          isBump={isBump}
                          isTopAd={isTopAd}
                          isUrgent={isUrgent}
                        />
                      );
                    }

                    return (
                      <div
                        key={vehicle.id}
                        className="rounded-xl border overflow-hidden transition-all duration-300 cursor-pointer group relative bg-white border-slate-200/70 hover:border-slate-350 shadow-none hover:shadow-none hover:bg-slate-50/10"
                        onClick={() => router.push(buildAdUrl(vehicle))}
                      >
                        {/* Favorite Button */}
                        <div className="absolute top-10 right-2 z-10">
                          <FavoriteButton adId={vehicle.id} />
                        </div>

                        <div className="p-3">
                          <div className="flex gap-3">
                            {/* Vehicle Image Container */}
                            <div className="w-24 sm:w-28 h-18 sm:h-20 flex-shrink-0 relative overflow-hidden bg-slate-55 border border-slate-100 rounded-lg">
                              {/* Urgency Badge */}
                              {isUrgent && (
                                <Badge className="absolute top-1 left-1 z-10 bg-red-600 text-white border-0 text-[8px] font-bold px-1.5 py-0.5 shadow-[0_2px_4px_rgba(220,38,38,0.2)] rounded-full uppercase tracking-wider animate-pulse flex items-center gap-0.5">
                                  <Zap className="h-2 w-2 fill-white" /> Urgent
                                </Badge>
                              )}

                              {(vehicle as any)?.media && (vehicle as any).media.length > 0 && (vehicle as any).media[0]?.media?.url ? (
                                <img
                                  src={(vehicle as any).media[0].media.url}
                                  alt={vehicle.title || 'Vehicle'}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <img
                                  src="/placeholder-image.jpg"
                                  alt={vehicle.title || 'Vehicle'}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              )}

                              {((vehicle as any).bumpActive || (vehicle as any).urgentActive || (vehicle as any).topAdActive || (vehicle as any).featuredActive) && (
                                <div className="absolute bottom-1 right-1 z-10 scale-[0.75] origin-bottom-right">
                                  <BoostBadges bumpActive={(vehicle as any).bumpActive} urgentActive={(vehicle as any).urgentActive} topAdActive={(vehicle as any).topAdActive} featuredActive={(vehicle as any).featuredActive} />
                                </div>
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

                                <div className="text-[10px] text-slate-550 mt-0.5 line-clamp-1 flex items-center gap-1.5">
                                  <span>{vehicle.city || vehicle.location || ""}</span>
                                  {vehicle.mileage !== undefined && vehicle.mileage !== null && (
                                    <>
                                      <span className="text-slate-300">•</span>
                                      <span>{vehicle.mileage.toLocaleString()} km</span>
                                    </>
                                  )}
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
                <div className="text-center mt-8">
                  {data?.pagination && filters.page < data.pagination.totalPages ? (
                    <Button
                      size="lg"
                      variant="outline"
                      className="px-8 py-5 border-teal-700 text-teal-700 hover:bg-teal-700 hover:text-white transition-all duration-300 rounded-sm"
                      onClick={() => handleFilterChange('page', filters.page + 1)}
                      disabled={isLoading}
                    >
                      {isLoading ? "Loading..." : "Load More Vehicles"}
                    </Button>
                  ) : interleavedAds.length > 12 ? (
                    <p className="text-slate-500 text-sm">No more vehicles to load</p>
                  ) : null}
                </div>
              </>
            ) : !isLoading && (
              <Card className="p-10 text-center border border-slate-200/80 bg-white rounded-xl shadow-none">
                <div className="mx-auto w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mb-4 text-teal-600">
                  <Search className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">No matches found</h3>
                <p className="text-slate-500 mt-2 text-sm max-w-sm mx-auto leading-relaxed">
                  We couldn't find any vehicles matching your exact criteria. Try relaxing some of your filters to discover more options.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <Button onClick={clearFilters} className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-5 h-10 shadow-none font-semibold">
                    Reset All Filters
                  </Button>
                </div>
              </Card>
            )}

          </div>

          {/* Right Sidebar - Ad Space */}
          <div className="hidden xl:block w-72 flex-shrink-0">
            <div className="sticky top-6 space-y-4">
              {/* Ad Placeholder 1 */}
              <Card className="p-4 bg-white border-slate-200 overflow-hidden text-center shadow-none">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Advertisement</div>
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg h-64 flex flex-col items-center justify-center text-slate-400 p-6">
                  <TrendingUp className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-xs font-medium">Your Ad Here</p>
                </div>
              </Card>

              {/* Ad Placeholder 2 */}
              <Card className="p-4 bg-teal-900 text-white overflow-hidden shadow-lg border-none relative">
                <div className="relative z-10">
                  <h4 className="font-bold text-lg mb-2">Sell Faster!</h4>
                  <p className="text-xs text-teal-100 mb-4 leading-relaxed">Boost your vehicle reach to thousands of potential buyers instantly.</p>
                  <Button onClick={() => session?.user ? router.push('/sell/new') : router.push('/signin?redirect=/sell/new')} className="w-full bg-white text-teal-900 hover:bg-teal-50 font-bold border-none">
                    Post Free Ad Now
                  </Button>
                </div>
                <Car className="absolute -right-4 -bottom-4 h-24 w-24 text-white/10 rotate-12" />
              </Card>

              {/* Ad Placeholder 3 */}
              <Card className="p-4 bg-white border-slate-200 overflow-hidden text-center shadow-none">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Advertisement</div>
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg h-[400px] flex flex-col items-center justify-center text-slate-400 p-6">
                  <div className="mb-4 flex gap-1">
                    <Sparkles className="h-4 w-4" />
                    <Sparkles className="h-4 w-4" />
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-medium leading-relaxed">Promote your business<br />on Rathagala.lk</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div >
  );
}
