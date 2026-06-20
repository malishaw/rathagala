import Image from "next/image";
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
      className="rounded-xl border-2 bg-yellow-50/20 border-amber-300 hover:border-amber-400 transition-colors cursor-pointer group relative overflow-hidden"
      onClick={() => buildAdUrl(vehicle) && (window.location.href = buildAdUrl(vehicle))}
    >
      {/* Featured Ad Label Badge */}
      <div className="absolute top-2 left-2 bg-amber-600 text-white text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shadow-sm tracking-wider z-10">
        Featured
      </div>

      <div className="absolute bottom-2 right-2 z-10 scale-90">
        <BoostBadges featuredActive bumpActive={isBump} topAdActive={isTopAd} urgentActive={isUrgent} />
      </div>

      <div className="p-2">
        <div className="flex gap-3">
          {/* Image Container - Single Compact Image */}
          <div className="w-24 sm:w-28 h-18 sm:h-20 flex-shrink-0 rounded-lg overflow-hidden bg-slate-55 border border-slate-100 relative">
            <Image
              src={vehicle?.media?.[0]?.media?.url || "/placeholder-image.jpg"}
              alt={vehicle.title || "Vehicle"}
              fill
              sizes="(max-width: 640px) 96px, 112px"
              loading="lazy"
              className="object-cover"
            />
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
            <div>
              {/* Category / Make */}
              <span className="text-[9px] uppercase font-bold tracking-wider text-amber-800 block mb-0.5">
                {vehicle.type === "AUTO_PARTS"
                  ? (vehicle as any).partCategory?.name || "Auto Part"
                  : vehicleTypeLabels[vehicle.type] || vehicle.type}
              </span>

              {/* Title */}
              <h3 className="font-semibold text-slate-800 text-xs sm:text-sm group-hover:text-teal-700 transition-colors line-clamp-1 leading-tight">
                {formatAdTitle(vehicle)}
              </h3>

              {/* Location */}
              <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                {vehicle.city || vehicle.location || ""}
              </div>
            </div>

            {/* Price & Views */}
            <div className="flex items-end justify-between mt-1">
              <div className="text-xs sm:text-sm font-bold text-teal-700 leading-none">
                {formatPrice(vehicle.price, (vehicle as any).metadata?.isNegotiable)}
              </div>

              {/* Views and relative time */}
              <div className="flex items-center gap-2 text-[9px] sm:text-[10px] text-slate-400 pr-1">
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
    </div>
  );
}
