"use client";

import React from "react";

interface WatermarkOverlayProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function WatermarkOverlay({ className = "", size = "md" }: WatermarkOverlayProps) {
  const sizeClasses = {
    sm: "text-base sm:text-lg",
    md: "text-xl sm:text-2xl md:text-3xl",
    lg: "text-2xl sm:text-4xl md:text-5xl",
  };

  const subSizeClasses = {
    sm: "text-[9px] sm:text-[10px]",
    md: "text-[11px] sm:text-xs md:text-sm",
    lg: "text-xs sm:text-sm md:text-base",
  };

  return (
    <div
      className={`absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none select-none overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <div className="flex flex-col items-center justify-center text-white text-center opacity-45 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
        <span className={`font-bold tracking-wide font-sans leading-tight ${sizeClasses[size]}`}>
          රථගාල
        </span>
        <span className={`font-medium tracking-wider opacity-90 uppercase ${subSizeClasses[size]}`}>
          www.rathagala.lk
        </span>
      </div>
    </div>
  );
}
