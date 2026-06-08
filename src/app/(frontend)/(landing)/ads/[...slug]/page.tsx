/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import dynamic from "next/dynamic";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
  Flag,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { authClient } from "@/lib/auth-client";
import { buildAdUrl } from "@/lib/ad-url";
import { FaFacebookSquare, FaWhatsappSquare } from "react-icons/fa";
import { FaSquareXTwitter, FaTelegram } from "react-icons/fa6";
import { AdIdDisplay } from "./ad-id-display";
import { client } from "@/lib/rpc";
import { getRelativeTime } from "@/lib/utils";

// Lazy-load analytics — not needed for normal ad view
const VehicleAnalyticsContent = dynamic(() => import("./vehicle-analytics"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-[#024950] border-t-transparent rounded-full" />
    </div>
  ),
});

// ─── helpers ──────────────────────────────────────────────────────────────────

const vehicleTypeLabels: Record<string, string> = {
  CAR: "Car", VAN: "Van", SUV_JEEP: "SUV / Jeep", MOTORCYCLE: "Motorcycle",
  CREW_CAB: "Crew Cab", PICKUP_DOUBLE_CAB: "Pickup / Double Cab", BUS: "Bus",
  LORRY: "Lorry", THREE_WHEEL: "Three Wheel", OTHER: "Other",
  TRACTOR: "Tractor", HEAVY_DUTY: "Heavy-Duty", BICYCLE: "Bicycle",
  AUTO_SERVICE: "Auto Service", RENTAL: "Rental", AUTO_PARTS: "Auto Parts",
  MAINTENANCE: "Maintenance", BOAT: "Boat",
};

const formatAdTitle = (ad: any): string => {
  if ((ad.type ?? ad.vehicleType) === "AUTO_PARTS") {
    const partName = ad.partName || "Auto Part";
    const compatLabel = vehicleTypeLabels[ad.compatibleVehicleType || ""] || ad.compatibleVehicleType || "";
    const forParts = [ad.brand, ad.model, compatLabel].filter(Boolean).join(" ");
    return forParts ? `${partName} for ${forParts}` : partName;
  }
  const rawType = (ad.type ?? ad.vehicleType) as string | undefined;
  const typeLabel = rawType ? (vehicleTypeLabels[rawType] || String(rawType)) : undefined;
  const vehicleInfo = [ad.brand, ad.model, ad.manufacturedYear || ad.modelYear, typeLabel]
    .filter(Boolean).join(" ");
  if (ad.listingType === "WANT") return `Want ${vehicleInfo}`;
  if (ad.listingType === "RENT") return `${vehicleInfo} for Rent`;
  if (ad.listingType === "HIRE") return `${vehicleInfo} for Hire`;
  return vehicleInfo;
};

const formatPrice = (price: number | null | undefined, isNegotiable = false) => {
  if (!price && isNegotiable) return "Negotiable";
  if (!price) return "Price Negotiable";
  const formatted = new Intl.NumberFormat("en-LK", {
    style: "currency", currency: "LKR", minimumFractionDigits: 0,
  }).format(price).replace("LKR", "Rs.");
  if (isNegotiable) return `${formatted} (Negotiable)`;
  return formatted;
};

