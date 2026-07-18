export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/server/db";
import { media as mediaSchema } from "@/server/db/schema";
import { s3Client, s3Config } from "@/modules/media/config";
import { generateUniqueFileName, getMediaType } from "@/modules/media/utils";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const path = formData.get("path") as string || "";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const originalName = file.name;
    const uniqueFileName = generateUniqueFileName(originalName);
    const key = path ? `${path}/${uniqueFileName}` : uniqueFileName;
    const contentType = file.type;

    // Upload to Cloudflare R2
    await s3Client.send(
      new PutObjectCommand({
        Bucket: s3Config.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );

    const url = `${s3Config.baseUrl}/${key}`;
    const mediaType = getMediaType(contentType);

    // Save to Database
    const [createdMedia] = await db.insert(mediaSchema).values({
      url,
      filename: originalName,
      type: mediaType,
      size: file.size,
      uploaderId: session.user.id,
    }).returning();

    return NextResponse.json(createdMedia, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
