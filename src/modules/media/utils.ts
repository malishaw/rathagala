import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

import { s3Client, s3Config } from "@/modules/media/config";
import { MediaType } from "@/modules/media/types";

// Utility functions
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const hash = crypto.randomBytes(8).toString("hex");

  const parts = originalName.split(".");
  const extension = parts.length > 1 ? parts.pop()?.toLowerCase() : "jpg";
  const rawBaseName = parts.join(".");
  const sanitizedBaseName = rawBaseName
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .substring(0, 50) || "file";

  return `${sanitizedBaseName}-${timestamp}-${hash}.${extension}`;
}

export function getMediaType(fileType: string): MediaType {
  if (!fileType) return "IMAGE";
  if (fileType.startsWith("image/")) return "IMAGE";
  if (fileType.startsWith("video/")) return "VIDEO";
  if (fileType.includes("pdf")) return "PDF";
  return "OTHER";
}

export async function generatePresignedUrl(key: string, expiresIn = 24 * 3600) {
  const command = new PutObjectCommand({
    Bucket: s3Config.bucket,
    Key: key
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}
