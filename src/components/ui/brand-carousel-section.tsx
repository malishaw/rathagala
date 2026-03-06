"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetBrandCarousel } from "@/features/ads/api/use-get-brand-carousel";
import { Skeleton } from "@/components/ui/skeleton";

export function BrandCarouselSection() {
  const { data: brands, isLoading } = useGetBrandCarousel();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
      return () => {
        el.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, [brands]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = 300;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (isLoading) {
    return (
      <section className="bg-linear-to-r from-slate-50 to-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Browse by Brand</h2>
          <div className="flex gap-6 overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="shrink-0 flex flex-col items-center gap-2">
                <Skeleton className="w-20 h-20 rounded-full" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!brands || brands.length === 0) return null;

  return (
    <section className="bg-linear-to-r from-slate-50 to-white py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Browse by Brand</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto scrollbar-hide pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/brands/${encodeURIComponent(brand.name)}`}
              className="shrink-0 flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="w-20 h-20 rounded-full bg-white border-2 border-slate-200 group-hover:border-[#024950] transition-all duration-300 overflow-hidden flex items-center justify-center shadow-sm group-hover:shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={brand.imageUrl}
                  alt={brand.name}
                  className="w-14 h-14 object-contain"
                />
              </div>
              <span className="text-sm font-medium text-slate-700 group-hover:text-[#024950] transition-colors duration-300 text-center max-w-20 truncate">
                {brand.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
