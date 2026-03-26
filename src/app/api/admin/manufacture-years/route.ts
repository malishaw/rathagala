import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/server/prisma/client";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") return null;
  return session;
}

// GET - List all manufacture years
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const years = await prisma.manufactureYear.findMany({
    orderBy: { year: "desc" },
  });
  return NextResponse.json({ years });
}

// POST - Create a manufacture year
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { year } = await req.json();
  if (!year?.trim()) {
    return NextResponse.json({ error: "Year is required" }, { status: 400 });
  }
  try {
    const record = await prisma.manufactureYear.create({ data: { year: year.trim() } });
    return NextResponse.json({ year: record }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Year already exists" }, { status: 409 });
  }
}
