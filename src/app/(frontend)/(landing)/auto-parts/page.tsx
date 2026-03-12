"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { buildAdUrl } from "@/lib/ad-url";
import {
  Loader2,
  Search,
  X,
  Tag,
  MapPin,
  ChevronRight,
  Package,
  Filter,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Car,
  Sparkles,
  Eye,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useGetAds } from "@/features/ads/api/use-get-ads";
import { FavoriteButton } from "@/features/saved-ads/components/favorite-button";
import { useGetAutoPartCategories } from "@/features/ads/api/use-get-auto-part-categories";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getRelativeTime } from "@/lib/utils";

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
  BOAT: "Boat",
};

export default function AutoPartsPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const user = session?.user;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>("all");
  const [selectedCondition, setSelectedCondition] = useState<string>("all");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);

  const { data: categories = [] } = useGetAutoPartCategories(true);

  const { data, isLoading, error } = useGetAds({
    page: 1,
    limit: 5000,
  });

  const districts = useMemo(() => {
    const adsAll = data?.ads ?? [];
    const set = new Set<string>();
    adsAll.forEach((ad) => {
      if (ad.type === "AUTO_PARTS" && ad.district) set.add(ad.district);
    });
    return Array.from(set).sort();
  }, [data]);

  const filteredAds = useMemo(() => {
    const adsAll = data?.ads ?? [];
    const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const min = minPrice ? parseInt(minPrice) : null;
    const max = maxPrice ? parseInt(maxPrice) : null;

    return adsAll.filter((ad) => {
      if (ad.status !== "ACTIVE" || !ad.published) return false;
      if (ad.type !== "AUTO_PARTS") return false;

      const adExt = ad as typeof ad & {
        partCategoryId?: string;
        compatibleVehicleType?: string;
        partName?: string;
      };

      if (selectedCategory !== "all" && adExt.partCategoryId !== selectedCategory) return false;
      if (selectedVehicleType !== "all" && adExt.compatibleVehicleType !== selectedVehicleType) return false;
      if (selectedCondition !== "all" && ad.condition !== selectedCondition) return false;
      if (selectedDistrict !== "all" && ad.district !== selectedDistrict) return false;
      if (min !== null && ad.price !== null && ad.price !== undefined && ad.price < min) return false;
      if (max !== null && ad.price !== null && ad.price !== undefined && ad.price > max) return false;

      if (searchTerms.length > 0) {
        const searchText = [
          ad.title,
          ad.description,
          ad.brand,
          ad.model,
          adExt.partName,
          ad.city,
          ad.district,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!searchTerms.every((term) => searchText.includes(term))) return false;
      }

      return true;
    });
  }, [data, searchQuery, selectedCategory, selectedVehicleType, selectedCondition, selectedDistrict, minPrice, maxPrice]);

  const handleFilterChange = (key: string, value: any) => {
    if (key === "searchQuery") setSearchQuery(value);
    else if (key === "selectedCategory") setSelectedCategory(value);
    else if (key === "selectedVehicleType") setSelectedVehicleType(value);
    else if (key === "selectedCondition") setSelectedCondition(value);
    else if (key === "selectedDistrict") setSelectedDistrict(value);
    else if (key === "minPrice") setMinPrice(value);
    else if (key === "maxPrice") setMaxPrice(value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedVehicleType("all");
    setSelectedCondition("all");
    setSelectedDistrict("all");
    setMinPrice("");
    setMaxPrice("");
    setCurrentPage(1);
  };

  const activeFilterCount = [
    searchQuery,
    selectedCategory !== "all" ? selectedCategory : null,
    selectedVehicleType !== "all" ? selectedVehicleType : null,
    selectedCondition !== "all" ? selectedCondition : null,
    selectedDistrict !== "all" ? selectedDistrict : null,
    minPrice,
    maxPrice,
  ].filter(Boolean).length;

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name ?? "—";
  };

  // Pagination logic
  const limit = 20;
  const totalPages = Math.ceil(filteredAds.length / limit);
  const paginationPage = Math.max(1, Math.min(currentPage, Math.max(1, totalPages)));

  const paginatedAds = useMemo(() => {
    const startIndex = (paginationPage - 1) * limit;
    return filteredAds.slice(startIndex, startIndex + limit);
  }, [filteredAds, paginationPage, limit]);

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
              <h1 className="text-2xl font-bold text-slate-900">Auto Parts & Accessories</h1>
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
                {/* Search */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                    <Search className="h-4 w-4 inline mr-1" />
                    Search
                  </label>
                  <div className="relative">
                    <Input
                      placeholder="Part name, brand, model..."
                      value={searchQuery}
                      onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                      className="h-10 text-sm border-slate-200 pr-8"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => handleFilterChange('searchQuery', '')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <Separator className="my-3" />

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Category
                  </label>
                  <Select value={selectedCategory} onValueChange={(value) => handleFilterChange('selectedCategory', value)}>
                    <SelectTrigger className="h-9 text-sm border-slate-200">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator className="my-3" />

                {/* Compatible Vehicle */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Compatible Vehicle
                  </label>
                  <Select value={selectedVehicleType} onValueChange={(value) => handleFilterChange('selectedVehicleType', value)}>
                    <SelectTrigger className="h-9 text-sm border-slate-200">
                      <SelectValue placeholder="All Vehicles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Vehicles</SelectItem>
                      {Object.entries(vehicleTypeLabels).map(([val, label]) => (
                        <SelectItem key={val} value={val}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator className="my-3" />

                {/* Condition */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Condition
                  </label>
                  <Select value={selectedCondition} onValueChange={(value) => handleFilterChange('selectedCondition', value)}>
                    <SelectTrigger className="h-9 text-sm border-slate-200">
                      <SelectValue placeholder="Any Condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Condition</SelectItem>
                      <SelectItem value="New">Brand New</SelectItem>
                      <SelectItem value="Used">Used</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator className="my-3" />

                {/* Price Range */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Price Range (Rs.)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                      className="h-9 text-sm border-slate-200"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                      className="h-9 text-sm border-slate-200"
                    />
                  </div>
                </div>

                {districts.length > 0 && (
                  <>
                    <Separator className="my-3" />
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                        District
                      </label>
                      <Select value={selectedDistrict} onValueChange={(value) => handleFilterChange('selectedDistrict', value)}>
                        <SelectTrigger className="h-9 text-sm border-slate-200">
                          <SelectValue placeholder="All Districts" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          <SelectItem value="all">All Districts</SelectItem>
                          {districts.map((d) => (
                            <SelectItem key={d} value={d}>
                              {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>

          {/* Center Column - Results */}
          <div className="flex-1 min-w-0">
            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                <span className="ml-3 text-slate-600">Loading auto parts...</span>
              </div>
            )}

            {/* Results Grid */}
            {!isLoading && !error && paginatedAds.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paginatedAds.map((vehicle) => {
                  const adExt = vehicle as typeof vehicle & {
                    partCategoryId?: string;
                    compatibleVehicleType?: string;
                    partName?: string;
                    media?: Array<{ media?: { url?: string } }>;
                  };
                  const mainImage = adExt.media?.[0]?.media?.url;
                  const categoryName = adExt.partCategoryId ? getCategoryName(adExt.partCategoryId) : null;
                  const compatVehicle = adExt.compatibleVehicleType
                    ? vehicleTypeLabels[adExt.compatibleVehicleType] || adExt.compatibleVehicleType
                    : null;

                  const partName = adExt.partName || vehicle.title || "Auto Part";
                  const forParts = [vehicle.brand, vehicle.model, compatVehicle].filter(Boolean).join(" ");
                  const displayTitle = forParts ? `${partName} for ${forParts}` : partName;

                  return (
                    <div
                      key={vehicle.id}
                      className="rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer group relative bg-white"
                      onClick={() => router.push(buildAdUrl(vehicle))}
                    >
                      {/* Favorite Button */}
                      <div className="absolute top-10 right-2 z-10">
                        <FavoriteButton adId={vehicle.id} />
                      </div>

                      <div className="p-3 mt-3">
                        {/* Part Title */}
                        <h3 className="font-semibold text-sm text-slate-800 text-center mb-2 transition-colors group-hover:text-teal-700 line-clamp-1">
                          {displayTitle}
                        </h3>

                        <div className="flex">
                          {/* Image */}
                          <div className="w-32 h-20 flex-shrink-0">
                            {mainImage ? (
                              <img
                                src={mainImage}
                                alt={displayTitle}
                                className="w-full h-full object-cover rounded-md group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-100 rounded-md">
                                <Package className="h-8 w-8 text-slate-300" />
                              </div>
                            )}
                          </div>

                          {/* Details */}
                          <div className="flex-1 pl-3 flex flex-col justify-between">
                            <div>
                              {/* Category */}
                              {categoryName && (
                                <div className="text-xs text-slate-600 mb-1 line-clamp-1">
                                  {categoryName}
                                </div>
                              )}

                              {/* Price */}
                              <div className="text-sm font-semibold text-teal-700 mb-1">
                                {vehicle.price ? `Rs. ${vehicle.price.toLocaleString()}` : "Negotiable"}
                              </div>

                              {/* Compatible Vehicle */}
                              <div className="text-xs text-slate-500">
                                {compatVehicle || "N/A"}
                              </div>
                            </div>

                            {/* Footer - Date and Views */}
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
                <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900">No auto parts found</h3>
                <p className="text-slate-500 mt-1 max-w-xs mx-auto">Try adjusting your filters or clearing them to see more parts.</p>
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
                  disabled={paginationPage === 1}
                  onClick={() => {
                    setCurrentPage(paginationPage - 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-6"
                >
                  Previous
                </Button>
                <div className="text-sm font-medium text-slate-600">
                  Page {paginationPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  disabled={paginationPage === totalPages}
                  onClick={() => {
                    setCurrentPage(paginationPage + 1);
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
                  <p className="text-xs text-teal-100 mb-4 leading-relaxed">Boost your auto parts reach to thousands of potential buyers instantly.</p>
                  <Button onClick={() => user ? router.push('/sell/new') : router.push('/signin?redirect=/sell/new')} className="w-full bg-white text-teal-900 hover:bg-teal-50 font-bold border-none">
                    Post Free Ad Now
                  </Button>
                </div>
                <Package className="absolute -right-4 -bottom-4 h-24 w-24 text-white/10 rotate-12" />
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




