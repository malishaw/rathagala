"use client";

import React, { useCallback, useId, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { CloudUpload, ImagesIcon, Loader2, X, CheckCircle2 } from "lucide-react";
import { useDropzone } from "react-dropzone";

import { MediaService } from "@/modules/media/service";
import type { MediaFile, MediaType } from "@/modules/media/types";
import { getMediaType } from "../utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MediaUploaderProps {
  onUpload: (file: MediaFile) => void;
  onError: (error: Error) => void;
  acceptedTypes?: MediaType[];
  path?: string;
  maxSize?: number;
  className?: string;
  multiple?: boolean;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  onUpload,
  onError,
  acceptedTypes = ["IMAGE", "VIDEO", "PDF"],
  path = "",
  maxSize = 10 * 1024 * 1024,
  className,
  multiple = true
}) => {
  const mediaService = MediaService.getInstance();
  const [acceptedFiles, setAcceptedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);

  const uploadFileToastId = useId();

  const processFileUpload = async (files: File[]) => {
    try {
      setUploading(true);
      const totalFiles = files.length;
      toast.loading(`Uploading ${totalFiles} file${totalFiles > 1 ? "s" : ""}...`, {
        id: uploadFileToastId,
      });

      const results: MediaFile[] = [];
      let successCount = 0;
      let failCount = 0;
      let lastErrorMessage = "";

      for (const file of files) {
        try {
          const type = getMediaType(file.type);

          if (!acceptedTypes.includes(type)) {
            throw new Error(`File type not supported: ${file.name}`);
          }

          const result = await mediaService.uploadFile({
            file,
            type,
            path,
          });

          results.push(result);
          successCount++;
          onUpload(result);
        } catch (fileError) {
          failCount++;
          const errorMsg =
            fileError instanceof Error ? fileError.message : String(fileError);
          lastErrorMessage = errorMsg;
          console.error(`Failed to upload ${file.name}:`, fileError);
        }
      }

      if (successCount > 0) {
        toast.success(
          `${successCount} image${successCount > 1 ? "s" : ""} uploaded successfully!`,
          {
            id: uploadFileToastId,
            description:
              failCount > 0
                ? `${failCount} file(s) failed: ${lastErrorMessage}`
                : undefined,
          }
        );
      } else {
        const errorDescription =
          lastErrorMessage || "Failed to upload files. Please try again.";
        toast.error("Upload failed", {
          id: uploadFileToastId,
          description: errorDescription,
        });
        onError(new Error(errorDescription));
      }

      if (results.length > 0) {
        setAcceptedFiles([]);
      }
    } catch (error) {
      const err = error as Error;
      toast.error("Failed to upload media", {
        id: uploadFileToastId,
        description: err.message,
      });
      onError(err);
    } finally {
      setUploading(false);
    }
  };

  const onDrop = useCallback(
    async (accepted: File[]) => {
      setAcceptedFiles(accepted);
      if (accepted.length > 0) {
        void processFileUpload(accepted);
      }
    },
    [onUpload, onError, acceptedTypes, path]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    maxSize,
    multiple,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
  });

  return (
    <div className="w-full space-y-4">
      {/* Compact Dropzone Box */}
      <Card
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed border-border/60 hover:border-primary/60 rounded-2xl py-4 px-6 transition-all duration-200 cursor-pointer bg-muted/10 hover:bg-primary/[0.02] flex items-center justify-between group min-h-[100px]",
          isDragActive && "border-primary bg-primary/5 ring-4 ring-primary/10",
          uploading && "opacity-70 pointer-events-none",
          className
        )}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 duration-200">
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CloudUpload className="w-5 h-5" />
              )}
            </div>

            <div className="space-y-0.5">
              <p className="text-xs sm:text-sm font-semibold text-foreground">
                {uploading
                  ? "Uploading photos..."
                  : isDragActive
                  ? "Drop the files here"
                  : "Drag & drop photos or click to select"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                PNG, JPG, WEBP up to {maxSize / (1024 * 1024)}MB
              </p>
            </div>
          </div>

          {!uploading && (
            <Button
              type="button"
              size="sm"
              className="rounded-xl text-xs h-8 px-4 gap-1.5 shadow-xs font-semibold shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                open();
              }}
            >
              <CloudUpload className="w-3.5 h-3.5" />
              Browse Files
            </Button>
          )}
        </div>
      </Card>

      {/* Selected Previews Grid */}
      {acceptedFiles.length > 0 && !uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              {acceptedFiles.length} file{acceptedFiles.length > 1 ? "s" : ""} selected for upload
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
              onClick={() => setAcceptedFiles([])}
            >
              Clear All
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {acceptedFiles.map((file, index) => (
              <div
                key={index}
                className="relative group aspect-square rounded-xl overflow-hidden border border-border/60 bg-muted shadow-xs"
              >
                <Image
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAcceptedFiles((prev) =>
                      prev.filter((_, i) => i !== index)
                    );
                  }}
                  className="absolute top-1.5 right-1.5 bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="absolute bottom-0 inset-x-0 bg-black/60 p-1">
                  <p className="text-[10px] text-white truncate text-center font-medium">
                    {file.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
