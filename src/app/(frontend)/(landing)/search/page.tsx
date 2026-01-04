"use client"

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Calendar, Fuel, Settings, Eye, Heart, Share2, Phone, MessageCircle, Filter, Search, Car, User, Home, Briefcase, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useGetAds } from "@/features/ads/api/use-get-ads";

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

// Vehicle makes
const vehicleMakes = [
  "Toyota", "Honda", "Nissan", "BMW", "Mercedes-Benz", "Audi", "Hyundai", "Kia",
  "Volkswagen", "Ford", "Chevrolet", "Mazda", "Subaru", "Mitsubishi", "Suzuki",
  "Isuzu", "Bajaj", "Hero", "Yamaha", "Kawasaki", "KTM", "TVS", "Other"
];

// Sri Lankan provinces, districts, and cities data (Copied from sell page for consistency)
const locationData = {
  "Western": {
    "Colombo": ["Colombo", "Dehiwala-Mount Lavinia", "Moratuwa", "Sri Jayawardenepura Kotte", "Maharagama", "Kesbewa", "Kaduwela", "Kotikawatta", "Kolonnawa", "Nugegoda", "Rajagiriya", "Battaramulla"],
    "Gampaha": ["Gampaha", "Negombo", "Katunayake", "Minuwangoda", "Wattala", "Kelaniya", "Peliyagoda", "Ja-Ela", "Kandana", "Divulapitiya"],
    "Kalutara": ["Kalutara", "Panadura", "Horana", "Beruwala", "Aluthgama", "Matugama", "Bandaragama", "Ingiriya"]
  },
  "Central": {
    "Kandy": ["Kandy", "Gampola", "Nawalapitiya", "Wattegama", "Harispattuwa", "Pathadumbara", "Akurana", "Delthota"],
    "Matale": ["Matale", "Dambulla", "Sigiriya", "Galewela", "Ukuwela", "Rattota"],
    "Nuwara Eliya": ["Nuwara Eliya", "Hatton", "Talawakelle", "Ginigathena", "Kotagala", "Maskeliya", "Bogawantalawa"]
  },
  "Southern": {
    "Galle": ["Galle", "Hikkaduwa", "Ambalangoda", "Elpitiya", "Bentota", "Baddegama", "Yakkalamulla"],
    "Matara": ["Matara", "Weligama", "Mirissa", "Dikwella", "Hakmana", "Akuressa", "Denipitiya"],
    "Hambantota": ["Hambantota", "Tangalle", "Tissamaharama", "Ambalantota", "Beliatta", "Weeraketiya"]
  },
  "Northern": {
    "Jaffna": ["Jaffna", "Nallur", "Chavakachcheri", "Point Pedro", "Karainagar", "Velanai"],
    "Kilinochchi": ["Kilinochchi", "Pallai", "Paranthan"],
    "Mannar": ["Mannar", "Nanattan", "Murunkan"],
    "Vavuniya": ["Vavuniya", "Nedunkeni", "Settikulam"],
    "Mullaitivu": ["Mullaitivu", "Oddusuddan", "Puthukudiyiruppu"]
  },
  "Eastern": {
    "Trincomalee": ["Trincomalee", "Kinniya", "Mutur", "Kuchchaveli"],
    "Batticaloa": ["Batticaloa", "Kaluwanchikudy", "Valachchenai", "Eravur"],
    "Ampara": ["Ampara", "Akkaraipattu", "Kalmunai", "Sainthamaruthu", "Pottuvil"]
  },
  "North Western": {
    "Kurunegala": ["Kurunegala", "Kuliyapitiya", "Narammala", "Wariyapola", "Pannala", "Melsiripura"],
    "Puttalam": ["Puttalam", "Chilaw", "Nattandiya", "Wennappuwa", "Marawila", "Dankotuwa"]
  },
  "North Central": {
    "Anuradhapura": ["Anuradhapura", "Kekirawa", "Thambuttegama", "Eppawala", "Medawachchiya"],
    "Polonnaruwa": ["Polonnaruwa", "Kaduruwela", "Medirigiriya", "Hingurakgoda"]
  },
  "Uva": {
    "Badulla": ["Badulla", "Bandarawela", "Haputale", "Welimada", "Mahiyanganaya", "Passara"],
    "Monaragala": ["Monaragala", "Bibile", "Wellawaya", "Kataragama", "Buttala"]
  },
  "Sabaragamuwa": {
    "Ratnapura": ["Ratnapura", "Embilipitiya", "Balangoda", "Pelmadulla", "Eheliyagoda", "Kuruwita"],
    "Kegalle": ["Kegalle", "Mawanella", "Warakapola", "Rambukkana", "Galigamuwa", "Yatiyantota"]
  }
};

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

