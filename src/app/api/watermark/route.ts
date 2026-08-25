export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    // Redirect directly to the source image URL with caching (Zero Worker CPU)
    return NextResponse.redirect(new URL(imageUrl, request.url), {
      status: 302,
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid image URL" },
      { status: 400 }
    );
  }
}
