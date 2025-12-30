"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { format } from "date-fns";
import { Filter, Loader2, Search, X } from "lucide-react";
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

// Vehicle type labels
const vehicleTypeLabels: Record<string, string> = {
  CAR: "Car",
  VAN: "Van",
  SUV_JEEP: "SUV / Jeep",
  MOTORCYCLE: "Motorcycle",
  CREW_CAB: "Crew Cab",
  PICKUP_DOUBLE_CAB: "Pickup / Double Cab",
  BUS: "Bus",
  LORRY: "Lorry",
  THREE_WHEEL: "Three Wheel",
  OTHER: "Other",
  TRACTOR: "Tractor",
  HEAVY_DUTY: "Heavy-Duty",
  BICYCLE: "Bicycle"
};

// List of vehicle makes for dropdown
const vehicleMakes = [
  "Toyota", "Honda", "Nissan", "BMW", "Mercedes-Benz", "Land-Rover", "Aprilia", "Ashok-Leyland", "Aston", "Atco", "ATHER",
  "Audi", "Austin", "Baic", "Bajaj", "Bentley", "Borgward", "BYD",
  "Cadillac", "CAT", "Changan", "Chery", "Chevrolet", "Chrysler", "Citroen",
  "Daewoo", "Daihatsu", "Datsun", "DFSK", "Ducati", "Fiat", "Ford", "Hero",
  "Alfa-Romeo", "Hyundai", "Isuzu", "Jaguar", "Jeep", "Kawasaki", "Kia", "KTM",
  "Lexus", "Mahindra", "Mazda", "Micro", "Mini",
  "Mitsubishi", "Perodua", "Peugeot", "Porsche", "Proton", "Renault",
  "Skoda", "Subaru", "Suzuki", "Tata", "Tesla", "Acura", "TVS", "Volkswagen",
  "Volvo", "Yamaha"
];

// Sri Lankan provinces, districts, and cities data (Copied from sell page for consistency)
// Sri Lankan provinces, districts, and cities data (Imported from shared location)
import { locationData } from "@/lib/location-data";

// Flatten cities for default view and create district map
const getAllCities = () => {
  const cities = new Set<string>();
  Object.values(locationData).forEach(province => {
    Object.values(province).forEach(districtCities => {
      districtCities.forEach(city => cities.add(city));
    });
  });
  return Array.from(cities).sort();
};

const sriLankanCities = getAllCities();

