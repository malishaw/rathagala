import { NextResponse } from 'next/server';
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// Server-side S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

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

    const { key } = await req.json();

    if (!key) {
      return NextResponse.json(
        { error: 'No key provided' },
        { status: 400 }
      );
    }

    // Delete from S3
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Delete failed' },
      { status: 500 }
    );
  }
}
