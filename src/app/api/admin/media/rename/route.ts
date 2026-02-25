import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/server/prisma/client";

// POST - Rename media (admin only)
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

    const { id, filename } = await req.json();

    if (!id || !filename) {
      return NextResponse.json(
        { error: "Media ID and filename are required" },
        { status: 400 }
      );
    }

    const updatedMedia = await prisma.media.update({
      where: { id },
      data: { filename },
    });

    return NextResponse.json({ media: updatedMedia });
  } catch (error) {
    console.error("Admin media rename error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to rename media" },
      { status: 500 }
    );
  }
}
