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

// Vehicle type labels
const vehicleTypeLabels: Record<string, string> = {
  CAR: "Car",
  VAN: "Van",
  MOTORCYCLE: "Motorcycle",
  BICYCLE: "Bicycle",
  THREE_WHEEL: "Three Wheeler",
  BUS: "Bus",
  LORRY: "Lorry",
  HEAVY_DUTY: "Heavy Duty",
  TRACTOR: "Tractor",
  AUTO_SERVICE: "Auto Service",
  RENTAL: "Rental",
  AUTO_PARTS: "Auto Parts",
  MAINTENANCE: "Maintenance",
  BOAT: "Boat"
};

// Listing type labels
const listingTypeLabels: Record<string, string> = {
  SELL: "For Sale",
  WANT: "Want to Buy",
  RENT: "For Rent",
  HIRE: "For Hire"
};

// Helper function to format ad title with listing type prefix/suffix
const formatAdTitle = (ad: any): string => {
  const vehicleInfo = [ad.brand, ad.model, ad.manufacturedYear, vehicleTypeLabels[ad.type] || ad.type]
    .filter(Boolean)
    .join(' ');

  if (ad.listingType === 'WANT') {
    return `Want ${vehicleInfo}`;
  } else if (ad.listingType === 'RENT') {
    return `${vehicleInfo} for Rent`;
  } else if (ad.listingType === 'HIRE') {
    return `${vehicleInfo} for Hire`;
  }
  return vehicleInfo;
};

const shuffleArray = <T,>(items: T[]): T[] => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const getRotatingSlice = <T,>(items: T[], startIndex: number, count: number): T[] => {
  if (items.length === 0 || count <= 0) return [];
  const normalizedStart = ((startIndex % items.length) + items.length) % items.length;
  const limit = Math.min(count, items.length);
  return Array.from({ length: limit }, (_, i) => items[(normalizedStart + i) % items.length]);
};

