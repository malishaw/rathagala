export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { media as mediaSchema } from "@/server/db/schema";
import { MediaType } from "@/modules/media/types";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    }).catch(() => null);
    const uploaderId = session?.user?.id || null;

    const body = await req.json().catch(() => ({}));
    const { url, filename, type = "IMAGE", size = 0 } = body;

    if (!url || !filename) {
      return NextResponse.json(
        { error: "URL and filename are required" },
        { status: 400 }
      );
    }

    const [createdMedia] = await db
      .insert(mediaSchema)
      .values({
        url,
        filename,
        type: type as MediaType,
        size: Number(size) || 0,
        uploaderId,
      })
      .returning();

    return NextResponse.json(createdMedia, { status: 201 });
  } catch (error: any) {
    console.error("Media confirmation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to confirm media record" },
      { status: 500 }
    );
  }
}
