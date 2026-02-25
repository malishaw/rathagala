import { NextResponse } from "next/server";
import { PutObjectCommand, DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/server/prisma/client";
import crypto from "crypto";
import sharp from "sharp";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION,
  credentials: {
    accessKeyId: (process.env.AWS_ACCESS_KEY_ID || process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID)!,
    secretAccessKey: (process.env.AWS_SECRET_ACCESS_KEY || process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY)!,
  },
});

function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const hash = crypto.randomBytes(8).toString("hex");
  const name = originalName.split(".")[0];
  const extension = originalName.split(".").pop();
  return `${name}-${timestamp}-${hash}.${extension}`;
}

function getMediaType(fileType: string): "IMAGE" | "VIDEO" | "PDF" | "OTHER" {
  if (fileType.startsWith("image/")) return "IMAGE";
  if (fileType.startsWith("video/")) return "VIDEO";
  if (fileType === "application/pdf") return "PDF";
  return "OTHER";
}

function extractKeyFromUrl(url: string): string {
  const bucket = process.env.AWS_S3_BUCKET || process.env.NEXT_PUBLIC_AWS_S3_BUCKET;
  const region = process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION;
  const baseUrl = `https://${bucket}.s3.${region}.amazonaws.com`;
  const baseUrlWithoutProtocol = baseUrl.replace(/^https?:\/\//, "");
  const remainder = url.replace(/^https?:\/\//, "").replace(baseUrlWithoutProtocol + "/", "");
  try {
    return decodeURIComponent(remainder);
  } catch {
    return remainder;
  }
}

async function compressImage(buffer: Buffer, originalType: string): Promise<Buffer> {
  const MAX_DIMENSION = 1000;
  const TARGET_SIZE_KB = 500;
  const DPI = 72;

  try {
    const metadata = await sharp(buffer).metadata();
    const { width = 0, height = 0 } = metadata;

    let newWidth = width;
    let newHeight = height;

    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      const aspectRatio = width / height;
      if (width > height) {
        newWidth = MAX_DIMENSION;
        newHeight = Math.round(MAX_DIMENSION / aspectRatio);
      } else {
        newHeight = MAX_DIMENSION;
        newWidth = Math.round(MAX_DIMENSION * aspectRatio);
      }
    }

    let quality = 90;
    let compressedBuffer: Buffer;

    const isJpeg = originalType === "image/jpeg" || originalType === "image/jpg";
    const isPng = originalType === "image/png";
    const isWebp = originalType === "image/webp";

    let sharpInstance = sharp(buffer)
      .resize(newWidth, newHeight, { fit: "inside", withoutEnlargement: true })
      .withMetadata({ density: DPI });

    if (isJpeg) {
      compressedBuffer = await sharpInstance.jpeg({ quality, mozjpeg: true }).toBuffer();
    } else if (isPng) {
      compressedBuffer = await sharpInstance.png({ quality, compressionLevel: 9 }).toBuffer();
    } else if (isWebp) {
      compressedBuffer = await sharpInstance.webp({ quality }).toBuffer();
    } else {
      compressedBuffer = await sharpInstance.jpeg({ quality, mozjpeg: true }).toBuffer();
    }

    const targetSizeBytes = TARGET_SIZE_KB * 1024;
    while (compressedBuffer.length > targetSizeBytes && quality > 60) {
      quality -= 5;
      sharpInstance = sharp(buffer)
        .resize(newWidth, newHeight, { fit: "inside", withoutEnlargement: true })
        .withMetadata({ density: DPI });

      if (isJpeg || (!isPng && !isWebp)) {
        compressedBuffer = await sharpInstance.jpeg({ quality, mozjpeg: true }).toBuffer();
      } else if (isPng) {
        compressedBuffer = await sharpInstance.png({ quality, compressionLevel: 9 }).toBuffer();
      } else if (isWebp) {
        compressedBuffer = await sharpInstance.webp({ quality }).toBuffer();
      }
    }

    return compressedBuffer;
  } catch {
    return buffer;
  }
}

// POST - Replace media file (admin only)
export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const mediaId = formData.get("mediaId") as string;

    if (!file || !mediaId) {
      return NextResponse.json(
        { error: "File and mediaId are required" },
        { status: 400 }
      );
    }

    // Get existing media record
    const existingMedia = await prisma.media.findUnique({
      where: { id: mediaId },
    });

    if (!existingMedia) {
      return NextResponse.json(
        { error: "Media not found" },
        { status: 404 }
      );
    }

    // Delete old file from S3
    try {
      const oldKey = extractKeyFromUrl(existingMedia.url);
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: oldKey,
        })
      );
    } catch (err) {
      console.error("Failed to delete old S3 object:", err);
    }

    // Upload new file
    const filename = generateUniqueFileName(file.name);
    // Extract path from old URL to maintain folder structure
    const oldKey = extractKeyFromUrl(existingMedia.url);
    const pathParts = oldKey.split("/");
    pathParts.pop(); // remove old filename
    const path = pathParts.join("/");
    const key = path ? `${path}/${filename}` : filename;

    const arrayBuffer = await file.arrayBuffer();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let buffer: any = Buffer.from(arrayBuffer);

    const mediaType = getMediaType(file.type);
    let finalContentType = file.type;
    let finalSize = file.size;

    if (mediaType === "IMAGE") {
      buffer = await compressImage(buffer, file.type);
      finalSize = buffer.length;
      if (
        !file.type.startsWith("image/jpeg") &&
        !file.type.startsWith("image/png") &&
        !file.type.startsWith("image/webp")
      ) {
        finalContentType = "image/jpeg";
      }
    }

    const bucket = process.env.AWS_S3_BUCKET || process.env.NEXT_PUBLIC_AWS_S3_BUCKET;
    const region = process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: finalContentType,
        CacheControl: "max-age=31536000",
      })
    );

    const encodedKey = key.split("/").map(encodeURIComponent).join("/");
    const url = `https://${bucket}.s3.${region}.amazonaws.com/${encodedKey}`;

    // Update database record
    const updatedMedia = await prisma.media.update({
      where: { id: mediaId },
      data: {
        url,
        type: mediaType,
        filename,
        size: finalSize,
      },
    });

    return NextResponse.json({ media: updatedMedia });
  } catch (error) {
    console.error("Admin media replace error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Replace failed" },
      { status: 500 }
    );
  }
}
