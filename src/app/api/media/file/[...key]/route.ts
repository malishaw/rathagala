export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getS3Config } from "@/modules/media/config";
import { getObjectR2 } from "@/modules/media/r2-fetch";

function getContentTypeFromFilename(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "svg":
      return "image/svg+xml";
    case "pdf":
      return "application/pdf";
    case "mp4":
      return "video/mp4";
    case "webm":
      return "video/webm";
    default:
      return "application/octet-stream";
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const keyArray = resolvedParams.key || [];
    const key = keyArray.map((segment) => decodeURIComponent(segment)).join("/");

    if (!key) {
      return NextResponse.json({ error: "Missing file key" }, { status: 400 });
    }

    const config = getS3Config();
    if (
      !config.bucket ||
      !config.accountId ||
      !config.accessKeyId ||
      !config.secretAccessKey
    ) {
      return NextResponse.json(
        { error: "Storage credentials missing" },
        { status: 500 }
      );
    }

    const { body, contentType: r2ContentType, contentLength } = await getObjectR2({
      accountId: config.accountId,
      bucket: config.bucket,
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      key,
    });

    const fallbackType = getContentTypeFromFilename(key);
    const contentType =
      r2ContentType && r2ContentType !== "application/octet-stream"
        ? r2ContentType
        : fallbackType;

    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    if (contentLength) {
      headers.set("Content-Length", contentLength.toString());
    }

    return new Response(body as any, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Error serving media file from R2:", error);
    return NextResponse.json(
      { error: "File not found or error fetching media" },
      { status: 404 }
    );
  }
}
