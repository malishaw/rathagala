"use client";

import React, { ReactNode, useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useQueryClient } from "@tanstack/react-query";
import {
  Check,
  GridIcon,
  ImageIcon,
  Loader2,
  Trash2Icon,
  UploadIcon,
  ExternalLink,
  CheckCircle2
} from "lucide-react";
import { useListMedia } from "@/modules/media/api/use-list-media";
import { MediaService } from "@/modules/media/service";
import { MediaUploader } from "@/modules/media/components/MediaUploader";
import type { MediaFile } from "@/modules/media/types";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Props = {
  onMediaSelect?: (media: MediaFile[]) => void;
  multiSelect?: boolean;
  initialTab?: "gallery" | "upload";
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
};

export function MediaGallery({
  onMediaSelect,
  multiSelect = true,
  initialTab = "upload",
  children,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  title = "Select Images"
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = setControlledOpen || setInternalOpen;

  const {
    data: session,
    error: sessionErr,
    isPending: sessionPending
  } = authClient.useSession();

  const queryClient = useQueryClient();
  const mediaService = MediaService.getInstance();

  const [activeTab, setActiveTab] = useState<"gallery" | "upload">(initialTab);
  const [selectedMedia, setSelectedMedia] = useState<MediaFile[]>([]);
  const [mediaToDelete, setMediaToDelete] = useState<MediaFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
      setSelectedMedia([]);
    }
  }, [open, initialTab]);

  const { data: mediaItems, isLoading, error, refetch } = useListMedia(
    session?.user?.id
  );

  const toggleMediaSelection = (media: MediaFile) => {
    if (multiSelect) {
      if (selectedMedia.some((item) => item.id === media.id)) {
        setSelectedMedia(selectedMedia.filter((item) => item.id !== media.id));
      } else {
        setSelectedMedia([...selectedMedia, media]);
      }
    } else {
      setSelectedMedia([media]);
    }
  };

  const handleUploadSuccess = (file: MediaFile) => {
    queryClient.invalidateQueries({ queryKey: ["media"] });
    toast.success("Image uploaded successfully!");
    if (multiSelect) {
      setSelectedMedia((prev) => (prev.some((m) => m.id === file.id) ? prev : [...prev, file]));
    } else {
      setSelectedMedia([file]);
    }
    // Switch to gallery tab to view uploaded file
    setActiveTab("gallery");
  };

  const handleUploadError = (error: Error) => {
    toast.error("Upload failed", { description: error.message });
  };

  const handleSubmit = () => {
    if (selectedMedia.length > 0) {
      onMediaSelect?.(selectedMedia);
      toast.success(`${selectedMedia.length} image(s) selected`);
      setOpen(false);
    } else {
      toast.error("Please select at least one image");
    }
  };

  const confirmDeleteMedia = async () => {
    if (!mediaToDelete) return;

    setIsDeleting(true);
    try {
      await mediaService.deleteFile(mediaToDelete.id);
      queryClient.invalidateQueries({ queryKey: ["media"] });
      toast.success("Image deleted successfully");
      setSelectedMedia((prev) => prev.filter((item) => item.id !== mediaToDelete.id));
    } catch (err) {
      toast.error("Failed to delete image", {
        description: err instanceof Error ? err.message : "Unknown error"
      });
    } finally {
      setIsDeleting(false);
      setMediaToDelete(null);
    }
  };

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "Enter") {
        handleSubmit();
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedMedia, open]);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>

        <DialogContent className="w-[95vw] sm:w-[90vw] md:max-w-4xl lg:max-w-5xl h-[85vh] max-h-[720px] p-0 flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-background shadow-2xl">
          {/* Minimal Header with Upload prioritized */}
          <DialogHeader className="px-6 py-4 border-b border-border/50 flex flex-row items-center justify-between space-y-0 bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-medium">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-foreground tracking-tight">
                  {title}
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Upload new photos or pick from your existing library
                </p>
              </div>
            </div>

            {/* Segmented Tab Switcher (Upload Priority) */}
            <div className="flex items-center bg-muted/70 p-1 rounded-xl border border-border/40 space-x-1">
              <button
                type="button"
                onClick={() => setActiveTab("upload")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                  activeTab === "upload"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <UploadIcon className="w-3.5 h-3.5" />
                Upload New
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("gallery")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                  activeTab === "gallery"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <GridIcon className="w-3.5 h-3.5" />
                Gallery
                {mediaItems && mediaItems.length > 0 && (
                  <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-muted font-normal">
                    {mediaItems.length}
                  </span>
                )}
              </button>
            </div>
          </DialogHeader>

          {/* Main Body */}
          <div className="flex-1 overflow-hidden relative">
            {sessionPending ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                <span className="text-xs text-muted-foreground">Loading...</span>
              </div>
            ) : !session || sessionErr ? (
              <div className="h-full flex items-center justify-center p-6">
                <div className="text-center space-y-2">
                  <p className="text-sm text-destructive font-medium">Please sign in to access your media gallery.</p>
                </div>
              </div>
            ) : activeTab === "upload" ? (
              <div className="h-full p-6 flex flex-col justify-center max-w-2xl mx-auto">
                <MediaUploader
                  onUpload={handleUploadSuccess}
                  onError={handleUploadError}
                  path={`${session?.user?.id || "guest"}`}
                  className="h-64 border-2 border-dashed border-primary/20 hover:border-primary/50 bg-primary/[0.02] hover:bg-primary/[0.04] transition-all rounded-2xl"
                />
              </div>
            ) : isLoading ? (
              <ScrollArea className="h-full">
                <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-square rounded-xl" />
                  ))}
                </div>
              </ScrollArea>
            ) : error ? (
              <div className="h-full flex items-center justify-center p-6">
                <div className="text-center space-y-3">
                  <p className="text-sm text-destructive font-medium">Failed to load media</p>
                  <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-xl">
                    Try Again
                  </Button>
                </div>
              </div>
            ) : mediaItems?.length === 0 ? (
              <div className="h-full flex items-center justify-center p-6">
                <div className="text-center space-y-3 max-w-xs">
                  <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-foreground">
                      No images in gallery
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Upload your first image to get started
                    </p>
                  </div>
                  <Button
                    onClick={() => setActiveTab("upload")}
                    size="sm"
                    className="rounded-xl gap-1.5"
                  >
                    <UploadIcon className="w-3.5 h-3.5" />
                    Upload Image
                  </Button>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                  {mediaItems?.map((media) => {
                    const isSelected = selectedMedia.some(
                      (item) => item.id === media.id
                    );

                    return (
                      <div
                        key={media.id}
                        onClick={() =>
                          toggleMediaSelection({
                            ...media,
                            createdAt: new Date(media.createdAt),
                            filename: media.filename as string,
                            size: media.size || 0
                          })
                        }
                        className={cn(
                          "group relative aspect-square rounded-xl overflow-hidden cursor-pointer border transition-all duration-200 select-none bg-muted/40",
                          isSelected
                            ? "ring-2 ring-primary border-primary shadow-sm scale-[0.98]"
                            : "border-border/60 hover:border-foreground/30 hover:shadow-md hover:scale-[1.01]"
                        )}
                      >
                        {media.type === "IMAGE" ? (
                          <img
                            src={media.url}
                            alt={media.filename as string}
                            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="bg-muted w-full h-full flex items-center justify-center p-2">
                            <Badge variant="outline" className="text-[10px]">
                              {media.type}
                            </Badge>
                          </div>
                        )}

                        {/* Selection Check Badge */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1 shadow-md animate-in zoom-in-50">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}

                        {/* Hover Overlay with Action Buttons */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 p-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="w-8 h-8 rounded-full bg-white/90 text-slate-800 hover:bg-white shadow-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(media.url, "_blank");
                            }}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="w-8 h-8 rounded-full shadow-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMediaToDelete({
                                ...media,
                                createdAt: new Date(media.createdAt),
                                filename: media.filename as string,
                                size: media.size || 0
                              });
                            }}
                          >
                            <Trash2Icon className="w-3.5 h-3.5" />
                          </Button>
                        </div>

                        {/* Filename Footer Badge */}
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2 pt-4">
                          <p className="text-[11px] font-medium text-white truncate drop-shadow-xs">
                            {media.filename}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Minimal Footer */}
          <div className="px-6 py-3.5 border-t border-border/50 bg-muted/20 flex items-center justify-between gap-4">
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              {selectedMedia.length > 0 ? (
                <span className="font-medium text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  {selectedMedia.length} image{selectedMedia.length > 1 ? "s" : ""} chosen
                </span>
              ) : (
                <span>No images selected</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl text-xs h-9 px-4"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSubmit}
                disabled={!selectedMedia.length}
                className="rounded-xl text-xs h-9 px-5 gap-1.5"
              >
                Use Selected ({selectedMedia.length})
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog
        open={!!mediaToDelete}
        onOpenChange={(open) => !open && setMediaToDelete(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this image permanently? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteMedia}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
