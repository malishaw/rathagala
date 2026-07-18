export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { s3Client, s3Config } from '@/modules/media/config';

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
        Bucket: s3Config.bucket,
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
