"use client";

interface BoostBadgesProps {
  bumpActive?: boolean;
  topAdActive?: boolean;
  urgentActive?: boolean;
  featuredActive?: boolean;
  size?: "sm" | "md";
}

export function BoostBadges({ bumpActive, topAdActive, urgentActive, featuredActive, size = "sm" }: BoostBadgesProps) {
  const h = size === "sm" ? "h-5" : "h-5";

  return (
    <div className="flex items-end gap-2">
      {topAdActive && (
        <img src="/assets/promotionLogos/topAd.png" alt="Top Ad" className={`${h} w-auto drop-shadow-md`} title="top ad"/>
      )}
      {featuredActive && (
        <img src="/assets/promotionLogos/featuredAd.png" alt="Featured" className={`${h} w-auto drop-shadow-md`}title="featured ad" />
      )}
      {bumpActive && (
        <img src="/assets/promotionLogos/bumpAd.png" alt="Bump Up" className={`${h} w-auto drop-shadow-md`} title="bump up ad"/>
      )}
      {urgentActive && (
        <img src="/assets/promotionLogos/urgentAd.jpg" alt="Urgent" className={`${h} w-auto drop-shadow-md`} title="urgent ad"/>
      )}
    </div>
  );
}
