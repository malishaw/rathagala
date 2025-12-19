"use client";

import React, { useCallback, useId, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { ImagesIcon, Loader, UploadIcon } from "lucide-react";
import { useDropzone } from "react-dropzone";

import { MediaService } from "@/modules/media/service";
import type { MediaFile, MediaType } from "@/modules/media/types";
import { getMediaType } from "../utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
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
  maxSize = 4 * 1024 * 1024,
  className,
  multiple = true
}) => {
  const mediaService = MediaService.getInstance();
  const [acceptedFiles, setAcceptedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState<boolean>();
  const [uploadResults, setUploadResults] = useState<MediaFile[]>([]);

  const uploadFileToastId = useId();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setAcceptedFiles(acceptedFiles);
      setUploadResults([]);
    },
    [onUpload, onError, acceptedTypes, path]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize,
    multiple
  });

  const handleFileUpload = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      setUploading(true);
      const totalFiles = acceptedFiles.length;
      toast.loading(`Uploading ${totalFiles} file${totalFiles > 1 ? 's' : ''}...`, { id: uploadFileToastId });

      const results: MediaFile[] = [];
      let successCount = 0;
      let failCount = 0;

      for (const file of acceptedFiles) {
        try {
          const type = getMediaType(file.type);

          if (!acceptedTypes.includes(type)) {
            throw new Error(`File type not supported: ${file.name}`);
          }

          const result = await mediaService.uploadFile({
            file,
            type,
            path
          });

          results.push(result);
          successCount++;
          onUpload(result);
        } catch (fileError) {
          failCount++;
          console.error(`Failed to upload ${file.name}:`, fileError);
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} file${successCount > 1 ? 's' : ''} uploaded successfully!`, {
          id: uploadFileToastId,
          description: failCount > 0 ? `${failCount} file${failCount > 1 ? 's' : ''} failed` : undefined
        });
      } else {
        toast.error("Failed to upload files", {
          id: uploadFileToastId
        });
      }

      setUploadResults(results);
      
      if (results.length > 0) {
        setAcceptedFiles([]);
      }
    } catch (error) {
      const err = error as Error;
      toast.error("Failed to upload media", {
        id: uploadFileToastId,
        description: err.message
      });
      onError(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Card
        {...getRootProps()}
        className={cn(
          `p-0 w-full min-h-40 py-8 flex items-center justify-center border border-dashed rounded-lg ${
            isDragActive ? "border-foreground/60" : ""
          } transition-all ease-in-out duration-100 hover:bg-foreground/5`,
          className
        )}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-4">
          {/* Icon component */}
          <div className="relative group">
            <ImagesIcon className={`size-8 opacity-90`} />
            <div className="absolute -bottom-2 -right-2 size-6 rounded-full bg-background flex items-center justify-center border">
              {!uploading ? (
                <UploadIcon className="size-4" strokeWidth={2} />
              ) : (
                <Loader className="size-4 animate-spin" strokeWidth={2} />
              )}
            </div>
          </div>

          <div className="space-y-1 flex flex-col items-center">
            {uploading ? (
              <p className="text-sm animate-pulse">Uploading Media...</p>
            ) : isDragActive ? (
              <p className="text-sm animate-pulse">Drop the file here</p>
            ) : (
              <p className="text-sm">Drag & drop {multiple ? 'files' : 'a file'}, or click to select</p>
            )}

            <p className="text-xs text-foreground/60">
              {acceptedTypes.join(", ")} files only, Max size:{" "}
              {maxSize / (1024 * 1024)}MB
            </p>
          </div>

          {acceptedFiles.length > 0 ? (
            <Button
              type="button"
              size="sm"
              onClick={handleFileUpload}
              disabled={uploading}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              Upload {acceptedFiles.length} File{acceptedFiles.length > 1 ? 's' : ''}
            </Button>
          ) : (
            <Button type="button" size="sm" variant={"outline"}>
              Select File{multiple ? 's' : ''}
            </Button>
          )}
        </div>
      </Card>

      {acceptedFiles.length > 0 && uploadResults.length === 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{acceptedFiles.length} file{acceptedFiles.length > 1 ? 's' : ''} selected</p>
            <Button
              type="button"
              variant={"ghost"}
              size="sm"
              className="underline"
              onClick={() => setAcceptedFiles([])}
            >
              Clear All
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {acceptedFiles.map((file, index) => (
              <div key={index} className="relative">
                <Image
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  width={80}
                  height={80}
                  className="rounded-md w-full h-20 object-cover"
                />
                <p className="text-xs truncate mt-1">{file.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {uploadResults.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">{uploadResults.length} file{uploadResults.length > 1 ? 's' : ''} uploaded successfully</p>
          <div className="flex flex-wrap gap-2">
            {uploadResults.map((result, index) => (
              <TooltipProvider key={index}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant={"secondary"} className="cursor-pointer">
                      <Link href={result.url} passHref target="_blank">
                        Preview {index + 1}
                      </Link>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{result.filename}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
