export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getS3Config } from '@/modules/media/config';
import { deleteObjectR2 } from '@/modules/media/r2-fetch';

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

    const config = getS3Config();
    if (!config.bucket || !config.accountId || !config.accessKeyId || !config.secretAccessKey) {
      throw new Error("Cloudflare R2 credentials missing or unconfigured.");
    }

    // Delete from R2 using pure fetch SigV4
    await deleteObjectR2({
      accountId: config.accountId,
      bucket: config.bucket,
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      key
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Delete failed' },
      { status: 500 }
    );
  }
}
