import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/server/prisma/client";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") return null;
  return session;
}

// GET - List districts by provinceId
export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const provinceId = req.nextUrl.searchParams.get("provinceId");
  const where = provinceId ? { provinceId } : {};
  const districts = await prisma.district.findMany({
    where,
    orderBy: { name: "asc" },
    include: { _count: { select: { cities: true } } },
  });
  return NextResponse.json({ districts });
}

// POST - Create district
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { name, provinceId } = await req.json();
  if (!name?.trim() || !provinceId) {
    return NextResponse.json({ error: "Name and provinceId are required" }, { status: 400 });
  }
  try {
    const district = await prisma.district.create({
      data: { name: name.trim(), provinceId },
    });
    return NextResponse.json({ district }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "District already exists in this province" }, { status: 409 });
  }
}