// Sri Lankan locations
const sriLankanLocations = [
  "Colombo", "Kandy", "Galle", "Jaffna", "Negombo", "Batticaloa", "Trincomalee",
  "Anuradhapura", "Ratnapura", "Kotte", "Moratuwa", "Nuwara Eliya", "Gampaha",
  "Matara", "Kurunegala", "Badulla", "Hambantota", "Kalmunai", "Vavuniya"
];

// Search filter interface
interface SearchFilters {
  query: string;
  listingType: string;
  vehicleType: string;
  brand: string;
  model: string;
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
  page: number;
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize filters from URL params
  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams.get('q') || '',
    listingType: searchParams.get('listingType') || 'all',
    vehicleType: searchParams.get('type') || 'all',
    brand: searchParams.get('brand') || 'all',
    model: searchParams.get('model') || '',
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
    page: parseInt(searchParams.get('page') || '1')
  });

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

  // Fetch ads with current filters
  const { data, isLoading, error } = useGetAds({
    page: filters.page,
    limit: 20,
    search: filters.query,
    listingType: filters.listingType,
    // Add other filter parameters as supported by your API
  });

  // Filter results based on local filters (client-side filtering for now)
  const filteredAds = useMemo(() => {
    if (!data?.ads) return [];

    return data.ads.filter((ad) => {
      // Note: Listing type filter is now handled on the backend

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
        // This assumes ad object has 'city' but maybe we need district map? 
        // For now let's rely on city mapping if ad only has city, or if ad has district use it.
        // Simple check: if ad.district exists check it.
        if ((ad as any).district && (ad as any).district.toLowerCase() !== filters.district.toLowerCase()) {
          return false;
        } else if (!(ad as any).district && ad.city) {
          // Reverse lookup city to district if needed, or skip strict district check if data missing
          // BUT user wants strict filtering. Let's try to match city to district using locationData
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

      return true;
    });
  }, [data?.ads, filters.vehicleType, filters.brand, filters.model, filters.condition, filters.minPrice, filters.maxPrice, filters.minYear, filters.maxYear, filters.fuelType, filters.transmission, filters.district, filters.city]);

  // Handle filter changes
  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value, page: 1 };

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
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      query: '',
      listingType: 'all',
      vehicleType: 'all',
      brand: 'all',
      model: '',
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
      page: 1
    });
  };

  // Count active filters
  const activeFilterCount = Object.entries(filters).filter(([key, value]) =>
    key !== 'page' && value && value.toString().trim() !== '' &&
    value !== 'all' && value !== 'any'
  ).length;

  // Format price
  const formatPrice = (price: number | null) => {
    if (!price) return "Price on request";
    return `Rs. ${price.toLocaleString()}`;
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

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar - Search Filters */}
          <div className="w-full lg:w-80 space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </h2>
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-slate-600 hover:text-slate-900"
                  >
                    Clear All
                  </Button>
                )}
              </div>

              <div className="space-y-6">
                {/* Search Query */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      placeholder="Search vehicles..."
                      value={filters.query}
                      onChange={(e) => handleFilterChange('query', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Listing Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Listing Type
                  </label>
                  <Select
                    value={filters.listingType}
                    onValueChange={(value) => handleFilterChange('listingType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="SELL">For Sale</SelectItem>
                      <SelectItem value="WANT">Want to Buy</SelectItem>
                      <SelectItem value="RENT">For Rent</SelectItem>
                      <SelectItem value="HIRE">For Hire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Vehicle Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Vehicle Type
                  </label>
                  <Select
                    value={filters.vehicleType}
                    onValueChange={(value) => handleFilterChange('vehicleType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All vehicles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All vehicles</SelectItem>
                      {Object.entries(vehicleTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Brand */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Brand
                  </label>
                  <Select
                    value={filters.brand}
                    onValueChange={(value) => handleFilterChange('brand', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All brands" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All brands</SelectItem>
                      {vehicleMakes.map((make) => (
                        <SelectItem key={make} value={make}>{make}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Model */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Model
                  </label>
                  <Input
                    placeholder="Enter model"
                    value={filters.model}
                    onChange={(e) => handleFilterChange('model', e.target.value)}
                  />
                </div>

                {/* Condition */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Condition
                  </label>
                  <Select
                    value={filters.condition}
                    onValueChange={(value) => handleFilterChange('condition', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All conditions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All conditions</SelectItem>
                      <SelectItem value="New">Brand New</SelectItem>
                      <SelectItem value="Reconditioned">Reconditioned</SelectItem>
                      <SelectItem value="Used">Used</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Price Range (Rs.)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Min"
                      type="number"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                      className={isPriceRangeInvalid ? "border-red-500 focus-visible:ring-red-500" : ""}
                    />
                    <Input
                      placeholder="Max"
                      type="number"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                      className={isPriceRangeInvalid ? "border-red-500 focus-visible:ring-red-500" : ""}
                    />
                  </div>
                  {isPriceRangeInvalid && (
                    <p className="text-xs text-red-500 mt-1">Min price cannot be greater than Max price</p>
                  )}
                </div>

                {/* Year Range */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Year Range
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={filters.minYear}
                      onValueChange={(value) => handleFilterChange('minYear', value)}
                    >
                      <SelectTrigger>
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
                      <SelectTrigger>
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

                {/* Fuel Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Fuel Type
                  </label>
                  <Select
                    value={filters.fuelType}
                    onValueChange={(value) => handleFilterChange('fuelType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All fuel types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All fuel types</SelectItem>
                      <SelectItem value="PETROL">Petrol</SelectItem>
                      <SelectItem value="DIESEL">Diesel</SelectItem>
                      <SelectItem value="HYBRID">Hybrid</SelectItem>
                      <SelectItem value="ELECTRIC">Electric</SelectItem>
                      <SelectItem value="GAS">Gas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Transmission */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Transmission
                  </label>
                  <Select
                    value={filters.transmission}
                    onValueChange={(value) => handleFilterChange('transmission', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All transmissions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All transmissions</SelectItem>
                      <SelectItem value="MANUAL">Manual</SelectItem>
                      <SelectItem value="AUTOMATIC">Automatic</SelectItem>
                      <SelectItem value="CVT">CVT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* District */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    District
                  </label>
                  <Select
                    value={filters.district}
                    onValueChange={(value) => handleFilterChange('district', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All districts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All districts</SelectItem>
                      {sriLankanDistricts.map((district) => (
                        <SelectItem key={district} value={district}>{district}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* City (Dependent) */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    City
                  </label>
                  <Select
                    value={filters.city}
                    onValueChange={(value) => handleFilterChange('city', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All cities" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      <SelectItem value="all">All cities</SelectItem>
                      {availableCities.map((city) => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Side - Search Results */}
          <div className="flex-1">
            {/* Active Filters Display */}
            {activeFilterCount > 0 && (
              <Card className="p-4 mb-6">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-slate-700">Active filters:</span>
                  {filters.listingType && filters.listingType !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      {listingTypeLabels[filters.listingType]}
                      <button onClick={() => handleFilterChange('listingType', 'all')} className="ml-1 hover:text-slate-900">×</button>
                    </Badge>
                  )}
                  {filters.vehicleType && filters.vehicleType !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      {vehicleTypeLabels[filters.vehicleType]}
                      <button onClick={() => handleFilterChange('vehicleType', 'all')} className="ml-1 hover:text-slate-900">×</button>
                    </Badge>
                  )}
                  {filters.brand && filters.brand !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      {filters.brand}
                      <button onClick={() => handleFilterChange('brand', 'all')} className="ml-1 hover:text-slate-900">×</button>
                    </Badge>
                  )}
                  {filters.condition && filters.condition !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      {filters.condition}
                      <button onClick={() => handleFilterChange('condition', 'all')} className="ml-1 hover:text-slate-900">×</button>
                    </Badge>
                  )}
                  {(filters.minPrice || filters.maxPrice) && (
                    <Badge variant="secondary" className="gap-1">
                      Rs. {filters.minPrice || '0'} - {filters.maxPrice || '∞'}
                      <button onClick={() => {
                        handleFilterChange('minPrice', '');
                        handleFilterChange('maxPrice', '');
                      }} className="ml-1 hover:text-slate-900">×</button>
                    </Badge>
                  )}
                  {(filters.minYear || filters.maxYear) && (
                    <Badge variant="secondary" className="gap-1">
                      Year: {filters.minYear || 'Any'} - {filters.maxYear || 'Any'}
                      <button onClick={() => {
                        handleFilterChange('minYear', 'any');
                        handleFilterChange('maxYear', 'any');
                      }} className="ml-1 hover:text-slate-900">×</button>
                    </Badge>
                  )}
                  {filters.district && filters.district !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      {filters.district}
                      <button onClick={() => handleFilterChange('district', 'all')} className="ml-1 hover:text-slate-900">×</button>
                    </Badge>
                  )}
                  {filters.city && filters.city !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      {filters.city}
                      <button onClick={() => handleFilterChange('city', 'all')} className="ml-1 hover:text-slate-900">×</button>
                    </Badge>
                  )}
                  {filters.fuelType && filters.fuelType !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      {filters.fuelType}
                      <button onClick={() => handleFilterChange('fuelType', 'all')} className="ml-1 hover:text-slate-900">×</button>
                    </Badge>
                  )}
                  {filters.transmission && filters.transmission !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      {filters.transmission}
                      <button onClick={() => handleFilterChange('transmission', 'all')} className="ml-1 hover:text-slate-900">×</button>
                    </Badge>
                  )}
                </div>
              </Card>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex justify-center items-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto mb-4" />
                  <p className="text-slate-600">Searching for vehicles...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <Card className="p-8 text-center">
                <div className="text-red-600 mb-4">
                  <Car className="h-12 w-12 mx-auto mb-2" />
                  <p className="text-lg font-medium">Something went wrong</p>
                  <p className="text-sm text-slate-600">Unable to load search results. Please try again.</p>
                </div>
              </Card>
            )}

            {/* No Results */}
            {!isLoading && !error && filteredAds.length === 0 && (
              <Card className="p-8 text-center">
                <div className="text-slate-600 mb-4">
                  <Search className="h-12 w-12 mx-auto mb-2" />
                  <p className="text-lg font-medium">No vehicles found</p>
                  <p className="text-sm">Try adjusting your search filters to find more results.</p>
                </div>
                <Button onClick={clearFilters} variant="outline" className="mt-4">
                  Clear all filters
                </Button>
              </Card>
            )}

            {/* Search Results */}
            {!isLoading && !error && filteredAds.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredAds.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer group"
                    onClick={() => router.push(`/${vehicle.id}`)}
                  >
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
                          <img
                            src="/placeholder-image.jpg"
                            alt={vehicle.title || 'Vehicle'}
                            className="w-full h-full object-cover rounded-md group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>

                        {/* Vehicle Details */}
                        <div className="flex-1 pl-3 flex flex-col justify-between">
                          <div>
                            <div className="text-xs text-slate-600 mb-1 line-clamp-1">
                              {vehicle.city || ""}
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

                {/* Pagination could go here */}
                {filteredAds.length >= 20 && (
                  <div className="flex justify-center pt-6 col-span-full">
                    <Button variant="outline">
                      Load More Results
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
