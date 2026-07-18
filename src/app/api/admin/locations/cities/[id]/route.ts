export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/server/db";
import { cities } from "@/server/db/schema";
import { eq } from "drizzle-orm";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") return null;
  return session;
}

// DELETE - Delete a single city
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const deleted = await db.delete(cities).where(eq(cities.id, id)).returning();
    if (deleted.length === 0) throw new Error("Not found");
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "City not found" }, { status: 404 });
  }
}
