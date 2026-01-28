import { NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { S3Client } from '@aws-sdk/client-s3';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/server/prisma/client';
import crypto from 'crypto';

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
    const buffer = Buffer.from(arrayBuffer);

    const bucket = process.env.AWS_S3_BUCKET;
    const region = process.env.AWS_REGION;

    // Upload to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: file.type,
        
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
        type: getMediaType(file.type),
        filename,
        size: file.size,
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
