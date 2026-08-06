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
    const contentType = file.type || "image/jpeg";

    let url = "";
    try {
      const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.NEXT_PUBLIC_R2_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
      const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.NEXT_PUBLIC_R2_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

      if (!s3Config.bucket || !s3Config.accountId || !accessKeyId || !secretAccessKey) {
        throw new Error("Cloudflare R2 storage credentials (R2_BUCKET_NAME, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY) are missing or not configured in environment variables.");
      }
      // Upload to Cloudflare R2
      await s3Client.send(
        new PutObjectCommand({
          Bucket: s3Config.bucket,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        })
      );
      url = `${s3Config.baseUrl}/${key}`;
    } catch (r2Error) {
      console.warn("Cloudflare R2 upload fallback triggered:", r2Error);
      try {
        const fs = await import("fs/promises");
        const pathModule = await import("path");
        const uploadDir = pathModule.join(process.cwd(), "public", "uploads");
        await fs.mkdir(uploadDir, { recursive: true });
        const localFilePath = pathModule.join(uploadDir, uniqueFileName);
        await fs.writeFile(localFilePath, buffer);
        url = `/uploads/${uniqueFileName}`;
      } catch (fsError) {
        console.error("Local storage fallback failed:", fsError);
        const r2Message = r2Error instanceof Error ? r2Error.message : String(r2Error);
        throw new Error(`Media upload failed. Storage error: ${r2Message}`);
      }
    }

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
