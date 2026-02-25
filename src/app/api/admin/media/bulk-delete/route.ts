import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/server/prisma/client";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

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

// POST - Bulk delete media (admin only)
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

    const { ids } = await req.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "An array of media IDs is required" },
        { status: 400 }
      );
    }

    // First, get all media records to extract S3 keys
    const mediaRecords = await prisma.media.findMany({
      where: { id: { in: ids } },
    });

    // Delete associated AdMedia join records first (no cascade in schema)
    await prisma.adMedia.deleteMany({
      where: { mediaId: { in: ids } },
    });

    // Delete from S3
    const s3Errors: string[] = [];
    for (const media of mediaRecords) {
      try {
        const key = extractKeyFromUrl(media.url);
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: key,
          })
        );
      } catch (err) {
        s3Errors.push(`S3 delete failed for ${media.id}: ${err}`);
      }
    }

    // Delete from database
    const result = await prisma.media.deleteMany({
      where: { id: { in: ids } },
    });

    return NextResponse.json({
      deleted: result.count,
      s3Errors: s3Errors.length > 0 ? s3Errors : undefined,
    });
  } catch (error) {
    console.error("Admin media bulk-delete error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete media" },
      { status: 500 }
    );
  }
}
