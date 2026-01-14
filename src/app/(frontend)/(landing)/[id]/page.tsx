/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RevealPhoneButton } from "@/components/ui/reveal-phone-button";
import { Separator } from "@/components/ui/separator";
import { SimilarVehicleComparison } from "@/components/ui/similar-vehicle-comparison";
import { useGetAdById } from "@/features/ads/api/use-get-ad-by-id";
import { useGetSimilarVehicles } from "@/features/ads/api/use-get-similar-vehicles";
import { FavoriteButton } from "@/features/saved-ads/components/favorite-button";
import { useCreateReport } from "@/features/report/api/use-create-report";
import { ReportReasons } from "@/server/routes/report/report.schemas";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Fuel,
  Gauge,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
  Shield,
  BarChart3,
  Flag
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function AdDetailPage() {
  const { id } = useParams();
  const adId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");

  // Using the hook to fetch ad data
  const { data: ad, isLoading, isError } = useGetAdById({ adId: adId || "" });
  const { data: similarVehiclesData, isLoading: isLoadingSimilar } = useGetSimilarVehicles({
    adId: adId || "",
    limit: 5,
    enabled: !!adId
  });
  const { mutate: createReport, isPending: isSubmittingReport } = useCreateReport();

  // Handle report submission
  const handleSubmitReport = () => {
    if (!reportReason) {
      return;
    }

    createReport(
      {
        values: {
          adId: adId || "",
          reason: reportReason,
          details: reportDetails || undefined,
        },
      },
      {
        onSuccess: () => {
          setIsReportDialogOpen(false);
          setReportReason("");
          setReportDetails("");
        },
        onError: () => {
          // Error is already handled by the mutation, but ensure dialog stays open
          // so user can try again or see the error
        },
        onSettled: () => {
          // Always close dialog after mutation completes (success or error)
          // This ensures the dialog closes even if there's an issue
          setTimeout(() => {
            if (!isSubmittingReport) {
              setIsReportDialogOpen(false);
              setReportReason("");
              setReportDetails("");
            }
          }, 100);
        },
      }
    );
  };

  // Prevent image downloads and protect against various methods
  useEffect(() => {
    // Prevent right-click context menu globally on images - AGGRESSIVE BLOCKING
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Block if clicking on image or any element inside image container
      if (
        target.tagName === "IMG" ||
        (target.closest && target.closest("img")) ||
        (target.closest && target.closest(".aspect-video")) ||
        (target.closest && target.closest('[class*="watermark"]'))
      ) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    };

    // Prevent keyboard shortcuts for saving/downloading
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Ctrl+S, Ctrl+Shift+S, Ctrl+U (view source)
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "s" || e.key === "S" || e.key === "u" || e.key === "U")
      ) {
        // Allow Ctrl+S only if not on an image
        const target = e.target as HTMLElement;
        if (target.tagName === "IMG" || (target.closest && target.closest("img"))) {
          e.preventDefault();
          return false;
        }
      }
      // Prevent F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (dev tools)
      if (
        e.key === "F12" ||
        ((e.ctrlKey || e.metaKey) &&
          e.shiftKey &&
          (e.key === "I" || e.key === "J" || e.key === "C" || e.key === "i" || e.key === "j" || e.key === "c"))
      ) {
        // Allow dev tools but warn - you might want to remove this if you want stricter protection
        // For now, we'll allow it but the watermark is still applied
      }
    };

    // Prevent drag and drop
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "IMG" || (target.closest && target.closest("img"))) {
        e.preventDefault();
        return false;
      }
    };

    // Prevent image selection
    const handleSelectStart = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "IMG" || (target.closest && target.closest("img"))) {
        e.preventDefault();
        return false;
      }
    };

    // Add event listeners with capture phase to catch events early
    document.addEventListener("contextmenu", handleContextMenu, true); // Use capture phase
    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("dragstart", handleDragStart, true);
    document.addEventListener("selectstart", handleSelectStart, true);
    // Additional mouse events
    document.addEventListener("mousedown", (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (e.button === 2 && (target.tagName === "IMG" || (target.closest && target.closest("img")) || (target.closest && target.closest(".aspect-video")))) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, true);

    // Cleanup
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu, true);
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("dragstart", handleDragStart, true);
      document.removeEventListener("selectstart", handleSelectStart, true);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Skeleton */}
        <header className="bg-[#024950] text-white shadow-lg">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Skeleton className="h-10 w-32 bg-white/20" /> {/* Back Button */}
              <div className="flex-1">
                <Skeleton className="h-8 w-3/4 bg-white/20" /> {/* Title */}
              </div>
              <div className="flex gap-2 mt-2 sm:mt-0">
                <Skeleton className="h-10 w-10 rounded-full bg-white/20" /> {/* Fav */}
                <Skeleton className="h-10 w-10 rounded-full bg-white/20" /> {/* Report */}
                <Skeleton className="h-10 w-10 rounded-full bg-white/20" /> {/* Share */}
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column Skeleton */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image Slider Skeleton */}
              <Card className="overflow-hidden border-none shadow-sm">
                <Skeleton className="aspect-video w-full rounded-t-lg" />
                <div className="p-4 bg-white">
                  <div className="flex gap-2 overflow-hidden">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-16 w-20 rounded-md shrink-0" />
                    ))}
                  </div>
                </div>
              </Card>

              {/* Details Skeleton */}
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-5 w-24" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Features Skeleton */}
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-40" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Skeleton key={i} className="h-6 w-full rounded-full" />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Description Skeleton */}
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-28" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column Skeleton */}
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-10 w-2/3" /> {/* Price */}
                  <Skeleton className="h-5 w-1/2" /> {/* Location */}
                  <div className="space-y-3 pt-4">
                    <Skeleton className="h-12 w-full rounded-md" /> {/* Phone */}
                    <Skeleton className="h-12 w-full rounded-md" /> {/* Whatsapp */}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 space-y-4 text-center">
                  <div className="flex justify-center">
                    <Skeleton className="h-16 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-6 w-3/4 mx-auto" />
                  <Skeleton className="h-4 w-full" />
                  <div className="space-y-3 pt-2">
                    <Skeleton className="h-14 w-full rounded-md" />
                    <Skeleton className="h-14 w-full rounded-md" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !ad) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Failed to load ad details</p>
      </div>
    );
  }

  // Extract media and organize it for the image slider
  const originalImages: string[] = Array.isArray((ad as any).media) && (ad as any).media.length > 0
    ? (ad as any).media
      .map((item: any) => item?.media?.url)
      .filter((u: any) => typeof u === "string" && u.length > 0)
    : ["/placeholder.svg?height=400&width=600&text=No+Image"];

  // Helper function to get watermarked image URL
  const getWatermarkedImageUrl = (imageUrl: string): string => {
    // Skip watermarking for placeholder images
    if (imageUrl.includes("placeholder") || imageUrl.startsWith("/")) {
      return imageUrl;
    }
    // Return watermarked image URL via API
    return `/api/watermark?url=${encodeURIComponent(imageUrl)}`;
  };

  // Create watermarked image URLs
  const images: string[] = originalImages.map(getWatermarkedImageUrl);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const formatPrice = (price: number | null | undefined) => {
    if (!price) return "Price upon request";
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 0
    })
      .format(price)
      .replace("LKR", "Rs.");
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  // Get similar vehicles from database
  const similarVehicles = similarVehiclesData?.vehicles || [];

  // Organize features/options for display
  const features = ad.tags || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#024950] text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:space-x-4">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10 px-0 sm:px-3"
              onClick={() => window.history.back()}
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Back to Search
            </Button>
            <div className="flex-1">
              <h1 className="text-lg sm:text-xl font-semibold">
                {[ad.brand, ad.model, ad.manufacturedYear, ad.vehicleType]
                  .filter(Boolean)
                  .join(" ")}
              </h1>
            </div>
            <div className="flex items-center space-x-2 mt-2 sm:mt-0">
              <FavoriteButton
                adId={adId || ""}
                className="text-white hover:bg-white/10"
                iconClassName="w-5 h-5"
              />

              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:bg-white/10"
                onClick={() => setIsReportDialogOpen(true)}
                aria-label="Report Ad"
              >
                <Flag className="w-5 h-5" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/10"
                    aria-label="Share"
                  >
                    <Share2 className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem
                    onClick={() => {
                      const url = typeof window !== 'undefined' ? window.location.href : '';
                      const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
                      window.open(shareUrl, '_blank', 'noopener');
                    }}
                  >
                    Facebook
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => {
                      const url = typeof window !== 'undefined' ? window.location.href : '';
                      const shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`;
                      window.open(shareUrl, '_blank', 'noopener');
                    }}
                  >
                    Twitter
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => {
                      const url = typeof window !== 'undefined' ? window.location.href : '';
                      // Instagram does not support direct URL share via web; open Instagram homepage
                      const shareUrl = `https://www.instagram.com/`;
                      window.open(shareUrl, '_blank', 'noopener');
                    }}
                  >
                    Instagram
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => {
                      const url = typeof window !== 'undefined' ? window.location.href : '';
                      // YouTube doesn't have a direct share for arbitrary URLs; open YouTube homepage
                      const shareUrl = `https://www.youtube.com/`;
                      window.open(shareUrl, '_blank', 'noopener');
                    }}
                  >
                    YouTube
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Slider */}
            <Card className="overflow-hidden">
              <div className="relative">
                <div className="aspect-video bg-gray-200 relative">
                  <img
                    src={images[currentImageIndex] || "/placeholder.svg"}
                    alt={`Vehicle image ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover select-none pointer-events-none"
                    draggable={false}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      return false;
                    }}
                    onDragStart={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      return false;
                    }}
                  />
                  {/* Transparent overlay to prevent direct image interaction - BLOCKS ALL RIGHT CLICKS */}
                  <div
                    className="absolute inset-0 z-10 pointer-events-auto"
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.stopImmediatePropagation();
                      return false;
                    }}
                    onDragStart={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      return false;
                    }}
                    onMouseDown={(e) => {
                      if (e.button === 2) { // Right mouse button
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                      }
                    }}
                    style={{
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none'
                    }}
                  />
                </div>

                {/* Slider Controls */}
                {images.length > 1 && (
                  <>
                    <button
                      aria-label="Previous image"
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full z-20"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      aria-label="Next image"
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full z-20"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Status Badges */}
                <div className="absolute top-4 left-4 flex space-x-2 z-20">
                  {ad.featured && (
                    <Badge className="bg-orange-500 text-white">Featured</Badge>
                  )}
                  {ad.boosted && (
                    <Badge className="bg-blue-500 text-white">Boosted</Badge>
                  )}
                </div>
              </div>

              {/* Thumbnail Reel */}
              {images.length > 1 && (
                <div className="p-4 bg-gray-50">
                  <div className="flex space-x-2 overflow-x-auto">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-16 rounded border-2 overflow-hidden ${index === currentImageIndex ? "border-[#024950]" : "border-gray-300"
                          }`}
                      >
                        <img
                          src={image || "/placeholder.svg"}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover select-none"
                          draggable={false}
                          onContextMenu={(e) => e.preventDefault()}
                          onDragStart={(e) => e.preventDefault()}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Vehicle Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[#024950]">
                  Vehicle Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {ad.manufacturedYear && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5 text-gray-500" />
                      <div>
                        <div className="text-sm text-gray-500">Year</div>
                        <div className="font-semibold">
                          {ad.manufacturedYear}
                        </div>
                      </div>
                    </div>
                  )}

                  {ad.mileage && (
                    <div className="flex items-center space-x-2">
                      <Gauge className="w-5 h-5 text-gray-500" />
                      <div>
                        <div className="text-sm text-gray-500">Mileage</div>
                        <div className="font-semibold">
                          {ad.mileage.toLocaleString()} km
                        </div>
                      </div>
                    </div>
                  )}

                  {ad.fuelType && (
                    <div className="flex items-center space-x-2">
                      <Fuel className="w-5 h-5 text-gray-500" />
                      <div>
                        <div className="text-sm text-gray-500">Fuel Type</div>
                        <div className="font-semibold">{ad.fuelType}</div>
                      </div>
                    </div>
                  )}

                  {ad.transmission && (
                    <div>
                      <div className="text-sm text-gray-500">Transmission</div>
                      <div className="font-semibold">{ad.transmission}</div>
                    </div>
                  )}

                  {ad.engineCapacity && (
                    <div>
                      <div className="text-sm text-gray-500">Engine</div>
                      <div className="font-semibold">
                        {ad.engineCapacity} cc
                      </div>
                    </div>
                  )}

                  {/* {ad.color && (
                    <div>
                      <div className="text-sm text-gray-500">Color</div>
                      <div className="font-semibold">{ad.color}</div>
                    </div>
                  )} */}

                  {ad.vehicleType && (
                    <div>
                      <div className="text-sm text-gray-500">Body Type</div>
                      <div className="font-semibold">{ad.vehicleType}</div>
                    </div>
                  )}

                  {ad.condition && (
                    <div>
                      <div className="text-sm text-gray-500">Condition</div>
                      <div className="font-semibold">{ad.condition}</div>
                    </div>
                  )}

                  {ad.brand && (
                    <div>
                      <div className="text-sm text-gray-500">Brand</div>
                      <div className="font-semibold">{ad.brand}</div>
                    </div>
                  )}

                  {ad.model && (
                    <div>
                      <div className="text-sm text-gray-500">Model</div>
                      <div className="font-semibold">{ad.model}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            {features.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-[#024950]">
                    Features & Equipment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-[#024950] rounded-full"></div>
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[#024950]">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {ad.description}
                </p>

                <Separator className="my-4" />

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      {/* <span>
                        {Math.floor(Math.random() * 2000) + 100} views
                      </span> */}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>Posted {formatDate(ad.createdAt)}</span>
                    </div>
                  </div>
                  <div>Ad ID: {ad.id}</div>
                </div>
              </CardContent>
            </Card>

            {/* Similar Vehicles */}
            {(similarVehicles.length > 0 || isLoadingSimilar) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-[#024950]">Similar Vehicles</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingSimilar ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin w-6 h-6 border-4 border-[#024950] border-t-transparent rounded-full"></div>
                      <span className="ml-2 text-sm text-gray-500">Loading similar vehicles...</span>
                    </div>
                  ) : similarVehicles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {similarVehicles.map((vehicle) => (
                        <Card
                          key={vehicle.id}
                          className="hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => router.push(`/${vehicle.id}`)}
                        >
                          <CardContent className="p-3">
                            <img
                              src={vehicle.image || "/placeholder.svg"}
                              alt={vehicle.title}
                              className="w-full h-24 object-cover rounded mb-2"
                            />
                            <h3 className="font-semibold text-xs mb-1 line-clamp-2">{vehicle.title}</h3>
                            <div className="text-sm font-bold text-[#024950] mb-1">
                              {formatPrice(vehicle.price || 0)}
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                <span className="truncate">{[vehicle.city, vehicle.district].filter(Boolean).join(", ") || vehicle.location || "N/A"}</span>
                              </div>
                            </div>
                            {vehicle.mileage && (
                              <div className="text-xs text-gray-500 mt-1">
                                {vehicle.mileage.toLocaleString()} km
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-4">No similar vehicles found</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Price and Contact */}
          <div className="space-y-6">
            {/* Price and Location */}
            <Card>
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-[#024950] mb-2">
                  {(ad as any).discountPrice
                    ? formatPrice((ad as any).discountPrice)
                    : formatPrice(ad.price)}
                </div>
                {(ad as any).discountPrice &&
                  ad.price &&
                  (ad as any).discountPrice < ad.price && (
                    <div className="text-xl line-through text-gray-400 mb-2">
                      {formatPrice(ad.price)}
                    </div>
                  )}
                {/* Location Display - show city/district or fallback to location field */}
                {(ad.city || ad.district || ad.location) && (
                  <div className="flex items-center text-gray-600 mb-4">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>
                      {[ad.city, ad.district].filter(Boolean).join(", ") || ad.location}
                    </span>
                  </div>
                )}

                <div className="space-y-2">
                  {ad.phoneNumber && (
                    <div className="mb-2">
                      {/* Desktop: Masked number, reveal on click, no hyperlink */}
                      <div className="block sm:hidden">
                        {/* Mobile: Show as tel: link */}
                        <a
                          href={`tel:${ad.phoneNumber}`}
                          className="w-full inline-block"
                        >
                          <Button className="w-full bg-[#024950] hover:bg-[#036b75] text-white">
                            <Phone className="w-4 h-4 mr-2" />
                            {ad.phoneNumber}
                          </Button>
                        </a>
                      </div>
                      <div className="hidden sm:block">
                        {/* Desktop: Masked, reveal on click */}
                        <RevealPhoneButton phoneNumber={ad.phoneNumber} />
                      </div>
                    </div>
                  )}
                  <a
                    href={
                      ad.whatsappNumber
                        ? `https://wa.me/${ad.whatsappNumber.replace(/\D/g, "")}`
                        : `sms:${ad.phoneNumber || ""}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-block"
                  >
                    <Button
                      variant="outline"
                      className="w-full border-[#024950] text-[#024950] hover:bg-[#024950] hover:text-white"
                      disabled={!ad.whatsappNumber}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      {ad.whatsappNumber ? "WhatsApp" : "Message"}
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Seller Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[#024950]">
                  Seller Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-[#024950] bg-opacity-10 rounded-full flex items-center justify-center">
                    <span className="text-[#024950] font-semibold text-lg">
                      {((ad as any).creator?.name || "Seller").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          const sellerId = (ad as any).createdBy || (ad as any).creator?.id || (ad as any).userId || (ad as any).user_id || (ad as any).sellerId || (ad as any).ownerId || (ad as any).user?.id || (ad as any).seller?.id;
                          if (sellerId) {
                            router.push(`/search?seller=${encodeURIComponent(String(sellerId))}`);
                          } else {
                            router.push(`/search`);
                          }
                        }}
                        className="font-semibold text-left hover:underline cursor-pointer"
                      >
                        {(ad as any).creator?.name || "Seller"}
                      </button>
                      <Shield className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="text-sm text-gray-500 mb-2">
                      {(ad as any).sellerType === "DEALER"
                        ? "Dealer"
                        : "Private Seller"}
                    </div>
                    <div className="flex items-center space-x-1 mb-2">
                      {/* <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> */}
                      {/* <span className="text-sm font-medium">4.8</span>
                      <span className="text-sm text-gray-500">(5 ads)</span> */}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        // Try common seller id fields on the ad object
                        const sellerId = (ad as any).createdBy || (ad as any).creator?.id || (ad as any).userId || (ad as any).user_id || (ad as any).sellerId || (ad as any).ownerId || (ad as any).user?.id || (ad as any).seller?.id;
                        if (sellerId) {
                          router.push(`/search?seller=${encodeURIComponent(String(sellerId))}`);
                        } else {
                          // Fallback: go to search without filter
                          router.push(`/search`);
                        }
                      }}
                    >
                      View All Ads
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vehicle Analytics Button */}
            {ad.price && (
              <Card className="border-2 border-dashed border-[#024950]/30 bg-gradient-to-br from-teal-50/50 to-white">
                <CardContent className="p-8 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="p-4 bg-gradient-to-br from-[#024950] to-teal-600 rounded-full">
                      <BarChart3 className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                        View Vehicle Analytics
                      </h3>
                      <p className="text-sm text-gray-600 mb-4 max-w-md">
                        Get comprehensive market insights including price comparison and similar vehicle analysis
                      </p>
                    </div>
                    <div className="flex flex-col gap-3 w-full max-w-md">
                      <Button
                        onClick={() => router.push(`/${adId}/analytics`)}
                        className="bg-gradient-to-r from-[#024950] to-teal-600 text-white hover:from-[#036b75] hover:to-teal-700 border-0 px-6 py-6 text-lg w-full"
                        size="lg"
                      >
                        <BarChart3 className="w-5 h-5 mr-2" />
                        View Analytics
                      </Button>
                      <Button
                        onClick={() => router.push(`/comparison?vehicle1=${adId}`)}
                        variant="outline"
                        className="border-2 border-[#024950] text-[#024950] hover:bg-[#024950] hover:text-white px-6 py-6 text-lg w-full"
                        size="lg"
                      >
                        <BarChart3 className="w-5 h-5 mr-2" />
                        Comparison
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Similar Vehicle Comparison */}
            {ad.price && (
              <SimilarVehicleComparison
                adId={adId || ""}
                currentPrice={(ad as any).discountPrice || ad.price}
                currentVehicle={{
                  brand: ad.brand,
                  model: ad.model,
                  year: ad.manufacturedYear,
                  mileage: ad.mileage,
                  fuelType: ad.fuelType,
                  transmission: ad.transmission,
                }}
              />
            )}

            {/* Safety Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[#024950]">Safety Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 text-gray-600">
                  <li>• Meet in a public place</li>
                  <li>• Inspect the vehicle thoroughly</li>
                  <li>• Verify all documents</li>
                  <li>• Take a test drive</li>
                  <li>{`• Don't pay in advance`}</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>

      {/* Report Dialog */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Report Ad</DialogTitle>
            <DialogDescription>
              Help us maintain quality by reporting inappropriate or fraudulent ads.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason *</Label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ReportReasons).map(([key, value]) => (
                    <SelectItem key={key} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="details">Additional Details (Optional)</Label>
              <Textarea
                id="details"
                placeholder="Provide more information about your report..."
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsReportDialogOpen(false);
                setReportReason("");
                setReportDetails("");
              }}
              disabled={isSubmittingReport}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReport}
              disabled={!reportReason || isSubmittingReport}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmittingReport ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
