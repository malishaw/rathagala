export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { AwsClient } from "aws4fetch";
import { auth } from "@/lib/auth";
import { getS3Config } from "@/modules/media/config";
import { generateUniqueFileName, getMediaType } from "@/modules/media/utils";

const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/avif",
  "application/pdf",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    }).catch(() => null);

    const body = await req.json().catch(() => ({}));
    const { filename, contentType = "image/jpeg", path = "ads" } = body;

    if (!filename) {
      return NextResponse.json(
        { error: "Filename is required" },
        { status: 400 }
      );
    }

    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${contentType}` },
        { status: 400 }
      );
    }

    const config = getS3Config();
    if (
      !config.bucket ||
      !config.accountId ||
      !config.accessKeyId ||
      !config.secretAccessKey
    ) {
      return NextResponse.json(
        { error: "Cloudflare R2 storage credentials are not configured" },
        { status: 500 }
      );
    }

    const uniqueFileName = generateUniqueFileName(filename);
    const key = path ? `${path}/${uniqueFileName}` : uniqueFileName;
    const mediaType = getMediaType(contentType);

    const r2 = new AwsClient({
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      service: "s3",
    });

    const s3Endpoint = `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucket}/${key}`;
    const url = new URL(s3Endpoint);
    url.searchParams.set("X-Amz-Expires", "600"); // 10 minutes valid

    // Sign the PUT request with SigV4 in query parameters
    const signed = await r2.sign(
      new Request(url.toString(), {
        method: "PUT",
        headers: {
          "Content-Type": contentType,
        },
      }),
      {
        aws: { signQuery: true },
      }
    );

    const publicUrl = `${config.baseUrl}/${key}`;

    return NextResponse.json({
      uploadUrl: signed.url,
      publicUrl,
      key,
      filename: uniqueFileName,
      originalFilename: filename,
      type: mediaType,
      contentType,
    });
  } catch (error: any) {
    console.error("Presigned URL generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate presigned upload URL" },
      { status: 500 }
    );
  }
}
