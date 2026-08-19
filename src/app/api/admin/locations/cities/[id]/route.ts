export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/server/db";
import { cities } from "@/server/db/schema";
import { eq } from "drizzle-orm";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role?.toLowerCase() !== "admin") return null;
  return session;
}

// PUT - Update a single city
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const name = body?.name?.trim();

    if (!name) {
      return NextResponse.json({ error: "City name is required" }, { status: 400 });
    }

    const [updated] = await db
      .update(cities)
      .set({
        name,
        updatedAt: new Date(),
      })
      .where(eq(cities.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "City not found" }, { status: 404 });
    }

    return NextResponse.json({ city: updated });
  } catch (error: any) {
    console.error("[UPDATE CITY] Error:", error);
    if (error.code === "23505" || error.cause?.code === "23505") {
      return NextResponse.json(
        { error: "City with this name already exists in this district" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to update city" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a single city
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [deleted] = await db
      .delete(cities)
      .where(eq(cities.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "City not found" }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error("[DELETE CITY] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete city" },
      { status: 500 }
    );
  }
}