// Vehicle makes
const vehicleMakes = [
  "Toyota", "Honda", "Nissan", "BYD", "BMW", "Mercedes-Benz", "Audi", "Hyundai", "Kia",
  "Volkswagen", "Ford", "Chevrolet", "Mazda", "Subaru", "Mitsubishi", "Suzuki",
  "Isuzu", "Bajaj", "Hero", "Yamaha", "Kawasaki", "KTM", "TVS", "Other"
];


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

  // Fetch available models when brand changes
  useEffect(() => {
    const fetchModels = async () => {
      if (!filters.brand || filters.brand === 'all') {
        setAvailableModels([]);
        return;
      }

      setLoadingModels(true);
      try {
        const params = new URLSearchParams({ limit: "500", isActive: "true", brand: filters.brand });
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
    if (!districtSearch) return sriLankanDistricts;
    return sriLankanDistricts.filter(district =>
      district.toLowerCase().includes(districtSearch.toLowerCase())
    );
  }, [districtSearch]);

  // Filter cities based on search input
  const filteredCities = useMemo(() => {
    if (!citySearch) return availableCities;
    return availableCities.filter(city =>
      city.toLowerCase().includes(citySearch.toLowerCase())
    );
  }, [citySearch, availableCities]);

  // Filter vehicle types based on search input
  const filteredVehicleTypes = useMemo(() => {
    if (!vehicleTypeSearch) return Object.entries(vehicleTypeLabels);
    return Object.entries(vehicleTypeLabels).filter(([_, label]) =>
      label.toLowerCase().includes(vehicleTypeSearch.toLowerCase())
    );
  }, [vehicleTypeSearch]);

  // Filter brands based on search input
  const filteredBrands = useMemo(() => {
    if (!brandSearch) return vehicleMakes;
    return vehicleMakes.filter(brand =>
      brand.toLowerCase().includes(brandSearch.toLowerCase())
    );
  }, [brandSearch]);

  // Filter models based on search input
  const filteredModels = useMemo(() => {
    if (!modelSearch) return availableModels;
    return availableModels.filter(m =>
      m.name.toLowerCase().includes(modelSearch.toLowerCase())
    );
  }, [modelSearch, availableModels]);

  // Filter grades based on search input
  const filteredGrades = useMemo(() => {
    if (!gradeSearch) return availableGrades;
    return availableGrades.filter(g =>
      g.name.toLowerCase().includes(gradeSearch.toLowerCase())
    );
  }, [gradeSearch, availableGrades]);

  // Fetch ads with current filters - fetch all ads to enable comprehensive search
  // (pagination will be handled client-side after filtering)
  const { data, isLoading, error } = useGetAds({
    page: 1, // Always fetch from page 1
    limit: 10000, // Fetch large number to get all ads for comprehensive search
    search: filters.query,
    listingType: filters.listingType,
    // Add other filter parameters as supported by your API
  });

  // Filter results based on local filters (client-side filtering for now)
  const filteredAds = useMemo(() => {
    if (!data?.ads) return [];

    // Split search query into individual terms for comprehensive search
    const queryTerms = filters.query
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(term => term.length > 0);

    // Split global search into individual terms
    const globalSearchTerms = filters.globalSearch
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(term => term.length > 0);

    return data.ads.filter((ad) => {
      // Only show published ads (status must be ACTIVE and published flag must be true)
      if ((ad as any).status !== "ACTIVE" || (ad as any).published !== true) {
        return false;
      }

      // Query filter - ALL search terms must match (AND logic)
      if (queryTerms.length > 0) {
        const matchesAllQueryTerms = queryTerms.every(term => {
          return (
            // Ad ID
            ad.id?.toLowerCase().includes(term) ||
            // Title
            ad.title?.toLowerCase().includes(term) ||
            // Brand
            ad.brand?.toLowerCase().includes(term) ||
            // Model
            ad.model?.toLowerCase().includes(term) ||
            // Vehicle Type
            vehicleTypeLabels[ad.type as keyof typeof vehicleTypeLabels]?.toLowerCase().includes(term) ||
            // City
            ad.city?.toLowerCase().includes(term) ||
            // Location
            ad.location?.toLowerCase().includes(term) ||
            // District (if available in ad object)
            (ad as any).district?.toLowerCase().includes(term) ||
            // Manufacture Year
            ad.manufacturedYear?.toString().includes(term)
          );
        });

        if (!matchesAllQueryTerms) {
          return false;
        }
      }

      // Global search filter - ALL search terms must match (AND logic)
      if (globalSearchTerms.length > 0) {
        const matchesAllGlobalTerms = globalSearchTerms.every(term => {
          return (
            ad.id?.toLowerCase().includes(term) ||
            ad.brand?.toLowerCase().includes(term) ||
            ad.model?.toLowerCase().includes(term) ||
            ad.city?.toLowerCase().includes(term) ||
            ad.description?.toLowerCase().includes(term) ||
            (ad as any).phoneNumber?.toString().includes(term) ||
            (ad as any).whatsappNumber?.toString().includes(term) ||
            (ad as any).creator?.name?.toLowerCase().includes(term) ||
            (ad as any).creator?.email?.toLowerCase().includes(term) ||
            vehicleTypeLabels[ad.type as keyof typeof vehicleTypeLabels]?.toLowerCase().includes(term) ||
            ad.title?.toLowerCase().includes(term) ||
            ad.location?.toLowerCase().includes(term) ||
            (ad as any).district?.toLowerCase().includes(term) ||
            ad.manufacturedYear?.toString().includes(term)
          );
        });

        if (!matchesAllGlobalTerms) {
          return false;
        }
      }

      // Vehicle type filter
      if (filters.vehicleType && filters.vehicleType !== 'all' && ad.type !== filters.vehicleType) {
        return false;
      }

      // Brand filter
      if (filters.brand && filters.brand !== 'all' && ad.brand?.toLowerCase() !== filters.brand.toLowerCase()) {
        return false;
      }

      // Model filter
      if (filters.model && !ad.model?.toLowerCase().includes(filters.model.toLowerCase())) {
        return false;
      }

      // Condition filter
      if (filters.condition && filters.condition !== 'all' && ad.condition?.toLowerCase() !== filters.condition.toLowerCase()) {
        return false;
      }

      // Grade filter
      if (filters.grade && filters.grade !== 'all' && (ad as any).grade?.toLowerCase() !== filters.grade.toLowerCase()) {
        return false;
      }

      // Price filters
      if (filters.minPrice && ad.price && ad.price < parseInt(filters.minPrice)) {
        return false;
      }
      if (filters.maxPrice && ad.price && ad.price > parseInt(filters.maxPrice)) {
        return false;
      }

      // Year filters
      if (filters.minYear && filters.minYear !== 'any' && ad.manufacturedYear && parseInt(ad.manufacturedYear) < parseInt(filters.minYear)) {
        return false;
      }
      if (filters.maxYear && filters.maxYear !== 'any' && ad.manufacturedYear && parseInt(ad.manufacturedYear) > parseInt(filters.maxYear)) {
        return false;
      }

      // Fuel type filter
      if (filters.fuelType && filters.fuelType !== 'all' && ad.fuelType !== filters.fuelType) {
        return false;
      }

      // Transmission filter
      if (filters.transmission && filters.transmission !== 'all' && ad.transmission !== filters.transmission) {
        return false;
      }

      // Location filter (District)
      if (filters.district && filters.district !== 'all' && filters.district !== 'any') {
        if ((ad as any).district && (ad as any).district.toLowerCase() !== filters.district.toLowerCase()) {
          return false;
        } else if (!(ad as any).district && ad.city) {
          let cityDistrict = "";
          Object.values(locationData).forEach(province => {
            Object.entries(province).forEach(([dist, cities]) => {
              if (cities.some(c => c.toLowerCase() === ad.city.toLowerCase())) {
                cityDistrict = dist;
              }
            });
          });
          if (cityDistrict && cityDistrict.toLowerCase() !== filters.district.toLowerCase()) {
            return false;
          }
        }
      }

      // Location filter (City)
      if (filters.city && filters.city !== 'all' && filters.city !== 'any' && ad.city?.toLowerCase() !== filters.city.toLowerCase()) {
        return false;
      }

      // Seller filter (match common seller fields)
      if (filters.seller && filters.seller !== 'all') {
        const sid = String((ad as any).userId || (ad as any).user_id || (ad as any).sellerId || (ad as any).ownerId || (ad as any).user?.id || (ad as any).seller?.id || (ad as any).createdBy || "");
        if (!sid || sid !== filters.seller) {
          return false;
        }
      }

      // Urgent filter
      if (filters.urgentOnly && !(ad as any).urgentActive) {
        return false;
      }

      return true;
    });
  }, [data?.ads, filters.query, filters.vehicleType, filters.brand, filters.model, filters.condition, filters.grade, filters.minPrice, filters.maxPrice, filters.minYear, filters.maxYear, filters.fuelType, filters.transmission, filters.district, filters.city, filters.globalSearch, filters.seller, filters.urgentOnly]);

  // Handle filter changes
  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value, page: key === 'page' ? (value as number) : 1 };

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
      return <>{formatted}<div className="text-sm font-normal opacity-70"> Negotiable</div></>;
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
    const dayMs = 24 * 60 * 60 * 1000;
    const isBumpOnly = (ad: any) =>
      Boolean(ad?.bumpActive && !ad?.topAdActive && !ad?.featuredActive && !ad?.urgentActive);
    const getSortTime = (ad: any) => {
      const createdAtMs = ad?.createdAt ? new Date(ad.createdAt).getTime() : 0;
      if (!isBumpOnly(ad)) return createdAtMs;
      const bumpStart = ad?.bumpStartAt || ad?.boostStartAt || ad?.boostRequestedAt || ad?.updatedAt || ad?.createdAt;
      const bumpStartMs = bumpStart ? new Date(bumpStart).getTime() : createdAtMs;
      if (!Number.isFinite(bumpStartMs)) return createdAtMs;
      const elapsed = Math.max(0, now - bumpStartMs);
      const cycles = Math.floor(elapsed / dayMs);
      const lastBumpMs = bumpStartMs + cycles * dayMs;
      return Math.max(createdAtMs, lastBumpMs);
    };

    return ads.sort((a, b) => {
      const timeDiff = getSortTime(b) - getSortTime(a);
      if (timeDiff !== 0) return timeDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [filteredAds]);

  const topAdsPool = useMemo(() => {
    if (!filteredAds.length) return [];
    return filteredAds.filter((ad) => (ad as any).topAdActive && !(ad as any).featuredActive && !(ad as any).bumpActive);
  }, [filteredAds]);

  const shuffledTopAdsPool = useMemo(() => shuffleArray(topAdsPool), [topAdsPool]);

  const displayedTopAds = useMemo(() => {
    if (shuffledTopAdsPool.length === 0) return [];
    return getRotatingSlice(shuffledTopAdsPool, topAdRotationIndex, 2);
  }, [shuffledTopAdsPool, topAdRotationIndex]);

  const featuredAdsPool = useMemo(() => {
    if (!filteredAds.length) return [];
    return filteredAds.filter((ad) => (ad as any).featuredActive);
  }, [filteredAds]);

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
    if (baseAds.length === 0) return [];
    if (featuredInsertPool.length === 0) return baseAds;

    const result: any[] = [];
    const insertCount = Math.min(2, featuredInsertPool.length);
    const poolLength = featuredInsertPool.length;
    const startOffset = (featuredRotationIndex * insertCount) % poolLength;
    let insertOffset = 0;

    baseAds.forEach((ad, index) => {
      result.push(ad);
      if ((index + 1) % 16 === 0) {
        for (let i = 0; i < insertCount; i += 1) {
          const pos = (startOffset + insertOffset + i) % poolLength;
          result.push(featuredInsertPool[pos]);
        }
        insertOffset += insertCount;
      }
    });

    return result;
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
            <Card className="p-4 shadow-sm border-slate-200">
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
                    placeholder="Search by ID, make, model, city, phone..."
                    value={filters.globalSearch}
                    onChange={(e) => handleFilterChange('globalSearch', e.target.value)}
                    className="h-10 text-sm border-slate-200 focus:ring-teal-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">Search by ad ID, make, model, city, title</p>
                </div>

                <Separator className="my-3" />

                {/* Row 1: Location */}
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
                      <SelectTrigger className="h-10 text-sm border-slate-200 focus:ring-teal-500">
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
                          <div className="p-2 text-sm text-slate-500 text-center">No districts found</div>
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
                      <SelectTrigger className="h-10 text-sm border-slate-200 focus:ring-teal-500">
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
                          <div className="p-2 text-sm text-slate-500 text-center">No cities found</div>
                        )}
                      </SelectContent>
                    </Select>
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
                      <SelectTrigger className="h-9 text-sm">
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
                      <SelectTrigger className="h-9 text-sm">
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
                          <div className="p-2 text-sm text-slate-500 text-center">No types found</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator className="my-3" />

                {/* Row 3: Brand & Model */}
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
                      <SelectTrigger className="h-9 text-sm">
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
                          <div className="p-2 text-sm text-slate-500 text-center">No brands found</div>
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
                      <SelectTrigger className="h-9 text-sm">
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
                          <div className="p-2 text-sm text-slate-500 text-center">No models found</div>
                        )}
                      </SelectContent>
                    </Select>
                    {(!filters.brand || filters.brand === 'all') && (
                      <p className="text-xs text-muted-foreground mt-1">Select a brand first</p>
                    )}
                  </div>
                </div>

                <Separator className="my-3" />

                {/* Row 4: Grade & Condition */}
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
                      <SelectTrigger className="h-9 text-sm">
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
                          <div className="p-2 text-sm text-slate-500 text-center">No grades found</div>
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
                      <SelectTrigger className="h-9 text-sm">
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
                      className={`h-9 text-sm ${isPriceRangeInvalid ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    />
                    <Input
                      placeholder="Max"
                      type="number"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                      className={`h-9 text-sm ${isPriceRangeInvalid ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    />
                  </div>
                  {isPriceRangeInvalid && (
                    <p className="text-xs text-red-500 mt-1">Min cannot exceed Max</p>
                  )}
                </div>

                <Separator className="my-3" />

                {/* Row 6: Year Range */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">
                    Manufacture Year
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <Select
                      value={filters.minYear}
                      onValueChange={(value) => handleFilterChange('minYear', value)}
                    >
                      <SelectTrigger className="h-9 text-sm">
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
                      <SelectTrigger className="h-9 text-sm">
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

                {/* Row 7: Fuel Type & Transmission */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">
                      Fuel Type
                    </label>
                    <Select
                      value={filters.fuelType}
                      onValueChange={(value) => handleFilterChange('fuelType', value)}
                    >
                      <SelectTrigger className="h-9 text-sm">
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
                      <SelectTrigger className="h-9 text-sm">
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

          {/* Center Column - Search Results */}
          <div className="flex-1 min-w-0">
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
              <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                <span className="text-sm font-medium text-slate-500 whitespace-nowrap">Active filters:</span>
                {filters.listingType && filters.listingType !== 'all' && (
                  <Badge variant="secondary" className="bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-100 py-1">
                    {listingTypeLabels[filters.listingType]}
                    <button onClick={() => handleFilterChange('listingType', 'all')} className="ml-1.5">×</button>
                  </Badge>
                )}
                {filters.brand && filters.brand !== 'all' && (
                  <Badge variant="secondary" className="bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-100 py-1">
                    {filters.brand}
                    <button onClick={() => handleFilterChange('brand', 'all')} className="ml-1.5">×</button>
                  </Badge>
                )}
                {filters.district && filters.district !== 'all' && (
                  <Badge variant="secondary" className="bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-100 py-1">
                    {filters.district}
                    <button onClick={() => handleFilterChange('district', 'all')} className="ml-1.5">×</button>
                  </Badge>
                )}
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
                  {interleavedAds.slice(0, visibleCount).map((vehicle) => {
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
                        className="rounded-lg border overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer group relative bg-white border-slate-200 hover:border-slate-300"
                        onClick={() => router.push(buildAdUrl(vehicle))}
                      >
                        {/* Favorite Button */}
                        <div className="absolute top-10 right-2 z-10">
                          <FavoriteButton adId={vehicle.id} />
                        </div>

                        {(isBump || isUrgent) && (
                          <div className="absolute bottom-2 right-2 z-10">
                            <BoostBadges bumpActive={isBump} urgentActive={isUrgent} />
                          </div>
                        )}

                        <div className="p-3">
                          {/* Vehicle Title - Centered */}
                          <h3 className="font-semibold text-sm text-slate-800 text-center mb-2 transition-colors group-hover:text-teal-700 line-clamp-1">
                            {formatAdTitle(vehicle)}
                          </h3>

                          <div className="flex">
                            {/* Vehicle Image */}
                            <div className="w-36 h-30 flex-shrink-0">
                              {(vehicle as any)?.media && (vehicle as any).media.length > 0 && (vehicle as any).media[0]?.media?.url ? (
                                <img
                                  src={(vehicle as any).media[0].media.url}
                                  alt={vehicle.title || 'Vehicle'}
                                  className="w-full h-full object-cover rounded-md group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <img
                                  src="/placeholder-image.jpg"
                                  alt={vehicle.title || 'Vehicle'}
                                  className="w-full h-full object-cover rounded-md group-hover:scale-105 transition-transform duration-300"
                                />
                              )}
                            </div>

                            {/* Vehicle Details */}
                            <div className="flex-1 pl-3 flex flex-col justify-between">
                              <div>
                                <div className="text-xs text-slate-600 mb-1 line-clamp-1">
                                  {vehicle.city || vehicle.location || ""}
                                </div>

                                <div className="text-sm font-semibold text-teal-700 mb-1">
                                  {formatPrice(vehicle.price, (vehicle as any).metadata?.isNegotiable)}
                                </div>

                                <div className="text-xs text-slate-500">
                                  {vehicle.condition || vehicle.type}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
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
                    );
                  })}
                </div>
                <div className="text-center mt-8">
                  {visibleCount < interleavedAds.length ? (
                    <Button
                      size="lg"
                      variant="outline"
                      className="px-8 py-5 border-teal-700 text-teal-700 hover:bg-teal-700 hover:text-white transition-all duration-300"
                      onClick={() => setVisibleCount((prev) => prev + 12)}
                    >
                      Load More Vehicles
                    </Button>
                  ) : interleavedAds.length > 12 ? (
                    <p className="text-slate-500 text-sm">No more vehicles to load</p>
                  ) : null}
                </div>
              </>
            ) : !isLoading && (
              <Card className="p-12 text-center border-dashed border-2 bg-slate-50">
                <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900">No results found</h3>
                <p className="text-slate-500 mt-1 max-w-xs mx-auto">Try adjusting your filters or clearing them to see more vehicles.</p>
                <Button onClick={clearFilters} variant="outline" className="mt-6 border-slate-300">
                  Clear all filters
                </Button>
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
