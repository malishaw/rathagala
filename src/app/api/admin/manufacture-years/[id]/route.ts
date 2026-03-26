import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/server/prisma/client";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") return null;
  return session;
}

// PUT - Update a manufacture year
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const { year } = await req.json();
  if (!year?.trim()) {
    return NextResponse.json({ error: "Year is required" }, { status: 400 });
  }
  try {
    const record = await prisma.manufactureYear.update({
      where: { id },
      data: { year: year.trim() },
    });
    return NextResponse.json({ year: record });
  } catch {
    return NextResponse.json({ error: "Year already exists or not found" }, { status: 409 });
  }
}

// DELETE - Remove a manufacture year
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await prisma.manufactureYear.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
