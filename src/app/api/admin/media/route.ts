import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/server/prisma/client";

// GET - List all media (admin only)
export async function GET() {
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

    // Fetch media without include to avoid relation errors on orphaned records
    const mediaRecords = await prisma.media.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Collect unique uploader IDs and fetch users separately
    const uploaderIds = [...new Set(mediaRecords.map((m) => m.uploaderId))];
    const users = await prisma.user.findMany({
      where: { id: { in: uploaderIds } },
      select: { id: true, name: true, email: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const media = mediaRecords.map((m) => ({
      ...m,
      uploader: userMap.get(m.uploaderId) || null,
    }));

    return NextResponse.json({ media });
  } catch (error) {
    console.error("Admin media list error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch media" },
      { status: 500 }
    );
  }
}