// Sri Lankan districts
const sriLankanDistricts = [
  "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo",
  "Galle", "Gampaha", "Hambantota", "Jaffna", "Kalutara",
  "Kandy", "Kegalle", "Kilinochchi", "Kurunegala", "Mannar",
  "Matale", "Matara", "Monaragala", "Mullaitivu", "Nuwara Eliya",
  "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya"
];

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
  const [cityQuery, setCityQuery] = useState("");
  const [showFilterSheet, setShowFilterSheet] = useState(false);

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

  // Use the existing hook to fetch real vehicle data
  const { data, isLoading, error } = useGetAds({
    page: currentPage,
    limit: 8, // Show 8 items initially for better grid layout
    search: activeFilters.model || "", // Pass search query to backend (empty string if null)
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

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
    // Don't clear allAds here - let the data fetch update it
  }, [activeFilters]);

  // Handle load more
  const handleLoadMore = () => {
    if (data && data.pagination && currentPage < data.pagination.totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  // Apply filters to the accumulated data - modify to use activeFilters instead of filters
  // Also ensure only ACTIVE ads are shown (safety filter in case backend doesn't filter correctly)
  const filteredAds = useMemo(() => {
    if (!allAds || allAds.length === 0) return [];

    return allAds.filter((ad) => {
      // Only show ACTIVE ads on the landing page
      if (ad.status !== "ACTIVE") {
        return false;
      }
      // Make filter
      if (
        activeFilters.make &&
        ad.brand?.toLowerCase() !== activeFilters.make.toLowerCase()
      ) {
        return false;
      }

      // Model filter (case insensitive partial match)
      if (
        activeFilters.model &&
        !ad.model?.toLowerCase().includes(activeFilters.model.toLowerCase())
      ) {
        return false;
      }

      // Vehicle type filter
      if (
        activeFilters.vehicleType &&
        ad.type !== activeFilters.vehicleType.toUpperCase()
      ) {
        return false;
      }

      // City filter
      if (
        activeFilters.city &&
        ad.city?.toLowerCase() !== activeFilters.city.toLowerCase()
      ) {
        return false;
      }

      // Condition filter
      if (
        activeFilters.condition &&
        ad.condition?.toLowerCase() !== activeFilters.condition.toLowerCase()
      ) {
        return false;
      }

      // Min price filter
      if (
        activeFilters.minPrice &&
        ad.price &&
        ad.price < parseInt(activeFilters.minPrice)
      ) {
        return false;
      }

      // Max price filter
      if (
        activeFilters.maxPrice &&
        ad.price &&
        ad.price > parseInt(activeFilters.maxPrice)
      ) {
        return false;
      }

      // Min year filter
      if (
        activeFilters.minYear &&
        ad.manufacturedYear &&
        parseInt(ad.manufacturedYear) < parseInt(activeFilters.minYear)
      ) {
        return false;
      }

      // Max year filter
      if (
        activeFilters.maxYear &&
        ad.manufacturedYear &&
        parseInt(ad.manufacturedYear) > parseInt(activeFilters.maxYear)
      ) {
        return false;
      }

      // Fuel type filter
      if (
        activeFilters.fuelType &&
        ad.fuelType?.toLowerCase() !== activeFilters.fuelType.toLowerCase()
      ) {
        return false;
      }

      // Transmission filter
      if (
        activeFilters.transmission &&
        ad.transmission?.toLowerCase() !== activeFilters.transmission.toLowerCase()
      ) {
        return false;
      }

      return true;
    });
  }, [allAds, activeFilters]);

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
  };

  // Format price for display
  const formatPrice = (price: number | null) => {
    if (price === null) return "Price on request";
    return `Rs. ${price.toLocaleString()}`;
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
        className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg hover:bg-teal-50 transition-all duration-200 cursor-pointer"
        onClick={() => window.location.href = `/organizations/${org.id}`}
      >
        <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center overflow-hidden">
          {org.logo ? (
            <img
              src={org.logo}
              alt={org.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-teal-700 font-semibold">
              {org.name?.charAt(0) || 'D'}
            </span>
          )}
        </div>
        <div>
          <div className="font-medium text-slate-800">
            {org.name || "Unnamed Dealer"}
          </div>
          <div className="text-sm text-slate-500">
            {(org as any).verified ? "Verified Dealer" : "Dealer"} • {(org as any)._count?.ads || 0} listing{(org as any)._count?.ads !== 1 ? "s" : ""}
          </div>
        </div>
      </div>
    );

    // Loading state
    if (isLoading) {
      return (
        <Card className="p-5 bg-white rounded-xl border border-slate-100">
          <h3 className="font-semibold mb-4 text-slate-800">Featured Dealers</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg animate-pulse">
                <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
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
        <Card className="p-5 bg-white rounded-xl border border-slate-100">
          <h3 className="font-semibold mb-4 text-slate-800">Featured Dealers</h3>
          <div className="p-3 text-center text-slate-500">
            No dealers available at the moment
          </div>
        </Card>
      );
    }

    // Success state with real data
    return (
      <>
        <Card className="p-5 bg-white rounded-xl border border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-slate-800">Featured Dealers</h3>
            <Button
              variant="ghost"
              size="sm"
              className="text-teal-700 hover:text-teal-800 hover:bg-teal-50 text-sm"
              onClick={() => setShowAllDealers(true)}
            >
              View All
            </Button>
          </div>

          <div className="space-y-3">
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
      <section className="relative py-12 md:py-20 bg-gradient-to-r from-teal-900 via-teal-800 to-teal-700 overflow-hidden">
        {/* Abstract shapes for visual interest */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <div className="absolute -right-40 -top-40 w-80 h-80 bg-teal-400 rounded-full"></div>
          <div className="absolute -left-20 bottom-10 w-60 h-60 bg-teal-300 rounded-full"></div>
        </div>

        <div className="relative container mx-auto px-4">
          <div className="text-center mb-8 md:mb-10">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 md:mb-5 font-heading">
              Find Your Perfect Vehicle
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-teal-100 max-w-2xl mx-auto">
              {`Sri Lanka's largest automobile marketplace`}
            </p>
          </div>

          {/* Search Form - Simplified and minimal */}
          <div className="max-w-4xl mx-auto">
            {/* Simple search bar with filter button */}
            <div className="flex gap-3 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Search by make, model, or city..."
                  className="w-full h-14 pl-12 pr-14 rounded-xl border-slate-200 bg-white shadow-md text-base"
                  value={filters.model || ""}
                  onChange={(e) => {
                    const value = e.target.value || null;
                    handleFilterChange("model", value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      applyFilters();
                    }
                  }}
                />
                {/* Show clear button when there's text */}
                {filters.model && (
                  <button
                    onClick={() => {
                      handleFilterChange("model", null);
                      // Clear active filter and apply immediately
                      setActiveFilters(prev => ({ ...prev, model: null }));
                    }}
                    className="absolute right-14 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
                <Button
                  onClick={applyFilters}
                  disabled={isLoading}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-11 w-11 p-0 bg-teal-700 hover:bg-teal-600 rounded-lg"
                >
                  <Search className="w-5 h-5 text-white" />
                </Button>
              </div>

              <Sheet open={showFilterSheet} onOpenChange={setShowFilterSheet}>
                <SheetTrigger asChild>
                  <button
                    className="inline-flex items-center justify-center h-14 px-5 rounded-xl border border-slate-200 bg-white shadow-md hover:bg-slate-100 hover:border-slate-300 active:scale-95 transition-all duration-150 gap-2 cursor-pointer"
                    aria-label="Open filters"
                  >
                    <Filter className="w-5 h-5" aria-hidden="true" />
                    <span className="hidden sm:inline text-sm font-medium">Filters</span>
                    {hasActiveFilters && (
                      <span
                        className="ml-2 bg-teal-700 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                      >
                        {Object.values(activeFilters).filter(v => v !== null).length}
                      </span>
                    )}
                  </button>
                </SheetTrigger>
                <SheetContent
                  side="bottom"
                  className="h-auto max-h-[90vh] rounded-t-3xl p-0 sm:max-h-[95vh] sm:rounded-2xl sm:mb-4 left-1/2 -translate-x-1/2"
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

                  <div className="px-4 pb-24 space-y-2 overflow-y-auto max-h-[calc(85vh-120px)] sm:max-h-[calc(90vh-120px)]">
                    {/* Vehicle Type, Make & Condition */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs font-medium text-slate-600 mb-1 block">Vehicle Type</label>
                        <Select
                          value={filters.vehicleType || "any"}
                          onValueChange={(value) => handleFilterChange("vehicleType", value)}
                        >
                          <SelectTrigger className="w-full h-9 bg-white text-xs">
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
                          <SelectTrigger className="w-full h-9 bg-white text-xs">
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

                      <div>
                        <label className="text-xs font-medium text-slate-600 mb-1 block">Condition</label>
                        <Select
                          value={filters.condition || "any"}
                          onValueChange={(value) => handleFilterChange("condition", value)}
                        >
                          <SelectTrigger className="w-full h-9 bg-white text-xs">
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
                    </div>

                    {/* District, City & Fuel Type */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs font-medium text-slate-600 mb-1 block">District</label>
                        <Select
                          value={filters.district || "any"}
                          onValueChange={(value) => handleFilterChange("district", value)}
                        >
                          <SelectTrigger className="w-full h-9 bg-white text-xs">
                            <SelectValue placeholder="Any" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px]">
                            <SelectItem value="any">Any</SelectItem>
                            {sriLankanDistricts.map((district) => (
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
                          <SelectTrigger className="w-full h-9 bg-white text-xs">
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
                              .filter((c) =>
                                cityQuery.trim()
                                  ? c.toLowerCase().includes(cityQuery.toLowerCase())
                                  : true
                              )
                              .map((city) => (
                                <SelectItem key={city} value={city.toLowerCase()}>
                                  {city}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-600 mb-1 block">Fuel Type</label>
                        <Select
                          value={filters.fuelType || "any"}
                          onValueChange={(value) => handleFilterChange("fuelType", value)}
                        >
                          <SelectTrigger className="w-full h-9 bg-white text-xs">
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

                    {/* Price Range */}
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-2 block">
                        Price Range (Rs.)
                      </label>
                      <div className="space-y-3">
                        {/* Display current range */}
                        <div className="flex items-center justify-between text-xs text-slate-600">
                          <span>{filters.minPrice ? `Rs. ${parseInt(filters.minPrice).toLocaleString()}` : 'Rs. 0'}</span>
                          <span className="text-slate-400">to</span>
                          <span>{filters.maxPrice ? `Rs. ${parseInt(filters.maxPrice).toLocaleString()}` : 'Rs. 50M+'}</span>
                        </div>

                        {/* Slider */}
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

                        {/* Quick select buttons */}
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

                    {/* Min Year, Max Year & Transmission */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs font-medium text-slate-600 mb-1 block">Min Year</label>
                        <Select
                          value={filters.minYear || "any"}
                          onValueChange={(value) => handleFilterChange("minYear", value)}
                        >
                          <SelectTrigger className="w-full h-9 bg-white text-xs">
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
                          <SelectTrigger className="w-full h-9 bg-white text-xs">
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

                      <div>
                        <label className="text-xs font-medium text-slate-600 mb-1 block">Transmission</label>
                        <Select
                          value={filters.transmission || "any"}
                          onValueChange={(value) => handleFilterChange("transmission", value)}
                        >
                          <SelectTrigger className="w-full h-9 bg-white text-xs">
                            <SelectValue placeholder="Any" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Any</SelectItem>
                            <SelectItem value="Automatic">Auto</SelectItem>
                            <SelectItem value="Manual">Manual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Bottom action button - Fixed */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-white border-t shadow-lg">
                    <Button
                      className="w-full h-10 bg-teal-700 hover:bg-teal-600 text-white font-medium rounded-lg text-sm"
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
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="bg-slate-50 py-8 md:py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Vehicle Listings */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-3 md:mb-0">
                  Latest Vehicles
                </h2>
                <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
                  <span className="text-slate-600 text-sm">
                    {data?.pagination
                      ? `Showing 1-${data.ads.length} of ${data.pagination.total} results`
                      : "Loading results..."}
                  </span>
                  <Select>
                    <SelectTrigger className="w-full md:w-44 h-10 rounded-lg bg-white border-slate-200">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
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
              {filteredAds.length > 0 && !isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredAds.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer group relative"
                      onClick={() => (window.location.href = `/${vehicle.id}`)}
                    >
                      {/* Favorite Button */}
                      <div className="absolute top-2 right-2 z-10">
                        <FavoriteButton adId={vehicle.id} />
                      </div>

                      <div className="p-3">
                        {/* Vehicle Title - Centered */}
                        <h3 className="font-semibold text-sm text-slate-800 text-center mb-2 transition-colors group-hover:text-teal-700 line-clamp-1">
                          {[vehicle.brand, vehicle.model, vehicle.manufacturedYear, vehicleTypeLabels[vehicle.type] || vehicle.type]
                            .filter(Boolean)
                            .join(' ')}
                        </h3>

                        <div className="flex">
                          {/* Vehicle Image */}
                          <div className="w-32 h-20 flex-shrink-0">
                            {vehicle?.media && vehicle.media.length > 0 && vehicle.media[0]?.media?.url ? (
                              <img
                                src={vehicle.media[0].media.url}
                                alt={vehicle.title}
                                className="w-full h-full object-cover rounded-md group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <img
                                src="/placeholder-image.jpg"
                                alt={vehicle.title}
                                className="w-full h-full object-cover rounded-md group-hover:scale-105 transition-transform duration-300"
                              />
                            )}
                          </div>

                          {/* Vehicle Details */}
                          <div className="flex-1 pl-3 flex flex-col justify-between">
                            <div>
                              <div className="text-xs text-slate-600 mb-1 line-clamp-1">
                                {vehicle.location || ""}
                              </div>

                              <div className="text-sm font-semibold text-teal-700 mb-1">
                                {formatPrice(vehicle.price)}
                              </div>

                              <div className="text-xs text-slate-500">
                                {vehicleTypeLabels[vehicle.type] || vehicle.type}
                              </div>
                            </div>

                            <div className="text-xs text-slate-400 mt-1">
                              {format(new Date(vehicle.createdAt), "MMM d, yyyy")}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Load More */}
              {filteredAds.length > 0 && (
                <div className="text-center mt-8">
                  {data?.pagination && currentPage < data.pagination.totalPages ? (
                    <Button
                      size="lg"
                      variant="outline"
                      className="px-8 py-5 border-teal-700 text-teal-700 hover:bg-teal-700 hover:text-white transition-all duration-300"
                      onClick={handleLoadMore}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        "Load More Vehicles"
                      )}
                    </Button>
                  ) : (
                    <p className="text-slate-500 text-sm">No more vehicles to load</p>
                  )}
                </div>
              )}
            </div>

            {/* Right Sidebar - Ad Space */}
            <div className="w-full lg:w-80 space-y-6 mt-6 lg:mt-0">
              {/* Google Ad Space 1 */}
              <Card className="p-4 bg-white border border-slate-100 rounded-xl overflow-hidden">
                <div className="text-center text-slate-500">

                  <div className="bg-slate-100 h-64 flex items-center justify-center rounded-lg overflow-hidden">
                    <img
                      src="/assets/Sidebar 01 new.jpg"
                      alt="Advertisement"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </Card>

              {/* Featured Dealers */}
              <FeaturedDealers />

              {/* Google Ad Space 2 */}
              <Card className="p-4 bg-white border border-slate-100 rounded-xl overflow-hidden">
                <div className="text-center text-slate-500">

                  <div className="bg-slate-100 h-48 flex items-center justify-center rounded-lg overflow-hidden">
                    <img
                      src="/assets/Sidebar 02.jpg"
                      alt="Advertisement"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Banner Ad Space */}
      <div className="bg-white py-6">
        <div className="max-w-6xl mx-auto px-4">
          <Card className="p-4 bg-white border border-slate-100 rounded-xl overflow-hidden">
            <div className="text-center text-slate-500">
              <div className="text-sm mb-2 font-medium">Advertisement</div>
              <div className="bg-slate-100 h-24 flex items-center justify-center rounded-lg overflow-hidden">
                <img
                  src="/assets/Bottom Banner.jpg"
                  alt="Advertisement"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}