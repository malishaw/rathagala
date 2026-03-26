import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/server/prisma/client";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    return null;
  }
  return session;
}

// GET - List all provinces
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const provinces = await prisma.province.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { districts: true } } },
  });
  return NextResponse.json({ provinces });
}

// POST - Create province
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { name } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  try {
    const province = await prisma.province.create({ data: { name: name.trim() } });
    return NextResponse.json({ province }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Province already exists" }, { status: 409 });
  }
}
