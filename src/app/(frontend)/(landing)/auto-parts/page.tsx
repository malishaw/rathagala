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
  Wrench,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useGetAds } from "@/features/ads/api/use-get-ads";
import { FavoriteButton } from "@/features/saved-ads/components/favorite-button";
import { useGetAutoPartCategories } from "@/features/ads/api/use-get-auto-part-categories";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";

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
  const { data: session } = authClient.useSession();
  const user = session?.user;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>("all");
  const [selectedCondition, setSelectedCondition] = useState<string>("all");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [visibleCount, setVisibleCount] = useState(20);
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

  const visibleAds = filteredAds.slice(0, visibleCount);

  const handleLoadMore = () => setVisibleCount((prev) => prev + 20);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedVehicleType("all");
    setSelectedCondition("all");
    setSelectedDistrict("all");
    setMinPrice("");
    setMaxPrice("");
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Banner */}
      <div className="bg-[#024950] text-white py-8 px-4">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <Wrench className="h-7 w-7 text-teal-300" />
            <h1 className="text-2xl md:text-3xl font-bold">Auto Parts &amp; Accessories</h1>
          </div>
          <p className="text-teal-200 text-sm">
            {isLoading ? "Loading..." : `${filteredAds.length} parts found`}
            {activeFilterCount > 0 && ` · ${activeFilterCount} filter${activeFilterCount > 1 ? "s" : ""} applied`}
          </p>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── Left Sidebar ─────────────────────── */}
          <div className="w-full lg:w-72 flex-shrink-0">
            <Card className="p-4 shadow-sm border-slate-200">
              {/* Header – collapsible on mobile */}
              <div
                className="flex items-center justify-between mb-4 cursor-pointer lg:cursor-default"
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              >
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Filter className="h-5 w-5 text-teal-600" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge className="bg-teal-700 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {activeFilterCount}
                    </Badge>
                  )}
                </h2>
                <div className="flex items-center gap-2">
                  {activeFilterCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); clearFilters(); }}
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

              <div className={`${isFiltersOpen ? "block" : "hidden"} lg:block space-y-4`}>
                {/* Search */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                    <Search className="h-3.5 w-3.5 inline mr-1" />
                    Search
                  </label>
                  <div className="relative">
                    <Input
                      placeholder="Part name, brand, model..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-10 text-sm border-slate-200 pr-8"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Category
                  </label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
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

                {/* Compatible Vehicle */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Compatible Vehicle
                  </label>
                  <Select value={selectedVehicleType} onValueChange={setSelectedVehicleType}>
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

                <Separator />

                {/* Condition */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Condition
                  </label>
                  <Select value={selectedCondition} onValueChange={setSelectedCondition}>
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

                <Separator />

                {/* Price Range */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Price Range (Rs.)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="h-9 text-sm border-slate-200"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="h-9 text-sm border-slate-200"
                    />
                  </div>
                </div>

                {/* District */}
                {districts.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                        District
                      </label>
                      <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
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

                {activeFilterCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="w-full text-sm text-slate-600"
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Clear all filters
                  </Button>
                )}
              </div>
            </Card>
          </div>

          {/* ── Right Content ─────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-600">
                {isLoading
                  ? "Loading..."
                  : `${filteredAds.length} part${filteredAds.length !== 1 ? "s" : ""} found`}
              </p>
              <Link href="/sell/new">
                <Button className="bg-teal-700 hover:bg-teal-800 h-9 text-sm">
                  Post Free Ad <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Results */}
            {isLoading ? (
              <div className="flex justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
              </div>
            ) : error ? (
              <div className="text-center py-24 text-red-500">Failed to load parts. Please try again.</div>
            ) : filteredAds.length === 0 ? (
              <div className="text-center py-24">
                <Package className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">No parts found</h3>
                <p className="text-slate-500 mb-4">Try adjusting your filters or search query</p>
                <Button variant="outline" onClick={clearFilters}>
                  Clear all filters
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {visibleAds.map((ad) => {
                    const adExt = ad as typeof ad & {
                      partCategoryId?: string;
                      compatibleVehicleType?: string;
                      partName?: string;
                      media?: Array<{ media?: { url?: string } }>;
                    };
                    const mainImage = adExt.media?.[0]?.media?.url;
                    const categoryName = adExt.partCategoryId
                      ? getCategoryName(adExt.partCategoryId)
                      : null;
                    const compatVehicle = adExt.compatibleVehicleType
                      ? vehicleTypeLabels[adExt.compatibleVehicleType] || adExt.compatibleVehicleType
                      : null;

                    // Build display title: Part Name for Brand Model VehicleType
                    const partName = adExt.partName || ad.title || "Auto Part";
                    const forParts = [ad.brand, ad.model, compatVehicle].filter(Boolean).join(" ");
                    const displayTitle = forParts ? `${partName} for ${forParts}` : partName;

                    return (
                      <Link key={ad.id} href={`/${ad.id}`} className="block group">
                        <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200 h-full flex flex-col">
                          {/* Image */}
                          <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden flex-shrink-0">
                            {mainImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={mainImage}
                                alt={displayTitle}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <Package className="h-12 w-12" />
                              </div>
                            )}
                            {/* Condition badge */}
                            {ad.condition && (
                              <div className="absolute top-2 left-2">
                                <Badge
                                  variant="secondary"
                                  className={`text-xs font-medium ${
                                    ad.condition === "New"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {ad.condition === "New" ? "Brand New" : "Used"}
                                </Badge>
                              </div>
                            )}
                            {/* Favourite button */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {user && <FavoriteButton adId={ad.id} />}
                            </div>
                            {/* Featured */}
                            {ad.featured && (
                              <div className="absolute bottom-2 left-2">
                                <Badge className="bg-yellow-500 text-white text-xs">Featured</Badge>
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="p-3 flex flex-col flex-1 gap-1.5">
                            {/* Category */}
                            {categoryName && (
                              <div className="flex items-center gap-1 text-xs text-teal-700 font-medium">
                                <Tag className="h-3 w-3" />
                                {categoryName}
                              </div>
                            )}

                            {/* Title */}
                            <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 leading-tight group-hover:text-teal-700 transition-colors">
                              {displayTitle}
                            </h3>

                            {/* Compatible vehicle */}
                            {compatVehicle && (
                              <p className="text-xs text-slate-500">
                                Fits:{" "}
                                <span className="font-medium text-slate-600">
                                  {compatVehicle}
                                </span>
                              </p>
                            )}

                            <div className="flex-1" />

                            {/* Price & Location */}
                            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                              <span className="text-base font-bold text-teal-700">
                                {ad.price ? `Rs. ${ad.price.toLocaleString()}` : "Price on request"}
                              </span>
                              {(ad.city || ad.district) && (
                                <div className="flex items-center gap-1 text-xs text-slate-400">
                                  <MapPin className="h-3 w-3" />
                                  <span className="truncate max-w-[90px]">
                                    {ad.city || ad.district}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      </Link>
                    );
                  })}
                </div>

                {/* Load More */}
                {visibleCount < filteredAds.length && (
                  <div className="text-center mt-8">
                    <Button variant="outline" onClick={handleLoadMore} className="px-8">
                      Load More ({filteredAds.length - visibleCount} remaining)
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}




