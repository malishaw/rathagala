"use client";

import { Button } from "@/components/ui/button";
import { useIsSaved } from "@/features/saved-ads/api/use-is-saved";
import { useRemoveSaved } from "@/features/saved-ads/api/use-remove-saved";
import { useSaveAd } from "@/features/saved-ads/api/use-save-ad";
import { cn } from "@/lib/utils";
import { Heart, Loader2 } from "lucide-react";

interface FavoriteButtonProps {
  adId: string;
  className?: string;
  iconClassName?: string;
}

export function FavoriteButton({ adId, className, iconClassName }: FavoriteButtonProps) {
  const { data: isSaved, isLoading } = useIsSaved(adId);
  const { mutate: saveAd, isPending: isSaving } = useSaveAd();
  const { mutate: removeAd, isPending: isRemoving } = useRemoveSaved();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    e.preventDefault();
    
    console.log("Favorite button clicked for ad:", adId, "isSaved:", isSaved);
    
    if (isSaved) {
      console.log("Removing from favorites...");
      removeAd(adId);
    } else {
      console.log("Adding to favorites...");
      saveAd(adId);
    }
  };

  const isProcessing = isLoading || isSaving || isRemoving;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      disabled={isProcessing}
      className={cn(
        "hover:bg-white/80 transition-all duration-300",
        isProcessing && "opacity-50 cursor-not-allowed",
        className
      )}
      title={isSaved ? "Remove from favorites" : "Add to favorites"}
    >
      {(isSaving || isRemoving) ? (
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      ) : (
        <Heart
          className={cn(
            "w-5 h-5 transition-all duration-300",
            isSaved ? "fill-primary text-primary" : "text-slate-400 hover:text-primary",
            iconClassName
          )}
        />
      )}
    </Button>
  );
}
