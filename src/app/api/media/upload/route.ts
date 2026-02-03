import { NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { S3Client } from '@aws-sdk/client-s3';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/server/prisma/client';
import crypto from 'crypto';
import sharp from 'sharp';

// Server-side S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const hash = crypto.randomBytes(8).toString("hex");
  const name = originalName.split(".")[0];
  const extension = originalName.split(".").pop();
  return `${name}-${timestamp}-${hash}.${extension}`;
}

function getMediaType(fileType: string): 'IMAGE' | 'VIDEO' | 'PDF' | 'OTHER' {
  if (fileType.startsWith('image/')) return 'IMAGE';
  if (fileType.startsWith('video/')) return 'VIDEO';
  if (fileType === 'application/pdf') return 'PDF';
  return 'OTHER';
}

async function compressImage(buffer: Buffer, originalType: string): Promise<Buffer> {
  const MAX_DIMENSION = 1000;
  const TARGET_SIZE_KB = 500;
  const DPI = 72;

  try {
    // Get image metadata
    const metadata = await sharp(buffer).metadata();
    const { width = 0, height = 0 } = metadata;

    // Calculate new dimensions maintaining aspect ratio
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

    // Start with quality 90 and adjust if needed
    let quality = 90;
    let compressedBuffer: Buffer;
    
    // Determine output format (preserve original or convert to JPEG for better compression)
    const isJpeg = originalType === 'image/jpeg' || originalType === 'image/jpg';
    const isPng = originalType === 'image/png';
    const isWebp = originalType === 'image/webp';

    // Initial compression
    let sharpInstance = sharp(buffer)
      .resize(newWidth, newHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .withMetadata({ density: DPI }); // Set DPI to 72

    if (isJpeg) {
      compressedBuffer = await sharpInstance
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();
    } else if (isPng) {
      compressedBuffer = await sharpInstance
        .png({ quality, compressionLevel: 9 })
        .toBuffer();
    } else if (isWebp) {
      compressedBuffer = await sharpInstance
        .webp({ quality })
        .toBuffer();
    } else {
      // For other formats, convert to JPEG
      compressedBuffer = await sharpInstance
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();
    }

    // If still too large, reduce quality iteratively
    const targetSizeBytes = TARGET_SIZE_KB * 1024;
    while (compressedBuffer.length > targetSizeBytes && quality > 60) {
      quality -= 5;
      
      sharpInstance = sharp(buffer)
        .resize(newWidth, newHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .withMetadata({ density: DPI });

      if (isJpeg || !isPng && !isWebp) {
        compressedBuffer = await sharpInstance
          .jpeg({ quality, mozjpeg: true })
          .toBuffer();
      } else if (isPng) {
        compressedBuffer = await sharpInstance
          .png({ quality, compressionLevel: 9 })
          .toBuffer();
      } else if (isWebp) {
        compressedBuffer = await sharpInstance
          .webp({ quality })
          .toBuffer();
      }
    }

    console.log(`Image compressed: ${(buffer.length / 1024).toFixed(2)}KB → ${(compressedBuffer.length / 1024).toFixed(2)}KB (${newWidth}x${newHeight}, quality: ${quality})`);
    
    return compressedBuffer;
  } catch (error) {
    console.error('Image compression error:', error);
    // If compression fails, return original buffer
    return buffer;
  }
}

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const path = (formData.get('path') as string) || '';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const filename = generateUniqueFileName(file.name);
    const key = path ? `${path}/${filename}` : filename;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    let buffer = Buffer.from(arrayBuffer);

    // Compress image if it's an image file
    const mediaType = getMediaType(file.type);
    let finalContentType = file.type;
    let finalSize = file.size;

    if (mediaType === 'IMAGE') {
      buffer = await compressImage(buffer, file.type);
      finalSize = buffer.length;
      
      // Update content type if format was changed during compression
      if (!file.type.startsWith('image/jpeg') && 
          !file.type.startsWith('image/png') && 
          !file.type.startsWith('image/webp')) {
        finalContentType = 'image/jpeg';
      }
    }

    const bucket = process.env.AWS_S3_BUCKET;
    const region = process.env.AWS_REGION;

    // Upload to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: finalContentType,
        
        CacheControl: 'max-age=31536000'
      })
    );

    // Build the URL
    const encodedKey = key.split('/').map(encodeURIComponent).join('/');
    const url = `https://${bucket}.s3.${region}.amazonaws.com/${encodedKey}`;

    // Save to database
    const media = await prisma.media.create({
      data: {
        url,
        type: mediaType,
        filename,
        size: finalSize,
        uploaderId: session.user.id
      }
    });

    return NextResponse.json({
      id: media.id,
      url: media.url,
      type: media.type,
      filename: media.filename,
      size: media.size,
      createdAt: media.createdAt
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
