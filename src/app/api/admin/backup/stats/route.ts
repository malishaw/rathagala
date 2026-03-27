import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/server/prisma/client";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") return null;
  return session;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const stats = await prisma.$runCommandRaw({ dbStats: 1 }) as Record<string, number>;
    return NextResponse.json({
      dataSize: stats.dataSize ?? 0,
      storageSize: stats.storageSize ?? 0,
      collections: stats.collections ?? 0,
    });
  } catch {
    return NextResponse.json({ error: "Failed to retrieve database stats" }, { status: 500 });
  }
}
