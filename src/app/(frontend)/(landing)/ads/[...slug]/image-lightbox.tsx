/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";

interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
  title?: string;
  getWatermarked: (url: string) => string;
}

export function ImageLightbox({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
  title = "Vehicle Images",
  getWatermarked,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Sync initialIndex when lightbox opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setIsZoomed(false);
      setIsPlaying(false);
    }
  }, [isOpen, initialIndex]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handlePrev = useCallback(() => {
    setIsZoomed(false);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const handleNext = useCallback(() => {
    setIsZoomed(false);
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  // Slideshow auto-advance
  useEffect(() => {
    if (!isOpen || !isPlaying || images.length <= 1) return;
    const interval = setInterval(() => {
      handleNext();
    }, 3500);
    return () => clearInterval(interval);
  }, [isOpen, isPlaying, images.length, handleNext]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handlePrev, handleNext, onClose]);

  // Scroll active thumbnail into view
  useEffect(() => {
    if (!thumbnailContainerRef.current) return;
    const activeThumb = thumbnailContainerRef.current.children[currentIndex] as HTMLElement;
    if (activeThumb) {
      activeThumb.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [currentIndex]);

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (!isOpen) return null;

  const currentSrc = images[currentIndex] || images[0];
  const watermarkedSrc = getWatermarked(currentSrc);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col justify-between select-none animate-in fade-in duration-200"
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/40 border-b border-white/10 z-20">
        <div className="flex items-center gap-3 min-w-0 pr-4">
          <span className="text-white/70 text-xs sm:text-sm font-medium tracking-wide shrink-0">
            {currentIndex + 1} / {images.length}
          </span>
          <span className="text-white text-xs sm:text-sm font-semibold truncate">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {images.length > 1 && (
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-2 rounded-full text-white transition-colors ${
                isPlaying ? "bg-emerald-600 hover:bg-emerald-700" : "bg-white/10 hover:bg-white/20"
              }`}
              title={isPlaying ? "Pause Slideshow" : "Start Slide View / Slideshow"}
              aria-label={isPlaying ? "Pause Slideshow" : "Start Slide View"}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          )}

          <button
            onClick={() => setIsZoomed(!isZoomed)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors hidden sm:flex"
            title={isZoomed ? "Zoom Out" : "Zoom In"}
            aria-label={isZoomed ? "Zoom Out" : "Zoom In"}
          >
            {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-red-600/80 text-white transition-colors"
            title="Close (Esc)"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Main Full View Area ── */}
      <div
        className="relative flex-1 flex items-center justify-center p-2 sm:p-6 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Navigation Arrow Left */}
        {images.length > 1 && (
          <button
            onClick={handlePrev}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 p-2.5 sm:p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all hover:scale-105 active:scale-95 shadow-xl"
            aria-label="Previous Image"
          >
            <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        )}

        {/* Image Container with Protection */}
        <div
          className={`relative max-w-full max-h-full flex items-center justify-center transition-transform duration-200 ${
            isZoomed ? "scale-125 sm:scale-150 cursor-zoom-out" : "cursor-default"
          }`}
          onClick={() => {
            if (isZoomed) setIsZoomed(false);
          }}
        >
          <img
            src={watermarkedSrc}
            alt={`${title} - Image ${currentIndex + 1}`}
            className="max-h-[72vh] sm:max-h-[78vh] max-w-[95vw] object-contain rounded select-none pointer-events-none drop-shadow-2xl"
            draggable={false}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = "/placeholder-image.jpg";
            }}
          />

          {/* Transparent Overlay for extra contextmenu / dragging protection */}
          <div
            className="absolute inset-0"
            style={{ userSelect: "none", WebkitUserSelect: "none" }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          />
        </div>

        {/* Navigation Arrow Right */}
        {images.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 p-2.5 sm:p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all hover:scale-105 active:scale-95 shadow-xl"
            aria-label="Next Image"
          >
            <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        )}
      </div>

      {/* ── Bottom Thumbnail Strip & Slide Controls ── */}
      <div className="bg-black/60 border-t border-white/10 p-3 z-20">
        <div
          ref={thumbnailContainerRef}
          className="flex items-center justify-center gap-2 overflow-x-auto max-w-4xl mx-auto py-1 scrollbar-thin scrollbar-thumb-white/20"
        >
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => {
                setIsZoomed(false);
                setCurrentIndex(i);
              }}
              className={`relative shrink-0 w-14 h-10 sm:w-20 sm:h-14 rounded overflow-hidden border-2 transition-all ${
                i === currentIndex
                  ? "border-emerald-500 scale-105 shadow-lg opacity-100 ring-2 ring-emerald-500/30"
                  : "border-white/20 opacity-60 hover:opacity-100 hover:border-white/50"
              }`}
            >
              <img
                src={src}
                alt={`Thumbnail ${i + 1}`}
                className="w-full h-full object-cover select-none"
                loading="lazy"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = "/placeholder-image.jpg";
                }}
              />
              <span className="absolute bottom-0.5 right-1 bg-black/70 text-white text-[9px] px-1 rounded">
                {i + 1}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
