"use client"

import { useState, useMemo, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, ChevronUp, TrendingUp, Loader2, Car, Search, Filter, Eye, Star, Zap, AlertCircle } from "lucide-react";
import { BoostBadges } from "@/features/boost/components/boost-badges";
import { TopAdCard } from "@/features/ads/components/top-ad-card";
import { FeaturedAdCard } from "@/features/ads/components/featured-ad-card";
import { getRelativeTime } from "@/lib/utils";
import { useGetAds } from "@/features/ads/api/use-get-ads";
import { FavoriteButton } from "@/features/saved-ads/components/favorite-button";
import { authClient } from "@/lib/auth-client";
import { buildAdUrl } from "@/lib/ad-url";
import { locationData, getAllCities, getAllDistricts } from "@/lib/location-data";

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

const sriLankanCities = getAllCities();
const sriLankanDistricts = getAllDistricts();

// Filter interface (brand is pre-set from URL)
interface BrandPageFilters {
  query: string;
  listingType: string;
  vehicleType: string;
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
  page: number;
}

export default function BrandPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = authClient.useSession();

  // Decode brand name from URL
  const brandName = decodeURIComponent((params.name as string) || "");

  // Initialize filters
  const [filters, setFilters] = useState<BrandPageFilters>({
    query: '',
    listingType: 'all',
    vehicleType: 'all',
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
    page: 1
  });

  // Search states for dropdown filtering
  const [districtSearch, setDistrictSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [vehicleTypeSearch, setVehicleTypeSearch] = useState('');
  const [availableGrades, setAvailableGrades] = useState<{ id: string; name: string }[]>([]);
  const [loadingGrades, setLoadingGrades] = useState(false);

  // Fetch available grades when brand changes
  useEffect(() => {
    const fetchGrades = async () => {
      setLoadingGrades(true);
      try {
        const params = new URLSearchParams({ limit: "500", isActive: "true" });
        params.set("brand", brandName);
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

    if (brandName) {
      fetchGrades();
    }
  }, [brandName, filters.model]);

  // Mobile sidebar state
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);

  // Derive available cities based on district selection
  const availableCities = useMemo(() => {
    if (!filters.district || filters.district === "all" || filters.district === "any") return sriLankanCities;

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

  // Fetch all ads (same pattern as search page)
  const { data, isLoading, error } = useGetAds({
    page: 1,
    limit: 10000,
    search: filters.query,
    listingType: filters.listingType,
  });

  // Filter results client-side — always filter by brand from URL
  const filteredAds = useMemo(() => {
    if (!data?.ads) return [];

    const queryTerms = filters.query
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(term => term.length > 0);

    return data.ads.filter((ad) => {
      // Only show published ads
      if ((ad as any).status !== "ACTIVE" || (ad as any).published !== true) {
        return false;
      }

      // Brand filter — always applied from URL param (case-insensitive)
      if (!ad.brand || ad.brand.toLowerCase() !== brandName.toLowerCase()) {
        return false;
      }

      // Query filter — ALL search terms must match (AND logic)
      if (queryTerms.length > 0) {
        const matchesAllQueryTerms = queryTerms.every(term => {
          return (
            ad.id?.toLowerCase().includes(term) ||
            ad.title?.toLowerCase().includes(term) ||
            ad.brand?.toLowerCase().includes(term) ||
            ad.model?.toLowerCase().includes(term) ||
            vehicleTypeLabels[ad.type as keyof typeof vehicleTypeLabels]?.toLowerCase().includes(term) ||
            ad.city?.toLowerCase().includes(term) ||
            ad.location?.toLowerCase().includes(term) ||
            (ad as any).district?.toLowerCase().includes(term) ||
            ad.manufacturedYear?.toString().includes(term)
          );
        });

        if (!matchesAllQueryTerms) {
          return false;
        }
      }

      // Vehicle type filter
      if (filters.vehicleType && filters.vehicleType !== 'all' && ad.type !== filters.vehicleType) {
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

      return true;
    });
  }, [data?.ads, brandName, filters.query, filters.vehicleType, filters.model, filters.condition, filters.grade, filters.minPrice, filters.maxPrice, filters.minYear, filters.maxYear, filters.fuelType, filters.transmission, filters.district, filters.city]);

  // Handle filter changes
  const handleFilterChange = (key: keyof BrandPageFilters, value: any) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value, page: key === 'page' ? (value as number) : 1 };

      if (key === 'minYear' && value !== 'any') {
        if (prev.maxYear && prev.maxYear !== 'any' && parseInt(prev.maxYear) < parseInt(value)) {
          newFilters.maxYear = 'any';
        }
      }
      if (key === 'maxYear' && value !== 'any') {
        if (prev.minYear && prev.minYear !== 'any' && parseInt(prev.minYear) > parseInt(value)) {
          newFilters.minYear = 'any';
        }
      }

      return newFilters;
    });
  };

  // Clear all filters (brand stays from URL)
  const clearFilters = () => {
    setFilters({
      query: '',
      listingType: 'all',
      vehicleType: 'all',
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

  // Pagination logic
  const limit = 20;
  const totalPages = Math.ceil(filteredAds.length / limit);
  const currentPage = Math.max(1, Math.min(filters.page, Math.max(1, totalPages)));

  const paginatedAds = useMemo(() => {
    const startIndex = (currentPage - 1) * limit;
    return filteredAds.slice(startIndex, startIndex + limit);
  }, [filteredAds, currentPage, limit]);

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
              <h1 className="text-2xl font-bold text-slate-900">{brandName} Vehicles</h1>
              <p className="text-slate-600">
                {isLoading ? "Loading..." : `${filteredAds.length} results found`}
                {activeFilterCount > 0 && ` with ${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} applied`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar - Filters */}
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
                  <div className="lg:hidden text-slate-400">
                    {isFiltersOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                </div>
              </div>

              <div className={`${isFiltersOpen ? 'block' : 'hidden'} lg:block space-y-4`}>
                {/* Brand (read-only indicator) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Brand
                  </label>
                  <div className="h-10 px-3 flex items-center rounded-md border border-teal-200 bg-teal-50 text-sm font-medium text-teal-800">
                    {brandName}
                  </div>
                </div>

                <Separator className="my-3" />

                {/* Search within brand */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                    <Search className="h-4 w-4 inline mr-1" />
                    Search within {brandName}
                  </label>
                  <Input
                    placeholder="Search by model, year..."
                    value={filters.query}
                    onChange={(e) => handleFilterChange('query', e.target.value)}
                    className="h-10 text-sm border-slate-200 focus:ring-teal-500"
                  />
                </div>

                <Separator className="my-3" />

                {/* Location */}
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

                {/* Listing Type & Vehicle Type */}
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

                {/* Model & Condition */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">
                      Model
                    </label>
                    <Input
                      placeholder="Enter model"
                      value={filters.model}
                      onChange={(e) => handleFilterChange('model', e.target.value)}
                      className="h-9 text-sm"
                    />
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

                {/* Grade */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">
                    Grade
                  </label>
                  <Select
                    value={filters.grade}
                    onValueChange={(value) => handleFilterChange('grade', value)}
                    disabled={loadingGrades}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder={loadingGrades ? "Loading..." : "All"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {availableGrades.map((grade) => (
                        <SelectItem key={grade.id} value={grade.name}>
                          {grade.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator className="my-3" />

                {/* Price Range */}
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

                {/* Year Range */}
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

                {/* Fuel Type & Transmission */}
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
              </div>
            </Card>
          </div>

          {/* Center Column - Results */}
          <div className="flex-1 min-w-0">
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
                {filters.vehicleType && filters.vehicleType !== 'all' && (
                  <Badge variant="secondary" className="bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-100 py-1">
                    {vehicleTypeLabels[filters.vehicleType] || filters.vehicleType}
                    <button onClick={() => handleFilterChange('vehicleType', 'all')} className="ml-1.5">×</button>
                  </Badge>
                )}
                {filters.district && filters.district !== 'all' && (
                  <Badge variant="secondary" className="bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-100 py-1">
                    {filters.district}
                    <button onClick={() => handleFilterChange('district', 'all')} className="ml-1.5">×</button>
                  </Badge>
                )}
                {filters.condition && filters.condition !== 'all' && (
                  <Badge variant="secondary" className="bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-100 py-1">
                    {filters.condition}
                    <button onClick={() => handleFilterChange('condition', 'all')} className="ml-1.5">×</button>
                  </Badge>
                )}
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                <span className="ml-3 text-slate-600">Loading {brandName} vehicles...</span>
              </div>
            )}

            {/* Top Ad Slots */}
            {!isLoading && filteredAds.filter((ad) => (ad as any).topAdActive).length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-semibold text-slate-700">Top Ads</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredAds.filter((ad) => (ad as any).topAdActive).slice(0, 4).map((vehicle) => (
                    <TopAdCard
                      key={`top-${vehicle.id}`}
                      vehicle={vehicle}
                      vehicleTypeLabels={vehicleTypeLabels}
                      formatPrice={formatPrice}
                      formatAdTitle={formatAdTitle}
                    />
                  ))}
                </div>
                <Separator className="mt-4" />
              </div>
            )}

            {/* Results Grid */}
            {!isLoading && !error && paginatedAds.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paginatedAds.map((vehicle) => {
                  const isFeatured = (vehicle as any).featuredActive;
                  const isUrgent = (vehicle as any).urgentActive;
                  const isBump = (vehicle as any).bumpActive;
                  if (isFeatured) {
                    return (
                      <FeaturedAdCard
                        key={vehicle.id}
                        vehicle={vehicle}
                        vehicleTypeLabels={vehicleTypeLabels}
                        formatPrice={formatPrice}
                        formatAdTitle={formatAdTitle}
                        isBump={isBump}
                        isTopAd={false}
                        isUrgent={isUrgent}
                      />
                    );
                  }
                  return (
                    <div
                      key={vehicle.id}
                      className={`rounded-lg border overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer group relative bg-white border-slate-200 hover:border-slate-300 ${isUrgent ? 'border-l-4 border-l-red-400' : ''}`}
                      onClick={() => router.push(buildAdUrl(vehicle))}
                    >
                      {/* Favorite Button */}
                      <div className="absolute top-2 right-2 z-10">
                        <FavoriteButton adId={vehicle.id} />
                      </div>

                      {(isBump || isUrgent) && (
                        <div className="absolute bottom-2 right-2 z-10">
                          <BoostBadges bumpActive={isBump} urgentActive={isUrgent} />
                        </div>
                      )}

                      <div className="p-3">
                        {/* Vehicle Title */}
                        <h3 className="font-semibold text-sm text-slate-800 text-center mb-2 transition-colors group-hover:text-teal-700 line-clamp-1">
                          {formatAdTitle(vehicle)}
                        </h3>

                        <div className="flex">
                          {/* Vehicle Image */}
                          <div className="w-32 h-20 flex-shrink-0">
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
            ) : !isLoading && (
              <Card className="p-12 text-center border-dashed border-2 bg-slate-50">
                <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900">No {brandName} vehicles found</h3>
                <p className="text-slate-500 mt-1 max-w-xs mx-auto">Try adjusting your filters or clearing them to see more vehicles.</p>
                <Button onClick={clearFilters} variant="outline" className="mt-6 border-slate-300">
                  Clear all filters
                </Button>
              </Card>
            )}

            {/* Pagination */}
            {!isLoading && totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-10">
                <Button
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => {
                    handleFilterChange('page', currentPage - 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-6"
                >
                  Previous
                </Button>
                <div className="text-sm font-medium text-slate-600">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => {
                    handleFilterChange('page', currentPage + 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-6"
                >
                  Next
                </Button>
              </div>
            )}
          </div>

          {/* Right Sidebar - Promotions */}
          <div className="hidden xl:block w-72 flex-shrink-0">
            <div className="sticky top-6 space-y-4">
              {/* Sell Faster CTA */}
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

              {/* Ad Placeholder */}
              <Card className="p-4 bg-white border-slate-200 overflow-hidden text-center shadow-none">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Advertisement</div>
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg h-64 flex flex-col items-center justify-center text-slate-400 p-6">
                  <TrendingUp className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-xs font-medium">Your Ad Here</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
