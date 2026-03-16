"use client";

import { Eye } from "lucide-react";
import { BoostBadges } from "@/features/boost/components/boost-badges";
import { getRelativeTime } from "@/lib/utils";
import { buildAdUrl } from "@/lib/ad-url";

interface FeaturedAdCardProps {
  vehicle: any;
  vehicleTypeLabels: Record<string, string>;
  formatPrice: (price: number | null, isNegotiable?: boolean) => any;
  formatAdTitle: (vehicle: any) => string;
  isBump?: boolean;
  isTopAd?: boolean;
  isUrgent?: boolean;
  titleClampClass?: string;
}

export function FeaturedAdCard({
  vehicle,
  vehicleTypeLabels,
  formatPrice,
  formatAdTitle,
  isBump = false,
  isTopAd = false,
  isUrgent = false,
  titleClampClass = "line-clamp-2",
}: FeaturedAdCardProps) {
  return (
    <div
      className="rounded-lg border-2 border-yellow-200 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group relative bg-yellow-50"
      onClick={() => buildAdUrl(vehicle) && (window.location.href = buildAdUrl(vehicle))}
    >
      <div className="absolute bottom-2 right-2 z-10">
        <BoostBadges featuredActive bumpActive={isBump} topAdActive={isTopAd} urgentActive={isUrgent} />
      </div>

      {/* Image Section */}
      <div className="grid grid-cols-2 gap-1 p-2  overflow-hidden">
        {(vehicle?.media?.slice(0, 2) || []).length > 0
          ? vehicle.media.slice(0, 2).map((m: any, idx: number) => (
              <img
                key={idx}
                src={m.media?.url || "/placeholder-image.jpg"}
                alt={vehicle.title || "Vehicle"}
                className="w-full h-full object-cover"
              />
            ))
          : [0, 1].map((i) => (
              <img key={i} src="/placeholder-image.jpg" alt="Vehicle" className="w-full h-full object-cover rounded-md" />
            ))}
      </div>

      {/* Content Section */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-sm text-slate-800 group-hover:text-teal-700 ${titleClampClass}`}>
              {formatAdTitle(vehicle)}
            </h3>
            <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
              <span className="truncate">{vehicle.city || vehicle.location || ""}</span>
              <span className="flex-shrink-0">·</span>
              <span className="flex-shrink-0">{getRelativeTime(vehicle.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
              <span className="truncate">
                {vehicle.type === "AUTO_PARTS"
                  ? (vehicle as any).partCategory?.name || "Auto Part"
                  : vehicleTypeLabels[vehicle.type] || vehicle.type}
              </span>
              <span className="flex-shrink-0">·</span>
              <span className="flex items-center gap-1 flex-shrink-0">
                <Eye className="h-3 w-3" />
                {(vehicle as any).analytics?.views || 0}
              </span>
            </div>
          </div>
          <div className="text-sm font-bold text-teal-700 flex-shrink-0 leading-relaxed">
            {formatPrice(vehicle.price, (vehicle as any).metadata?.isNegotiable)}
          </div>
        </div>
      </div>
    </div>
  );
}
