import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/server/prisma/client";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") return null;
  return session;
}

// GET - List cities by districtId
export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const districtId = req.nextUrl.searchParams.get("districtId");
  if (!districtId) {
    return NextResponse.json({ error: "districtId is required" }, { status: 400 });
  }
  const cities = await prisma.city.findMany({
    where: { districtId },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ cities });
}

// POST - Bulk upsert cities from comma-separated string
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { districtId, citiesText } = await req.json();
  if (!districtId || typeof citiesText !== "string") {
    return NextResponse.json({ error: "districtId and citiesText are required" }, { status: 400 });
  }

  const cityNames = citiesText
    .split(",")
    .map((c: string) => c.trim())
    .filter(Boolean);

  if (cityNames.length === 0) {
    // Delete all cities for this district
    await prisma.city.deleteMany({ where: { districtId } });
    return NextResponse.json({ cities: [] });
  }

  // Delete existing and re-create (clean replace)
  await prisma.city.deleteMany({ where: { districtId } });
  await prisma.city.createMany({
    data: cityNames.map((name: string) => ({ name, districtId })),
  });

  const created = await prisma.city.findMany({
    where: { districtId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ cities: created, count: created.length }, { status: 201 });
}