// ─── Skeleton loading state ───────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#024950] h-14" />
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="aspect-video w-full rounded" />
            <div className="flex gap-2">
              {[1,2,3,4].map(i => <Skeleton key={i} className="h-14 w-20 rounded shrink-0" />)}
            </div>
            <div className="bg-white rounded border p-4 grid grid-cols-3 gap-3">
              {[1,2,3,4,5,6].map(i => (
                <div key={i}><Skeleton className="h-3 w-12 mb-1" /><Skeleton className="h-4 w-20" /></div>
              ))}
            </div>
            <div className="bg-white rounded border p-4 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-white rounded border p-4 space-y-3">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full rounded" />
              <Skeleton className="h-10 w-full rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdDetailPage() {
  const params = useParams();
  const slugArray = Array.isArray(params.slug)
    ? params.slug
    : params.slug ? [params.slug as string] : [];
  const isAnalytics = slugArray[slugArray.length - 1] === "analytics";
  const adSlug = isAnalytics ? slugArray.slice(0, -1) : slugArray;
  const adId = adSlug.length === 2 ? adSlug[1] : adSlug[0] || "";

  // ── All hooks must be called unconditionally before any early returns ──
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [similarPage, setSimilarPage] = useState(1);

  const { data: session } = authClient.useSession();
  const { data: ad, isLoading, isError } = useGetAdById({ adId: adId || "" });
  const { data: similarData, isLoading: loadingSimilar } = useGetSimilarVehicles({
    adId: adId || "",
    limit: 9,        // reduced from 24 — we only show 6 per page
    enabled: !!adId,
  });
  const { mutate: createReport, isPending: isSubmittingReport } = useCreateReport();

  // ── View count increment ──
  useEffect(() => {
    if (ad?.id) {
      client.api.ad[":id"].view.$post({ param: { id: ad.id } }).catch(() => {});
    }
  }, [ad?.id]);

  // ── Redirect old ID-based URLs to SEO URLs ──
  useEffect(() => {
    if (ad && slugArray.length === 1 && ad.seoSlug) {
      const isVehicle = ad.type !== "AUTO_PARTS";
      if (isVehicle && !ad.brand) return;
      const seoUrl = buildAdUrl(ad);
      if (seoUrl !== `/ads/${ad.id}`) router.replace(seoUrl);
    }
  }, [ad, slugArray.length, router]);

  // ── Image protection ──
  useEffect(() => {
    const blockMenu = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "IMG" || t.closest?.(".img-protected")) {
        e.preventDefault(); e.stopPropagation();
      }
    };
    const blockDrag = (e: DragEvent) => {
      if ((e.target as HTMLElement).tagName === "IMG") e.preventDefault();
    };
    document.addEventListener("contextmenu", blockMenu, true);
    document.addEventListener("dragstart", blockDrag, true);
    return () => {
      document.removeEventListener("contextmenu", blockMenu, true);
      document.removeEventListener("dragstart", blockDrag, true);
    };
  }, []);

  // ── Similar vehicles — useMemo must be before any conditional returns ──
  const allSimilar = similarData?.vehicles || [];
  const modelFiltered = useMemo(() => {
    if (!ad?.model) return allSimilar;
    return allSimilar.filter(v => v.model?.toLowerCase() === ad.model?.toLowerCase());
  }, [allSimilar, ad?.model]);

  // ── Report ──
  const handleSubmitReport = () => {
    if (!reportReason) return;
    createReport(
      { values: { adId: adId || "", reason: reportReason, details: reportDetails || undefined } },
      {
        onSettled: () => {
          setTimeout(() => {
            if (!isSubmittingReport) {
              setIsReportDialogOpen(false);
              setReportReason(""); setReportDetails("");
            }
          }, 100);
        },
      }
    );
  };

  // ── Share / copy ──
  const getShareUrl = () =>
    ad && typeof window !== "undefined"
      ? window.location.origin + buildAdUrl(ad)
      : typeof window !== "undefined" ? window.location.href : "";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getShareUrl()).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  // ── Conditional returns — all hooks are above this point ──
  if (isAnalytics) return <VehicleAnalyticsContent adId={adId} />;
  if (isLoading) return <DetailSkeleton />;
  if (isError || !ad) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-500 text-sm">Failed to load ad details.</p>
          <Button variant="ghost" size="sm" className="mt-3" onClick={() => router.back()}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Go back
          </Button>
        </div>
      </div>
    );
  }
  if (ad.status === "REJECTED") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <p className="text-gray-700 font-medium mb-1">This ad is no longer available.</p>
          <p className="text-gray-400 text-sm">It may have been removed or is under review.</p>
        </div>
      </div>
    );
  }

  // ── Images ──
  const originalImages: string[] = Array.isArray((ad as any).media) && (ad as any).media.length > 0
    ? (ad as any).media
        .map((item: any) => item?.media?.url)
        .filter((u: any) => typeof u === "string" && u.length > 0)
    : ["/placeholder.svg?height=400&width=600&text=No+Image"];

  const getWatermarked = (url: string) =>
    url.includes("placeholder") || url.startsWith("/")
      ? url
      : `/api/watermark?url=${encodeURIComponent(url)}&v=2`;

  // Only watermark the CURRENT displayed image for thumbnails use raw URLs
  const mainImage = getWatermarked(originalImages[currentImageIndex] || originalImages[0]);

  const adTitle = formatAdTitle(ad);
  const adPrice = (ad as any).discountPrice
    ? formatPrice((ad as any).discountPrice, (ad as any).metadata?.isNegotiable)
    : formatPrice(ad.price, (ad as any).metadata?.isNegotiable);

  const location = [ad.city, ad.district].filter(Boolean).join(", ") || ad.location || "";

  const perPage = 6;
  const totalPages = Math.ceil(modelFiltered.length / perPage);
  const paginated = modelFiltered.slice((similarPage - 1) * perPage, similarPage * perPage);

  // ── Specs grid ──
  const isAutoPart = (ad as any).type === "AUTO_PARTS";
  const specs = isAutoPart
    ? [
        (ad as any).partName && { label: "Part Name", value: (ad as any).partName },
        (ad as any).partCategory?.name && { label: "Category", value: (ad as any).partCategory.name },
        (ad as any).compatibleVehicleType && {
          label: "Compatible",
          value: vehicleTypeLabels[(ad as any).compatibleVehicleType] || (ad as any).compatibleVehicleType,
        },
        ad.brand && { label: "Brand", value: ad.brand },
        ad.model && { label: "Model", value: ad.model },
        ad.condition && { label: "Condition", value: ad.condition },
      ].filter(Boolean)
    : [
        ad.brand && { label: "Brand", value: ad.brand },
        ad.model && { label: "Model", value: ad.model },
        ad.grade && { label: "Grade", value: ad.grade },
        ad.manufacturedYear && { label: "Year", value: ad.manufacturedYear },
        ad.mileage && { label: "Mileage", value: `${ad.mileage.toLocaleString()} km` },
        ad.fuelType && { label: "Fuel", value: ad.fuelType },
        ad.transmission && { label: "Transmission", value: ad.transmission },
        ad.engineCapacity && { label: "Engine", value: `${ad.engineCapacity} cc` },
        ad.bodyType && { label: "Body", value: ad.bodyType },
        ad.condition && { label: "Condition", value: ad.condition },
      ].filter(Boolean);

  const features = ad.tags || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Compact Header ── */}
      <header className="bg-[#024950] text-white">
        <div className="max-w-5xl mx-auto px-4 h-12 flex items-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-1 text-white/80 hover:text-white text-sm transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-medium truncate">{adTitle}</h1>
          </div>
          <div className="flex items-center gap-1">
            <FavoriteButton adId={adId || ""} className="text-white hover:bg-white/10 h-8 w-8" iconClassName="w-4 h-4" />
            <button
              className="h-8 w-8 flex items-center justify-center rounded text-gray-300 hover:bg-white/10 transition-colors"
              title="Report Ad"
              onClick={() => {
                if (session?.user) setIsReportDialogOpen(true);
                else router.push("/signin?redirect=" + encodeURIComponent(window.location.pathname));
              }}
            >
              <Flag className="w-4 h-4" />
            </button>
            <button
              className="h-8 w-8 flex items-center justify-center rounded text-gray-300 hover:bg-white/10 transition-colors"
              onClick={() => setShareOpen(o => !o)}
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-4">
        {/* ── Inline Share Bar ── */}
        {shareOpen && (
          <div className="mb-3 flex items-center gap-2 bg-white border border-gray-200 rounded p-2 text-sm">
            <span className="text-gray-500 text-xs mr-1">Share:</span>
            <button className="p-1 hover:bg-gray-100 rounded" onClick={() => {
              window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`, "_blank");
              setShareOpen(false);
            }}><FaFacebookSquare className="w-5 h-5 text-blue-600" /></button>
            <button className="p-1 hover:bg-gray-100 rounded" onClick={() => {
              const url = getShareUrl();
              const text = `Check out this ${[ad.brand, ad.model, ad.manufacturedYear].filter(Boolean).join(" ")}`;
              const wa = `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`;
              if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) window.location.href = wa;
              else window.open(wa, "_blank");
              setShareOpen(false);
            }}><FaWhatsappSquare className="w-5 h-5 text-green-600" /></button>
            <button className="p-1 hover:bg-gray-100 rounded" onClick={() => {
              window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(getShareUrl())}`, "_blank");
              setShareOpen(false);
            }}><FaSquareXTwitter className="w-5 h-5 text-gray-900" /></button>
            <button className="p-1 hover:bg-gray-100 rounded" onClick={() => {
              const url = getShareUrl();
              const text = `Rathagala.lk — ${adTitle}`;
              window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, "_blank");
              setShareOpen(false);
            }}><FaTelegram className="w-5 h-5 text-blue-500" /></button>
            <button className="p-1 hover:bg-gray-100 rounded flex items-center gap-1 text-gray-500" onClick={() => {
              handleCopyLink(); setShareOpen(false);
            }}>
              {isCopied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              <span className="text-xs">{isCopied ? "Copied" : "Copy link"}</span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* ── Left Column ── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Image Viewer */}
            <div className="bg-white border border-gray-200 rounded overflow-hidden">
              <div className="relative img-protected aspect-video bg-gray-100">
                <img
                  src={mainImage}
                  alt={`${adTitle} — image ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover select-none pointer-events-none"
                  draggable={false}
                  fetchPriority="high"
                  onContextMenu={e => { e.preventDefault(); e.stopPropagation(); }}
                />
                {/* Transparent overlay blocks right-click */}
                <div className="absolute inset-0 z-10" style={{ userSelect: "none", WebkitUserSelect: "none" }}
                  onContextMenu={e => { e.preventDefault(); e.stopPropagation(); }}
                />
                {/* Image counter badge */}
                {originalImages.length > 1 && (
                  <span className="absolute bottom-2 right-2 z-20 bg-black/50 text-white text-xs px-2 py-0.5 rounded">
                    {currentImageIndex + 1} / {originalImages.length}
                  </span>
                )}
                {/* Nav buttons */}
                {originalImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex(p => (p - 1 + originalImages.length) % originalImages.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 text-white p-1.5 rounded-full transition-colors"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex(p => (p + 1) % originalImages.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 text-white p-1.5 rounded-full transition-colors"
                      aria-label="Next image"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
              {/* Thumbnail strip */}
              {originalImages.length > 1 && (
                <div className="flex gap-1.5 p-2 overflow-x-auto bg-gray-50 border-t border-gray-100">
                  {originalImages.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImageIndex(i)}
                      className={`flex-shrink-0 w-16 h-12 rounded overflow-hidden border-2 transition-colors ${
                        i === currentImageIndex ? "border-[#024950]" : "border-transparent"
                      }`}
                    >
                      <img
                        src={src}   // raw URL — thumbnails are too small to steal
                        alt={`Thumbnail ${i + 1}`}
                        className="w-full h-full object-cover select-none"
                        loading="lazy"
                        draggable={false}
                        onContextMenu={e => e.preventDefault()}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Specs Grid */}
            {specs.length > 0 && (
              <div className="bg-white border border-gray-200 rounded p-4">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  {isAutoPart ? "Part Details" : "Vehicle Details"}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2.5">
                  {(specs as any[]).map((s: any) => (
                    <div key={s.label}>
                      <div className="text-[11px] text-gray-400 uppercase tracking-wide">{s.label}</div>
                      <div className="text-sm font-medium text-gray-800">{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Features / Tags */}
            {features.length > 0 && (
              <div className="bg-white border border-gray-200 rounded p-4">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Features & Equipment</h2>
                <div className="flex flex-wrap gap-1.5">
                  {features.map((f: string, i: number) => (
                    <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="bg-white border border-gray-200 rounded p-4">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Description</h2>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{ad.description}</p>
              <Separator className="my-3" />
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />{ad.analytics?.views || 0} views
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />Posted {getRelativeTime(ad.createdAt)}
                  </span>
                </div>
                <AdIdDisplay id={ad.id} />
              </div>
            </div>

            {/* Special Notes */}
            {(ad as any).specialNote && (
              <div className="bg-amber-50 border border-amber-100 rounded p-4">
                <h2 className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">Special Note</h2>
                <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-line">{(ad as any).specialNote}</p>
              </div>
            )}

            {/* Similar Vehicles — desktop (hidden on mobile, shown below) */}
            <div className="hidden sm:block">
              {!isAutoPart && (modelFiltered.length > 0 || loadingSimilar) && (
                <div className="bg-white border border-gray-200 rounded p-4">
                  <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Similar Vehicles</h2>
                  {loadingSimilar ? (
                    <div className="grid grid-cols-3 gap-3">
                      {[1,2,3].map(i => (
                        <div key={i} className="border rounded p-2">
                          <Skeleton className="aspect-video w-full mb-2 rounded" />
                          <Skeleton className="h-3 w-3/4 mb-1" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-3">
                        {paginated.map(v => (
                          <button
                            key={v.id}
                            onClick={() => router.push(buildAdUrl(v))}
                            className="text-left border border-gray-200 rounded overflow-hidden hover:shadow-sm transition-shadow"
                          >
                            <img
                              src={v.image || "/placeholder.svg"}
                              alt={v.title}
                              className="w-full h-20 object-cover"
                              loading="lazy"
                            />
                            <div className="p-2">
                              <div className="text-xs font-medium text-gray-800 line-clamp-1">{v.title}</div>
                              <div className="text-xs font-bold text-[#024950] mt-0.5">
                                {formatPrice(v.price, (v as any).metadata?.isNegotiable)}
                              </div>
                              {(v.city || v.district || v.location) && (
                                <div className="flex items-center gap-0.5 text-[10px] text-gray-400 mt-0.5">
                                  <MapPin className="w-2.5 h-2.5" />
                                  <span className="truncate">
                                    {[v.city, v.district].filter(Boolean).join(", ") || v.location}
                                  </span>
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                      {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-1 mt-3 pt-3 border-t">
                          <button
                            onClick={() => setSimilarPage(p => Math.max(1, p - 1))}
                            disabled={similarPage === 1}
                            className="p-1 rounded border border-gray-200 disabled:opacity-30 hover:bg-gray-50"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                            <button
                              key={p}
                              onClick={() => setSimilarPage(p)}
                              className={`w-7 h-7 text-xs rounded border transition-colors ${
                                similarPage === p
                                  ? "bg-[#024950] text-white border-[#024950]"
                                  : "border-gray-200 hover:bg-gray-50"
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                          <button
                            onClick={() => setSimilarPage(p => Math.min(totalPages, p + 1))}
                            disabled={similarPage === totalPages}
                            className="p-1 rounded border border-gray-200 disabled:opacity-30 hover:bg-gray-50"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Right Sidebar ── */}
          <div className="space-y-3">
            {/* Price & Contact — sticky on desktop */}
            <div className="lg:sticky lg:top-4 space-y-3">
              <div className="bg-white border border-gray-200 rounded p-4">
                {/* Price */}
                <div className="mb-3">
                  <div className="text-xl font-bold text-[#024950]">{adPrice}</div>
                  {(ad as any).discountPrice && ad.price && (ad as any).discountPrice < ad.price && (
                    <div className="text-sm line-through text-gray-400">
                      {formatPrice(ad.price)}
                    </div>
                  )}
                </div>

                {/* Location */}
                {location && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{location}</span>
                  </div>
                )}

                <Separator className="mb-3" />

                {/* Phone */}
                {ad.phoneNumber && (
                  <div className="mb-2">
                    {/* Mobile: dial link */}
                    <a href={`tel:${ad.phoneNumber}`} className="block sm:hidden">
                      <Button className="w-full bg-[#024950] hover:bg-[#036b75] text-white text-sm h-9">
                        <Phone className="w-3.5 h-3.5 mr-2" />{ad.phoneNumber}
                      </Button>
                    </a>
                    {/* Desktop: masked reveal */}
                    <div className="hidden sm:block">
                      <RevealPhoneButton phoneNumber={ad.phoneNumber} />
                    </div>
                  </div>
                )}

                {/* WhatsApp */}
                <Button
                  variant="outline"
                  className="w-full border-[#024950] text-[#024950] hover:bg-[#024950] hover:text-white text-sm h-9"
                  disabled={!ad.whatsappNumber && !ad.phoneNumber}
                  onClick={() => {
                    const vehicleInfo = [ad.brand, ad.model, ad.manufacturedYear].filter(Boolean).join(" ");
                    const message = `Hi, I'm interested in this vehicle: ${vehicleInfo}. Could you please share more details`;
                    if (ad.whatsappNumber) {
                      let phone = ad.whatsappNumber.replace(/\D/g, "");
                      if (!phone.startsWith("94")) phone = "94" + phone.replace(/^0+/, "");
                      const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
                      if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) window.location.href = url;
                      else window.open(url, "_blank", "noopener,noreferrer");
                    } else if (ad.phoneNumber) {
                      const sms = `sms:${ad.phoneNumber}${/iPhone|iPad|iPod/i.test(navigator.userAgent) ? "&" : "?"}body=${encodeURIComponent(message)}`;
                      window.location.href = sms;
                    }
                  }}
                >
                  <MessageCircle className="w-3.5 h-3.5 mr-2" />
                  {ad.whatsappNumber ? "WhatsApp" : "Message"}
                </Button>
              </div>

              {/* Seller Info */}
              <div className="bg-white border border-gray-200 rounded p-4">
                <div className="flex items-center gap-3 mb-3">
                  <button
                    onClick={() => {
                      const sid = (ad as any).createdBy || (ad as any).creator?.id;
                      router.push(sid ? `/search?seller=${encodeURIComponent(sid)}` : "/search");
                    }}
                  >
                    <Avatar className="h-10 w-10">
                      {(ad as any).creator?.image ? (
                        <AvatarImage src={(ad as any).creator.image} alt={(ad as any).creator?.name || "Seller"} />
                      ) : (
                        <AvatarFallback className="bg-[#024950] text-white text-sm font-semibold">
                          {((ad as any).creator?.name || "S").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          const sid = (ad as any).createdBy || (ad as any).creator?.id;
                          router.push(sid ? `/search?seller=${encodeURIComponent(sid)}` : "/search");
                        }}
                        className="text-sm font-semibold hover:underline text-left truncate"
                      >
                        {(ad as any).creator?.name || "Seller"}
                      </button>
                      <Shield className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    </div>
                    <div className="text-xs text-gray-400">
                      {(ad as any).sellerType === "DEALER" ? "Dealer" : "Private Seller"}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs h-8"
                  onClick={() => {
                    const sid = (ad as any).createdBy || (ad as any).creator?.id;
                    router.push(sid ? `/search?seller=${encodeURIComponent(sid)}` : "/search");
                  }}
                >
                  View All Ads
                </Button>
              </div>

              {/* Analytics link — compact, not a large card */}
              {ad.price && (
                <div className="bg-white border border-gray-200 rounded p-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-gray-700">Price Analytics</div>
                    <div className="text-[11px] text-gray-400">Compare with similar vehicles</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/ads/${adId}/analytics`)}
                      className="text-xs text-[#024950] hover:underline flex items-center gap-1"
                    >
                      Analytics <ExternalLink className="w-3 h-3" />
                    </button>
                    <span className="text-gray-200">|</span>
                    <button
                      onClick={() => router.push(`/compare?vehicle1=${adId}`)}
                      className="text-xs text-[#024950] hover:underline flex items-center gap-1"
                    >
                      Compare <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Safety Tips */}
              <div className="bg-white border border-gray-200 rounded p-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Safety Tips</h3>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• Meet in a public place</li>
                  <li>• Inspect the vehicle thoroughly</li>
                  <li>• Verify all documents</li>
                  <li>• Take a test drive</li>
                  <li>{`• Don't pay in advance`}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Vehicles — mobile (shown at bottom) */}
        {!isAutoPart && (modelFiltered.length > 0 || loadingSimilar) && (
          <div className="mt-4 sm:hidden bg-white border border-gray-200 rounded p-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Similar Vehicles</h2>
            {loadingSimilar ? (
              <div className="grid grid-cols-3 gap-2">
                {[1,2,3].map(i => <Skeleton key={i} className="aspect-video rounded" />)}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {paginated.map(v => (
                  <button
                    key={v.id}
                    onClick={() => router.push(buildAdUrl(v))}
                    className="text-left border rounded overflow-hidden hover:shadow-sm"
                  >
                    <img src={v.image || "/placeholder.svg"} alt={v.title} className="w-full h-16 object-cover" loading="lazy" />
                    <div className="p-1.5">
                      <div className="text-[10px] font-medium line-clamp-1">{v.title}</div>
                      <div className="text-[10px] font-bold text-[#024950]">
                        {formatPrice(v.price, (v as any).metadata?.isNegotiable)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Report Dialog */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Report Ad</DialogTitle>
            <DialogDescription>Help us maintain quality by reporting inappropriate ads.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="reason" className="text-sm">Reason *</Label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ReportReasons).map(([key, value]) => (
                    <SelectItem key={key} value={value} className="text-sm">{value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="details" className="text-sm">Additional Details (Optional)</Label>
              <Textarea
                id="details"
                placeholder="Provide more information..."
                value={reportDetails}
                onChange={e => setReportDetails(e.target.value)}
                rows={3}
                className="text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => { setIsReportDialogOpen(false); setReportReason(""); setReportDetails(""); }} disabled={isSubmittingReport}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSubmitReport} disabled={!reportReason || isSubmittingReport} className="bg-red-600 hover:bg-red-700">
              {isSubmittingReport ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
