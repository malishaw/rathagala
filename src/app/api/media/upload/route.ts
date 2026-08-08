export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/server/db";
import { media as mediaSchema } from "@/server/db/schema";
import { getS3Config } from "@/modules/media/config";
import { putObjectR2 } from "@/modules/media/r2-fetch";
import { generateUniqueFileName, getMediaType } from "@/modules/media/utils";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    }).catch(() => null);
    const uploaderId = session?.user?.id || null;

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const path = (formData.get("path") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    const originalName = file.name;
    const uniqueFileName = generateUniqueFileName(originalName);
    const key = path ? `${path}/${uniqueFileName}` : uniqueFileName;
    const contentType = file.type || "image/jpeg";

    const config = getS3Config();
    if (!config.bucket || !config.accountId || !config.accessKeyId || !config.secretAccessKey) {
      throw new Error(
        `Cloudflare R2 storage credentials missing or unconfigured: bucket=${!!config.bucket}, accountId=${!!config.accountId}, accessKeyId=${!!config.accessKeyId}, secretAccessKey=${!!config.secretAccessKey}`
      );
    }

    // Upload directly to Cloudflare R2 using fetch & SigV4 (zero Node fs/@aws-sdk dependencies)
    await putObjectR2({
      accountId: config.accountId,
      bucket: config.bucket,
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      key,
      body: buffer,
      contentType,
    });

    const url = `${config.baseUrl}/${key}`;
    const mediaType = getMediaType(contentType);

    // Save to Database
    const [createdMedia] = await db
      .insert(mediaSchema)
      .values({
        url,
        filename: originalName,
        type: mediaType,
        size: file.size,
        uploaderId,
      })
      .returning();

    return NextResponse.json(createdMedia, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
