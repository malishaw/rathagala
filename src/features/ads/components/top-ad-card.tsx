"use client";

import { Eye } from "lucide-react";
import { BoostBadges } from "@/features/boost/components/boost-badges";
import { getRelativeTime } from "@/lib/utils";
import { buildAdUrl } from "@/lib/ad-url";

interface TopAdCardProps {
  vehicle: any;
  vehicleTypeLabels: Record<string, string>;
  formatPrice: (price: number | null, isNegotiable?: boolean) => any;
  formatAdTitle: (vehicle: any) => string;
}

export function TopAdCard({ vehicle, vehicleTypeLabels, formatPrice, formatAdTitle }: TopAdCardProps) {
  const isFeatured = (vehicle as any).featuredActive;
  
  return (
    <div
      className={`rounded-lg border-2 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group relative ${isFeatured ? 'bg-yellow-50 border-yellow-200 hover:border-yellow-300' : 'bg-white border-slate-200 hover:border-slate-300'}`}
      onClick={() => (window.location.href = buildAdUrl(vehicle))}
    >
      <div className="absolute bottom-2 right-2 z-10">
        <BoostBadges
          topAdActive
          featuredActive={(vehicle as any).featuredActive}
          bumpActive={(vehicle as any).bumpActive}
          urgentActive={(vehicle as any).urgentActive}
        />
      </div>
      <div className="ps-2">
        <h3 className="font-semibold text-sm text-slate-800 text-center mb-2 group-hover:text-teal-700 line-clamp-1">
          {formatAdTitle(vehicle)}
        </h3>
        <div className="flex gap-3">
          <div className="w-36 h-30 flex-shrink-0 flex flex-col">
            <div className="flex-1">
              <img
                src={vehicle?.media?.[0]?.media?.url || "/placeholder-image.jpg"}
                alt={vehicle.title || "Vehicle"}
                className="w-full h-full object-cover rounded-md"
              />
            </div>
            {/* Time and Views Below Image */}
            <div className="flex items-center gap-1 mt-1 mb-2 text-xs text-slate-400">
              <span>{getRelativeTime(vehicle.createdAt)}</span>
              <span className="flex items-center gap-0.5">
                <Eye className="h-3 w-3" />
                {(vehicle as any).analytics?.views || 0}
              </span>
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-between min-w-0">
            <div>
              <div className="text-xs text-slate-600 mb-1 truncate">{vehicle.city || vehicle.location || ""}</div>
              <div className="text-sm font-semibold text-teal-700 mb-1 leading-relaxed">{formatPrice(vehicle.price, (vehicle as any).metadata?.isNegotiable)}</div>
              <div className="text-xs text-slate-500 truncate">
                {vehicle.type === "AUTO_PARTS"
                  ? (vehicle as any).partCategory?.name || "Auto Part"
                  : vehicleTypeLabels[vehicle.type] || vehicle.type}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
