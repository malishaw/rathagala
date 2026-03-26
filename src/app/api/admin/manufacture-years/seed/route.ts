import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/server/prisma/client";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") return null;
  return session;
}

export async function POST() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allYears = Array.from({ length: 2026 - 1970 + 1 }, (_, i) => String(1970 + i));

  const existing = await prisma.manufactureYear.findMany({ select: { year: true } });
  const existingSet = new Set(existing.map((y) => y.year));
  const missing = allYears.filter((y) => !existingSet.has(y));

  if (missing.length > 0) {
    await prisma.manufactureYear.createMany({
      data: missing.map((year) => ({ year })),
    });
  }

  return NextResponse.json({ inserted: missing.length, total: allYears.length });
}
