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
import { RevealPhoneButton } from "@/components/ui/reveal-phone-button";
import { Separator } from "@/components/ui/separator";
import { PriceComparison } from "@/components/ui/price-comparison";
import { useGetAdById } from "@/features/ads/api/use-get-ad-by-id";
import { FavoriteButton } from "@/features/saved-ads/components/favorite-button";
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
  Shield
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function AdDetailPage() {
  const { id } = useParams();
  const adId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Using the hook to fetch ad data
  const { data: ad, isLoading, isError } = useGetAdById({ adId: adId || "" });

  // Prevent image downloads and protect against various methods
  useEffect(() => {
    // Prevent right-click context menu globally on images - AGGRESSIVE BLOCKING
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Block if clicking on image or any element inside image container
      if (
        target.tagName === "IMG" || 
        target.closest("img") ||
        target.closest(".aspect-video") ||
        target.closest('[class*="watermark"]')
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
        if (target.tagName === "IMG" || target.closest("img")) {
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
      if (target.tagName === "IMG" || target.closest("img")) {
        e.preventDefault();
        return false;
      }
    };

    // Prevent image selection
    const handleSelectStart = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "IMG" || target.closest("img")) {
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
      if (e.button === 2 && (target.tagName === "IMG" || target.closest("img") || target.closest(".aspect-video"))) {
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
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin w-8 h-8 border-4 border-[#024950] border-t-transparent rounded-full"></div>
        <span className="ml-2">Loading ad details...</span>
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

  // Generate similar vehicles (placeholder)
  const similarVehicles = [
    {
      id: "similar_1",
      title: `${ad.brand || "Similar"} ${ad.model || "Vehicle"} ${
        ad.manufacturedYear || ""
      }`,
      price: ad.price ? ad.price * 0.9 : 0,
      location: ad.city || "Unknown",
      image: "/placeholder.svg?height=150&width=200",
      mileage: ad.mileage ? `${ad.mileage.toLocaleString()} km` : "Unknown"
    },
    {
      id: "similar_2",
      title: `${ad.brand || "Similar"} ${ad.model || "Vehicle"} ${
        typeof ad.manufacturedYear === "number" ? ad.manufacturedYear - 1 : ""
      }`,
      price: ad.price ? ad.price * 0.85 : 0,
      location: "Kandy",
      image: "/placeholder.svg?height=150&width=200",
      mileage: ad.mileage
        ? `${(ad.mileage * 1.2).toFixed(0).toLocaleString()} km`
        : "Unknown"
    },
    {
      id: "similar_3",
      title: `${ad.brand || "Similar"} ${ad.model || "Vehicle"} ${
        typeof ad.manufacturedYear === "number" ? ad.manufacturedYear - 2 : ""
      }`,
      price: ad.price ? ad.price * 0.8 : 0,
      location: "Galle",
      image: "/placeholder.svg?height=150&width=200",
      mileage: ad.mileage
        ? `${(ad.mileage * 1.5).toFixed(0).toLocaleString()} km`
        : "Unknown"
    }
  ];

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
                        className={`flex-shrink-0 w-20 h-16 rounded border-2 overflow-hidden ${
                          index === currentImageIndex ? "border-[#024950]" : "border-gray-300"
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

                <div className="flex items-center justify-between text-sm text-gray-500">
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
                {(ad.city || ad.province) && (
                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPin className="w-4 h-4 mr-1" />
                    {[ad.city, ad.province].filter(Boolean).join(", ")}
                  </div>
                )}
                {ad.location && (
                  <div className="flex items-center text-gray-600 mb-4">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{ad.location}</span>
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

            {/* Market Price Comparison */}
            {ad.price && (
              <PriceComparison 
                adId={adId || ""} 
                currentPrice={(ad as any).discountPrice || ad.price}
              />
            )}

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

        {/* Similar Vehicles */}
        {/* <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Similar Vehicles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {similarVehicles.map((vehicle) => (
              <Card
                key={vehicle.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
              >
                <CardContent className="p-4">
                  <img
                    src={vehicle.image || "/placeholder.svg"}
                    alt={vehicle.title}
                    className="w-full h-40 object-cover rounded mb-3"
                  />
                  <h3 className="font-semibold mb-2">{vehicle.title}</h3>
                  <div className="text-lg font-bold text-[#024950] mb-1">
                    {formatPrice(vehicle.price)}
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {vehicle.location}
                    </div>
                    <div>{vehicle.mileage}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div> */}
      </div>
    </div>
  );
}
