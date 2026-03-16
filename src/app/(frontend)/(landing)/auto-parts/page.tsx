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
import { Separator } from "@/components/ui/separator";
import { buildAdUrl } from "@/lib/ad-url";
import {
  Loader2,
  Search,
  X,
  MapPin,
  Package,
  Filter,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Eye,
  Star,
  Sparkles,
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useGetAds } from "@/features/ads/api/use-get-ads";
import { FavoriteButton } from "@/features/saved-ads/components/favorite-button";
import { useGetAutoPartCategories } from "@/features/ads/api/use-get-auto-part-categories";
import { BoostBadges } from "@/features/boost/components/boost-badges";
import { TopAdCard } from "@/features/ads/components/top-ad-card";
import { FeaturedAdCard } from "@/features/ads/components/featured-ad-card";
import { authClient } from "@/lib/auth-client";
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

const formatPrice = (price: number | null, isNegotiable?: boolean): React.ReactNode => {
  if (!price) return "Negotiable";
  return (
    <>
      Rs. {price.toLocaleString()}
      {isNegotiable && (
        <>
          <br />
          <span className="text-sm font-semibold ">Negotiable</span>
        </>
      )}
    </>
  );
};

const formatAdTitle = (ad: any): string => {
  const partName = (ad as any).partName || ad.title || "Auto Part";
  const compatLabel = vehicleTypeLabels[(ad as any).compatibleVehicleType || ""] || (ad as any).compatibleVehicleType || "";
  const forParts = [ad.brand, ad.model, compatLabel].filter(Boolean).join(" ");
  return forParts ? `${partName} for ${forParts}` : partName;
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
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);

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

      if (urgentOnly && !(ad as any).urgentActive) return false;

      return true;
    });
  }, [data, searchQuery, selectedCategory, selectedVehicleType, selectedCondition, selectedDistrict, minPrice, maxPrice, urgentOnly]);

  // Rotation (1 minute)
  const [rotationIndex, setRotationIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setRotationIndex((i) => i + 1), 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Top ads pool — topAdActive only, no featuredActive, no bumpActive
  const topAdsPool = useMemo(() => {
    return filteredAds.filter(
      (ad) => (ad as any).topAdActive && !(ad as any).featuredActive && !(ad as any).bumpActive
    );
  }, [filteredAds]);

  const shuffledTopAdsPool = useMemo(() => shuffleArray(topAdsPool), [topAdsPool]);

  const displayedTopAds = useMemo(() => {
    if (shuffledTopAdsPool.length === 0) return [];
    return getRotatingSlice(shuffledTopAdsPool, rotationIndex, 2);
  }, [shuffledTopAdsPool, rotationIndex]);

  // Featured ads pool
  const featuredAdsPool = useMemo(() => {
    return filteredAds.filter((ad) => (ad as any).featuredActive);
  }, [filteredAds]);

  const shuffledFeaturedAdsPool = useMemo(() => shuffleArray(featuredAdsPool), [featuredAdsPool]);

  const displayedFeaturedAds = useMemo(() => {
    if (shuffledFeaturedAdsPool.length === 0) return [];
    return getRotatingSlice(shuffledFeaturedAdsPool, rotationIndex, 2);
  }, [shuffledFeaturedAdsPool, rotationIndex]);

  // Featured insert pool — featured-only or featured+urgent (no topAd, no bump)
  const featuredInsertPool = useMemo(() => {
    return shuffledFeaturedAdsPool.filter(
      (ad) => !(ad as any).topAdActive && !(ad as any).bumpActive
    );
  }, [shuffledFeaturedAdsPool]);

  // Base ads — all filtered ads sorted by newest
  const baseAds = useMemo(() => {
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

    return [...filteredAds].sort((a, b) => {
      const timeDiff = getSortTime(b) - getSortTime(a);
      if (timeDiff !== 0) return timeDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [filteredAds]);

  // Interleave featured inserts every 16 ads, tagged with _isFeaturedInsert
  const interleavedAds = useMemo(() => {
    if (baseAds.length === 0) return [];
    if (featuredInsertPool.length === 0) return baseAds;

    const result: any[] = [];
    const insertCount = Math.min(2, featuredInsertPool.length);
    const poolLength = featuredInsertPool.length;
    const startOffset = (rotationIndex * insertCount) % poolLength;
    let insertOffset = 0;

    baseAds.forEach((ad, index) => {
      result.push(ad);
      if ((index + 1) % 16 === 0) {
        for (let i = 0; i < insertCount; i += 1) {
          const pos = (startOffset + insertOffset + i) % poolLength;
          const insertAd = featuredInsertPool[pos];
          if (!result.some((r) => r.id === insertAd.id)) {
            result.push({ ...insertAd, _isFeaturedInsert: true });
          }
        }
        insertOffset += insertCount;
      }
    });

    return result;
  }, [baseAds, featuredInsertPool, rotationIndex]);

  const handleFilterChange = (key: string, value: any) => {
    if (key === "searchQuery") setSearchQuery(value);
    else if (key === "selectedCategory") setSelectedCategory(value);
    else if (key === "selectedVehicleType") setSelectedVehicleType(value);
    else if (key === "selectedCondition") setSelectedCondition(value);
    else if (key === "selectedDistrict") setSelectedDistrict(value);
    else if (key === "minPrice") setMinPrice(value);
    else if (key === "maxPrice") setMaxPrice(value);
    setVisibleCount(12);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedVehicleType("all");
    setSelectedCondition("all");
    setSelectedDistrict("all");
    setMinPrice("");
    setMaxPrice("");
    setUrgentOnly(false);
    setVisibleCount(12);
  };

  const activeFilterCount = [
    searchQuery,
    selectedCategory !== "all" ? selectedCategory : null,
    selectedVehicleType !== "all" ? selectedVehicleType : null,
    selectedCondition !== "all" ? selectedCondition : null,
    selectedDistrict !== "all" ? selectedDistrict : null,
    minPrice,
    maxPrice,
    urgentOnly ? "urgent" : null,
  ].filter(Boolean).length;

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name ?? "—";
  };

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
                {activeFilterCount > 0 && ` with ${activeFilterCount} filter${activeFilterCount > 1 ? "s" : ""} applied`}
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

              <div className={`${isFiltersOpen ? "block" : "hidden"} lg:block space-y-4`}>
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
                      onChange={(e) => handleFilterChange("searchQuery", e.target.value)}
                      className="h-10 text-sm border-slate-200 pr-8"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => handleFilterChange("searchQuery", "")}
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
                  <Select value={selectedCategory} onValueChange={(value) => handleFilterChange("selectedCategory", value)}>
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
                  <Select value={selectedVehicleType} onValueChange={(value) => handleFilterChange("selectedVehicleType", value)}>
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
                  <Select value={selectedCondition} onValueChange={(value) => handleFilterChange("selectedCondition", value)}>
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
                      onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                      className="h-9 text-sm border-slate-200"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
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
                      <Select value={selectedDistrict} onValueChange={(value) => handleFilterChange("selectedDistrict", value)}>
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

                <Separator className="my-3" />

                {/* Urgent Ads Filter */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="urgentOnlyParts"
                    checked={urgentOnly}
                    onChange={(e) => { setUrgentOnly(e.target.checked); setVisibleCount(12); }}
                    className="h-4 w-4 rounded border-slate-300 text-red-600 cursor-pointer"
                  />
                  <label htmlFor="urgentOnlyParts" className="text-sm font-medium text-red-600 cursor-pointer flex items-center gap-1">
                    Urgent Ads Only
                  </label>
                </div>
              </div>
            </Card>
          </div>

          {/* Center Column - Results */}
          <div className="flex-1 min-w-0">
            {/* Top Ad Slots - 2 rotating */}
            {!isLoading && displayedTopAds.length > 0 && (
              <div className="mb-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayedTopAds.map((vehicle) => (
                    <TopAdCard
                      key={`top-${vehicle.id}`}
                      vehicle={vehicle}
                      vehicleTypeLabels={vehicleTypeLabels}
                      formatPrice={formatPrice}
                      formatAdTitle={formatAdTitle}
                    />
                  ))}
                </div>
                <Separator className="mt-4 mb-4" />
              </div>
            )}

            {/* Featured Ad Slots - 2 rotating */}
            {!isLoading && displayedFeaturedAds.length > 0 && (
              <div className="mb-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayedFeaturedAds.map((vehicle) => (
                    <FeaturedAdCard
                      key={`feat-${vehicle.id}`}
                      vehicle={vehicle}
                      vehicleTypeLabels={vehicleTypeLabels}
                      formatPrice={formatPrice}
                      formatAdTitle={formatAdTitle}
                      isUrgent={(vehicle as any).urgentActive}
                    />
                  ))}
                </div>
                <Separator className="mt-4 mb-4" />
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                <span className="ml-3 text-slate-600">Loading auto parts...</span>
              </div>
            )}

            {/* Results Grid */}
            {!isLoading && !error && interleavedAds.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {interleavedAds.slice(0, visibleCount).map((vehicle) => {
                    const adExt = vehicle as typeof vehicle & {
                      partCategoryId?: string;
                      compatibleVehicleType?: string;
                      partName?: string;
                      media?: Array<{ media?: { url?: string } }>;
                    };

                    if (vehicle._isFeaturedInsert) {
                      return (
                        <FeaturedAdCard
                          key={`insert-${vehicle.id}`}
                          vehicle={vehicle}
                          vehicleTypeLabels={vehicleTypeLabels}
                          formatPrice={formatPrice}
                          formatAdTitle={formatAdTitle}
                          isUrgent={(vehicle as any).urgentActive}
                        />
                      );
                    }

                    const categoryName = adExt.partCategoryId ? getCategoryName(adExt.partCategoryId) : null;
                    const compatVehicle = adExt.compatibleVehicleType
                      ? vehicleTypeLabels[adExt.compatibleVehicleType] || adExt.compatibleVehicleType
                      : null;
                    const mainImage = adExt.media?.[0]?.media?.url;
                    const displayTitle = formatAdTitle(vehicle);

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

                        {((vehicle as any).bumpActive || (vehicle as any).urgentActive || (vehicle as any).topAdActive || (vehicle as any).featuredActive) && (
                          <div className="absolute bottom-2 right-2 z-10">
                            <BoostBadges
                              bumpActive={(vehicle as any).bumpActive}
                              urgentActive={(vehicle as any).urgentActive}
                              topAdActive={(vehicle as any).topAdActive}
                              featuredActive={(vehicle as any).featuredActive}
                            />
                          </div>
                        )}

                        <div className="p-2 pb-5">
                          <h3 className="font-semibold text-sm text-slate-800 text-center mb-2 transition-colors group-hover:text-teal-700 line-clamp-1">
                            {displayTitle}
                          </h3>

                          <div className="flex">
                            <div className="w-36 h-30 flex-shrink-0 flex flex-col">
                              <div className="flex-1">
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
                              <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                                <span>{getRelativeTime(vehicle.createdAt)}</span>
                                <span className="flex items-center gap-0.5">
                                  <Eye className="h-3 w-3" />
                                  {(vehicle as any).analytics?.views || 0}
                                </span>
                              </div>
                            </div>

                            <div className="flex-1 pl-3 flex flex-col justify-between">
                              <div>
                                <div className="text-xs text-slate-600 mb-1 line-clamp-1">
                                  {vehicle.city || vehicle.location || ""}
                                </div>
                                <div className="text-sm font-semibold text-teal-700 mb-1">
                                  {formatPrice(vehicle.price, (vehicle as any).metadata?.isNegotiable)}
                                </div>
                                {categoryName && (
                                  <div className="text-xs text-slate-500 truncate">{categoryName}</div>
                                )}
                                {compatVehicle && (
                                  <div className="text-xs text-slate-400 truncate">{compatVehicle}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Load More */}
                <div className="text-center mt-8">
                  {visibleCount < interleavedAds.length ? (
                    <Button
                      size="lg"
                      variant="outline"
                      className="px-8 py-5 border-teal-700 text-teal-700 hover:bg-teal-700 hover:text-white transition-all duration-300"
                      onClick={() => setVisibleCount((prev) => prev + 12)}
                    >
                      Load More Parts
                    </Button>
                  ) : interleavedAds.length > 12 ? (
                    <p className="text-slate-500 text-sm">No more parts to load</p>
                  ) : null}
                </div>
              </>
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
          </div>

          {/* Right Sidebar */}
          <div className="hidden xl:block w-72 flex-shrink-0">
            <div className="sticky top-6 space-y-4">
              <Card className="p-4 bg-teal-900 text-white overflow-hidden shadow-lg border-none relative">
                <div className="relative z-10">
                  <h4 className="font-bold text-lg mb-2">Sell Faster!</h4>
                  <p className="text-xs text-teal-100 mb-4 leading-relaxed">Boost your auto parts reach to thousands of potential buyers instantly.</p>
                  <Button
                    onClick={() => user ? router.push("/sell/new") : router.push("/signin?redirect=/sell/new")}
                    className="w-full bg-white text-teal-900 hover:bg-teal-50 font-bold border-none"
                  >
                    Post Free Ad Now
                  </Button>
                </div>
                <Package className="absolute -right-4 -bottom-4 h-24 w-24 text-white/10 rotate-12" />
              </Card>

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
