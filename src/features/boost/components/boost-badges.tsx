"use client";

interface BoostBadgesProps {
  bumpActive?: boolean;
  topAdActive?: boolean;
  urgentActive?: boolean;
  featuredActive?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function BoostBadges({
  bumpActive,
  topAdActive,
  urgentActive,
  featuredActive,
  size = "sm",
  className = "",
}: BoostBadgesProps) {
  const h = size === "lg" ? "h-7" : size === "md" ? "h-6" : "h-5";

  if (!bumpActive && !topAdActive && !urgentActive && !featuredActive) {
    return null;
  }

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {topAdActive && (
        <img
          src="/assets/promotionLogos/topAd.png"
          alt="Top Ad"
          className={`${h} w-auto drop-shadow-md rounded-md object-contain`}
          title="Top Ad"
        />
      )}
      {featuredActive && (
        <img
          src="/assets/promotionLogos/featuredAd.png"
          alt="Featured"
          className={`${h} w-auto drop-shadow-md rounded-md object-contain`}
          title="Featured Ad"
        />
      )}
      {bumpActive && (
        <img
          src="/assets/promotionLogos/bumpAd.png"
          alt="Bump Up"
          className={`${h} w-auto drop-shadow-md rounded-md object-contain`}
          title="Bump Up Ad"
        />
      )}
      {urgentActive && (
        <img
          src="/assets/promotionLogos/urgentAd.jpg"
          alt="Urgent"
          className={`${h} w-auto drop-shadow-md rounded-md object-contain`}
          title="Urgent Ad"
        />
      )}
    </div>
  );
}
